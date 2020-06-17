import * as Logger from './logger';
import { sleep, getCurrentClockTime } from './helpers';
import { Configuration } from './config';
import { State } from './model/state';
import { writeStatusToDisk } from './write/status';
import { readManagementStatus } from './read/management';
import { initWeb3Client, readEtherBalance, sendEthereumVoteOutTransaction } from './write/ethereum';
import { readVirtualChainCounter } from './read/vchain-reputation';
import { readAllVchainMetrics } from './read/vchain-metrics';

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
  return state;
}

// runs every 10 seconds in prod, 1 second in tests
async function runLoopTick(config: Configuration, state: State) {
  Logger.log('Run loop waking up.');

  // read all data

  // refresh all info from management-service, we don't mind doing this often (10s)
  await readManagementStatus(config.ManagementServiceEndpoint, config.NodeOrbsAddress, state);

  // refresh all vchain metrics to see if they're live and in sync, rate according to config
  if (getCurrentClockTime() - state.vchainMetricsLastPollTime > config.VchainMetricsPollTimeSeconds) {
    await readAllVchainMetrics(config.VirtualChainEndpointSchema, state);
  }

  await readEtherBalance(state);
  await readVirtualChainCounter(42, config, state); // temp for testing

  // update all (state machine) logic

  // write all data

  await sendEthereumVoteOutTransaction(['0x11f4d0A3c12e86B4b5F39B213F7E19D048276DAe'], config.NodeOrbsAddress, state); // temp for testing

  // write status.json file, we don't mind doing this often (10s)
  writeStatusToDisk(config.StatusJsonPath, state);
}
