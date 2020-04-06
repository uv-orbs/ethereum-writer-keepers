import test from 'ava';
import { dockerComposeTool } from 'docker-compose-mocha';
import { unlinkSync, writeFileSync } from 'fs';
import { exec } from 'child-process-promise';
import { retry } from 'ts-retry-promise';
import { join } from 'path';

export class TestEnvironment {
  private envName: string = '';

  constructor(private pathToDockerCompose: string) {}

  getAppConfig() {
    return {
      NodeManagementConfigUrl: 'http://management-service:8080/node/management',
    };
  }

  // runs all the docker instances with docker-compose
  launchServices() {
    // step 1 - launch management-service docker
    this.envName = dockerComposeTool(
      test.serial.before.bind(test.serial),
      test.serial.after.always.bind(test.serial.after),
      this.pathToDockerCompose,
      {
        startOnlyTheseServices: ['management-service'],
        containerCleanUp: false,
      } as any
    );

    // step 2 - write config file for app
    test.serial.before('write management service config file', async (t) => {
      const configFilePath = join(__dirname, 'app-config.json');
      try {
        unlinkSync(configFilePath);
      } catch (err) {}
      writeFileSync(configFilePath, JSON.stringify(this.getAppConfig()));
    });

    // step 3 - launch app docker
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
