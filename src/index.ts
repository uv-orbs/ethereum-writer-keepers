import * as Logger from './logger';
import { sleep, getCurrentClockTime } from './helpers';
import { Configuration } from './config';
import { State } from './model/state';
import { writeStatusToDisk } from './write/status';
import { readManagementStatus } from './read/management';
import { readAllVchainReputations } from './read/vchain-reputations';
import { readAllVchainMetrics } from './read/vchain-metrics';
import { calcVchainSyncStatus } from './model/logic-vcsync';
import { calcEthereumSyncStatus } from './model/logic-ethsync';
import { shouldNotifyReadyForCommittee, shouldNotifyReadyToSync } from './model/logic-elections';
import { getAllGuardiansToVoteUnready } from './model/logic-voteunready';
import Signer from 'orbs-signer-client';
import {
  initWeb3Client,
  readEtherBalance,
  readPendingTransactionStatus,
  sendEthereumElectionsTransaction,
  sendEthereumVoteUnreadyTransaction,
} from './write/ethereum';

// runs every 20 seconds in prod, 1 second in tests
async function runLoopTick(config: Configuration, state: State) {
  Logger.log('Run loop waking up.');

  // read all data

  // refresh all info from management-service, we don't mind doing this often (20s)
  await readManagementStatus(config.ManagementServiceEndpoint, config.NodeOrbsAddress, state);

  // refresh all vchain metrics to see if they're live and in sync, rate according to config
  if (getCurrentClockTime() - state.VchainMetricsLastPollTime > config.VchainMetricsPollTimeSeconds) {
    await readAllVchainMetrics(config.VirtualChainEndpointSchema, state);
  }

  // refresh all vchain reputations to prepare for vote unreadys, rate according to config
  if (getCurrentClockTime() - state.VchainReputationsLastPollTime > config.VchainReputationsPollTimeSeconds) {
    await readAllVchainReputations(config.VirtualChainEndpointSchema, config.OrbsReputationsContract, state);
  }

  // refresh pending ethereum transactions status for ready-to-sync / ready-for-comittee, rate according to config
  if (
    getCurrentClockTime() - (state.EthereumLastElectionsTx?.LastPollTime ?? 0) >
    config.EthereumPendingTxPollTimeSeconds
  ) {
    await readPendingTransactionStatus(state.EthereumLastElectionsTx, state, config);
  }

  // refresh pending ethereum transactions status for vote unreadys, rate according to config
  if (
    getCurrentClockTime() - (state.EthereumLastVoteUnreadyTx?.LastPollTime ?? 0) >
    config.EthereumPendingTxPollTimeSeconds
  ) {
    await readPendingTransactionStatus(state.EthereumLastVoteUnreadyTx, state, config);
  }

  // warn if we have low ether to pay tx fees, rate according to config
  if (getCurrentClockTime() - state.EthereumBalanceLastPollTime > config.EthereumBalancePollTimeSeconds) {
    await readEtherBalance(config.NodeOrbsAddress, state);
  }

  // update all state machine logic

  // vchain sync status state machine
  const newVchainSyncStatus = calcVchainSyncStatus(state, config);
  if (newVchainSyncStatus != state.VchainSyncStatus) {
    Logger.log(`VchainSyncStatus changing from ${state.VchainSyncStatus} to ${newVchainSyncStatus}.`);
    state.VchainSyncStatus = newVchainSyncStatus;
  }

  // ethereum elections notifications state machine
  const newEthereumSyncStatus = calcEthereumSyncStatus(state, config);
  if (newEthereumSyncStatus != state.EthereumSyncStatus) {
    Logger.log(`EthereumSyncStatus changing from ${state.EthereumSyncStatus} to ${newEthereumSyncStatus}.`);
    state.EthereumSyncStatus = newEthereumSyncStatus;
  }

  // write all data

  // send ready-to-sync / ready-for-comittee if needed, we don't mind checking this often (20s)
  if (shouldNotifyReadyForCommittee(state, config)) {
    Logger.log(`Decided to send ready-for-committee.`);
    await sendEthereumElectionsTransaction('ready-for-committee', config.NodeOrbsAddress, state, config);
  } else if (shouldNotifyReadyToSync(state, config)) {
    Logger.log(`Decided to send ready-to-sync.`);
    await sendEthereumElectionsTransaction('ready-to-sync', config.NodeOrbsAddress, state, config);
  }

  // send vote unreadys if needed, we don't mind checking this often (20s)
  const toVoteUnready = getAllGuardiansToVoteUnready(state, config);
  if (toVoteUnready.length > 0) {
    Logger.log(`Decided to send vote unreadys against validators: ${toVoteUnready.map((n) => n.EthAddress)}.`);
    await sendEthereumVoteUnreadyTransaction(toVoteUnready, config.NodeOrbsAddress, state, config);
  }

  // write status.json file, we don't mind doing this often (20s)
  writeStatusToDisk(config.StatusJsonPath, state, config);
}

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
  initWeb3Client(config.EthereumEndpoint, config.EthereumElectionsContract, state);
  state.signer = new Signer(config.SignerEndpoint);
  return state;
}
