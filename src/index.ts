import * as Logger from './logger';
import { sleep, getCurrentClockTime } from './helpers';
import { Configuration } from './config';
import { State } from './model/state';
import { writeStatusToDisk } from './write/status';
import { readManagementStatus } from './read/management';
import { initWeb3Client, readEtherBalance, sendEthereumVoteOutTransaction } from './write/ethereum';
import { readAllVchainReputations } from './read/vchain-reputations';
import { readAllVchainMetrics } from './read/vchain-metrics';
import { calcVchainSyncStatus } from './model/statemachine-sync';
import { calcEthereumWriteStatus } from './model/statemachine-eth';

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
  if (getCurrentClockTime() - state.VchainMetricsLastPollTime > config.VchainMetricsPollTimeSeconds) {
    await readAllVchainMetrics(config.VirtualChainEndpointSchema, state);
  }

  // refresh all vchain reputations to prepare for vote outs, rate according to config
  if (getCurrentClockTime() - state.VchainReputationsLastPollTime > config.VchainReputationsPollTimeSeconds) {
    await readAllVchainReputations(config.VirtualChainEndpointSchema, config.OrbsReputationsContract, state);
  }

  await readEtherBalance(state);

  // update all state machine logic

  // vchain sync status state machine
  const newVchainSyncStatus = calcVchainSyncStatus(state, config);
  if (newVchainSyncStatus != state.VchainSyncStatus) {
    Logger.log(`VchainSyncStatus changing from ${state.VchainSyncStatus} to ${newVchainSyncStatus}.`);
    state.VchainSyncStatus = newVchainSyncStatus;
  }

  // ethereum notifications state machine
  const newEthereumWriteStatus = calcEthereumWriteStatus(state, config);
  if (newEthereumWriteStatus != state.EthereumWriteStatus) {
    Logger.log(`EthereumWriteStatus changing from ${state.EthereumWriteStatus} to ${newEthereumWriteStatus}.`);
    state.EthereumWriteStatus = newEthereumWriteStatus;
  }

  // write all data

  await sendEthereumVoteOutTransaction(['0x11f4d0A3c12e86B4b5F39B213F7E19D048276DAe'], config.NodeOrbsAddress, state); // temp for testing

  // write status.json file, we don't mind doing this often (10s)
  writeStatusToDisk(config.StatusJsonPath, state);
}
