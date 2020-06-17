import * as Logger from './logger';
import { sleep } from './helpers';
import { Configuration } from './config';
import { State } from './model/state';
import { writeStatus } from './write/status';
import { readNodeManagementConfig } from './read/management';
import { initWeb3Client, readEtherBalance, sendEthereumVoteOutTransaction } from './write/ethereum';
import { readVirtualChainCounter } from './read/vchain';

export async function runLoop(config: Configuration) {
  const state = initializeState(config);
  for (;;) {
    try {
      await sleep(config.RunLoopPollTimeSeconds * 1000);
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
  await sendEthereumVoteOutTransaction(
    ['0x11f4d0A3c12e86B4b5F39B213F7E19D048276DAe'],
    config.NodeEthereumAddress,
    state
  ); // temp for testing
  await readVirtualChainCounter(42, config, state); // temp for testing
  writeStatus(config.StatusJsonPath, state);
}
