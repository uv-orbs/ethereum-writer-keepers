import test from 'ava';
import { dockerComposeTool, getAddressForService, getLogsForService } from 'docker-compose-mocha';
import { unlinkSync, writeFileSync } from 'fs';
import { exec } from 'child-process-promise';
import { retry } from 'ts-retry-promise';
import { join } from 'path';
import { sleep } from '../src/helpers';
import HDWalletProvider from '@truffle/hdwallet-provider';
import Web3 from 'web3';
import { Driver as EthereumPosDriver } from '@orbs-network/orbs-ethereum-contracts-v2';
import BN from 'bn.js';
import { GammaDriver } from './gamma/driver';

export class TestEnvironment {
  private envName: string = '';
  public ethereumPosDriver: EthereumPosDriver;
  public gammaDriver: GammaDriver;
  public nodeEthereumAddress: string;

  constructor(private pathToDockerCompose: string) {}

  getAppConfig() {
    return {
      NodeManagementConfigUrl: 'http://management-service:8080/node/management',
      EthereumEndpoint: 'http://ganache:7545',
      EthereumElectionsContract: this.ethereumPosDriver.elections.address,
      NodeEthereumAddress: this.nodeEthereumAddress,
      VirtualChainUrlSchema: 'http://vchain-{{ID}}:8080',
      RunLoopPollTimeSeconds: 1,
    };
  }

  // runs all the docker instances with docker-compose
  launchServices() {
    // step 1 - launch ganache, management-service mock and gamma dockers
    this.envName = dockerComposeTool(
      test.serial.before.bind(test.serial),
      test.serial.after.always.bind(test.serial.after),
      this.pathToDockerCompose,
      {
        startOnlyTheseServices: ['ganache', 'management-service', 'vchain-42'],
        containerCleanUp: false,
      } as any
    );

    // step 2 - let ganache warm up
    test.serial.before('wait 5 seconds for ganache to warm up', async () => {
      await sleep(5000);
    });

    // step 3 - deploy ethereum PoS contracts to ganache
    test.serial.before('deploy ethereum PoS contracts to ganache', async (t) => {
      t.timeout(60 * 1000);
      const ganacheAddress = await getAddressForService(this.envName, this.pathToDockerCompose, 'ganache', 7545);
      this.ethereumPosDriver = await EthereumPosDriver.new({
        web3Provider: () => {
          return new Web3(
            new (HDWalletProvider as any)(
              'vanish junk genuine web seminar cook absurd royal ability series taste method identify elevator liquid',
              `http://localhost:${portFromAddress(ganacheAddress)}`,
              0,
              100,
              false
            )
          );
        },
      });
      // create the validator, give some stake (above minimum of 100) and register
      const validator = this.ethereumPosDriver.newParticipant();
      const stake = new BN(1000);
      await validator.stake(stake);
      await validator.registerAsValidator();
      this.nodeEthereumAddress = validator.address;
    });

    // step 4 - deploy Orbs contracts to gamma
    test.serial.before('deploy Orbs contracts to gamma', async (t) => {
      t.timeout(60 * 1000);
      // note that gamma virtual chain id is always hard-coded as 42
      const gammaAddress = await getAddressForService(this.envName, this.pathToDockerCompose, 'vchain-42', 8080);
      this.gammaDriver = await new GammaDriver().init(`http://localhost:${portFromAddress(gammaAddress)}`, 42);
    });

    // step 5 - write config file for app
    test.serial.before('write ethereum writer service config file', (t) => {
      const configFilePath = join(__dirname, 'app-config.json');
      try {
        unlinkSync(configFilePath);
      } catch (err) {}
      writeFileSync(configFilePath, JSON.stringify(this.getAppConfig()));
    });

    // step 6 - launch app docker
    dockerComposeTool(
      test.serial.before.bind(test.serial),
      test.serial.after.always.bind(test.serial.after),
      this.pathToDockerCompose,
      {
        envName: this.envName,
        startOnlyTheseServices: ['app'],
        shouldPullImages: false,
        cleanUp: false,
      } as any
    );

    // step 7 - print app logs from docker on failure
    test.serial.afterEach.always('print logs on failures', async (t) => {
      if (t.passed) return;
      const logs = await getLogsForService(this.envName, this.pathToDockerCompose, 'app');
      console.log(logs);
    });
  }

  // inspired by https://github.com/applitools/docker-compose-mocha/blob/master/lib/get-logs-for-service.js
  async catFileInService(serviceName: string, filePath: string) {
    return await retry(
      async () => {
        return (
          await exec(
            `docker-compose -p ${this.envName} -f "${this.pathToDockerCompose}" exec -T ${serviceName} cat "${filePath}"`
          )
        ).stdout;
      },
      { retries: 10, delay: 300 }
    );
  }
}

function portFromAddress(address: string) {
  return address.split(':')[1];
}
