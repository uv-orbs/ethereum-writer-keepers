import * as Logger from './logger';
import { sleep } from './helpers';
import { Configuration } from './config';
import { State } from './state';
import { writeStatus } from './write/status';
import { readNodeManagementConfig } from './read/management';

const runLoopPollIntervalSeconds = 1;

export async function runLoop(config: Configuration) {
  const state = initialState();
  writeStatus(config.StatusJsonPath, state);
  for (;;) {
    try {
      await sleep(runLoopPollIntervalSeconds * 1000);
      await runLoopTick(config, state);
    } catch (err) {
      Logger.log('Exception thrown during runLoop, going back to sleep:');
      Logger.error(err.stack);
    }
  }
}

function initialState(): State {
  return {
    LastStatusTime: new Date(),
    NumVirtualChains: 0,
  };
}

async function runLoopTick(config: Configuration, state: State) {
  Logger.log('Run loop waking up.');
  await readNodeManagementConfig(config.NodeManagementConfigUrl, state);
  writeStatus(config.StatusJsonPath, state);
}
