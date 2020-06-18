import test from 'ava';
import { dockerComposeTool, getAddressForService } from 'docker-compose-mocha';
import { unlinkSync, writeFileSync } from 'fs';
import { exec } from 'child_process';
import { exec as execPromise } from 'child-process-promise';
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
  public nodeOrbsAddress: string;
  public testLogger: (lines: string) => void;

  constructor(private pathToDockerCompose: string) {}

  getAppConfig() {
    return {
      ManagementServiceEndpoint: 'http://management-service:8080',
      EthereumEndpoint: 'http://ganache:7545',
      EthereumElectionsContract: this.ethereumPosDriver.elections.address,
      NodeOrbsAddress: this.nodeOrbsAddress.substr(2).toLowerCase(), // remove "0x",
      VirtualChainEndpointSchema: 'http://vchain-{{ID}}:8080',
      RunLoopPollTimeSeconds: 1,
      VchainMetricsPollTimeSeconds: 1,
      VchainReputationsPollTimeSeconds: 1,
      OrbsReputationsContract: 'MockCommittee',
      VchainUptimeRequiredSeconds: 2,
      VchainSyncThresholdSeconds: 5 * 60,
      VchainOutOfSyncThresholdSeconds: 60 * 60,
      EthereumSyncRequirementSeconds: 20 * 60,
      FailToSyncVcsTimeoutSeconds: 24 * 60 * 60,
    };
  }

  // runs all the docker instances with docker-compose
  launchServices() {
    test.serial.before((t) => t.log('[E2E] driver launchServices() start'));

    // step 1 - launch ganache, management-service mock and gamma dockers
    test.serial.before((t) => t.log('[E2E] launch ganache, management-service, vchain-42 dockers'));
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
    test.serial.before(async (t) => {
      t.log('[E2E] wait 5 seconds for ganache to warm up');
      await sleep(5000);
    });

    // step 3 - deploy ethereum PoS contracts to ganache
    test.serial.before(async (t) => {
      t.log('[E2E] deploy ethereum PoS contracts to ganache');
      t.timeout(60 * 1000);
      const ganacheAddress = await getAddressForService(this.envName, this.pathToDockerCompose, 'ganache', 7545);
      console.log(`[posv2] about to deploy contracts`);
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
      console.log(`[posv2] about to set up initial node`);
      const validator = this.ethereumPosDriver.newParticipant();
      const stake = new BN(1000);
      await validator.stake(stake);
      await validator.registerAsValidator();
      this.nodeOrbsAddress = validator.address;
      console.log(`[posv2] driver.nodeOrbsAddress = ${this.nodeOrbsAddress}`);
    });

    // step 4 - deploy Orbs contracts to gamma
    test.serial.before(async (t) => {
      t.log('[E2E] deploy Orbs contracts to gamma');
      t.timeout(60 * 1000);
      // note that gamma virtual chain id is always hard-coded as 42
      const gammaAddress = await getAddressForService(this.envName, this.pathToDockerCompose, 'vchain-42', 8080);
      this.gammaDriver = await new GammaDriver().init(`http://localhost:${portFromAddress(gammaAddress)}`, 42);
    });

    // step 5 - write config file for app
    test.serial.before((t) => {
      t.log('[E2E] write config file for app');
      const configFilePath = join(__dirname, 'app-config.json');
      try {
        unlinkSync(configFilePath);
      } catch (err) {}
      writeFileSync(configFilePath, JSON.stringify(this.getAppConfig()));
    });

    // step 6 - launch app docker
    test.serial.before((t) => t.log('[E2E] launch app docker'));
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

    // // old step - print app logs from docker on failure
    // test.serial.afterEach.always('print logs on failures', async (t) => {
    //   if (t.passed) return;
    //   const logs = await getLogsForService(this.envName, this.pathToDockerCompose, 'app');
    //   console.log(logs);
    // });

    // step 7 - start live dump of logs from app to test logger
    test.serial.before(async (t) => {
      t.log('[E2E] start live dump of logs from app to test logger');
      const logP = exec(`docker-compose -p ${this.envName} -f "${this.pathToDockerCompose}" logs -f app`);
      this.testLogger = t.log;
      logP.stdout.on('data', (data) => {
        if (this.testLogger) this.testLogger(data);
      });
      logP.on('exit', () => {
        if (this.testLogger) this.testLogger(`app log exited`);
      });
    });

    test.serial.before((t) => t.log('[E2E] driver launchServices() finished'));
  }

  // inspired by https://github.com/applitools/docker-compose-mocha/blob/master/lib/get-logs-for-service.js
  async catFileInService(serviceName: string, filePath: string) {
    return await retry(
      async () => {
        return (
          await execPromise(
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
