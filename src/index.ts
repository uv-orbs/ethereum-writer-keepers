import * as Logger from './logger';
import { sleep } from './helpers';
import { Configuration } from './config';
import { State } from './state';
import { writeStatus } from './write/status';
import { readNodeManagementConfig } from './read/management';
import { initWeb3Client, readEtherBalance } from './write/ethereum';

const runLoopPollIntervalSeconds = 1;

export async function runLoop(config: Configuration) {
  const state = initializeState(config);
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

function initializeState(config: Configuration): State {
  const state = new State();
  initWeb3Client(config, state);
  writeStatus(config.StatusJsonPath, state);
  return state;
}

async function runLoopTick(config: Configuration, state: State) {
  Logger.log('Run loop waking up.');
  await readNodeManagementConfig(config.NodeManagementConfigUrl, state);
  await readEtherBalance(state);
  writeStatus(config.StatusJsonPath, state);
}
