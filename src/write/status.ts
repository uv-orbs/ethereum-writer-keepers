import * as Logger from '../logger';
import { State } from '../model/state';
import { writeFileSync } from 'fs';
import { ensureFileDirectoryExists, JsonResponse, getCurrentClockTime } from '../helpers';
import { Configuration } from '../config';

const MINIMUM_ALLOWED_ETH_BALANCE_WEI = BigInt('20000000000000000');

export function writeStatusToDisk(filePath: string, state: State, config: Configuration) {
  const status: JsonResponse = {
    Status: getStatusText(state),
    Timestamp: new Date().toISOString(),
    Payload: {
      Uptime: getCurrentClockTime() - state.ServiceLaunchTime,
      EthereumSyncStatus: state.EthereumSyncStatus,
      VchainSyncStatus: state.VchainSyncStatus,
      EthereumBalanceLastPollTime: state.EthereumBalanceLastPollTime,
      EtherBalance: state.EtherBalance,
      EthereumLastElectionsTx: state.EthereumLastElectionsTx,
      EthereumLastVoteOutTx: state.EthereumLastVoteOutTx,
      EthereumLastVoteOutTime: state.EthereumLastVoteOutTime,
      VchainReputationsLastPollTime: state.VchainReputationsLastPollTime,
      VchainReputations: state.VchainReputations,
      VchainMetricsLastPollTime: state.VchainMetricsLastPollTime,
      VchainMetrics: state.VchainMetrics,
      ManagementLastPollTime: state.ManagementLastPollTime,
      ManagementEthRefBlock: state.ManagementEthRefBlock,
      ManagementInCommittee: state.ManagementInCommittee,
      ManagementIsStandby: state.ManagementIsStandby,
      ManagementMyElectionStatus: state.ManagementMyElectionStatus,
      TimeEnteredStandbyWithoutVcSync: state.TimeEnteredStandbyWithoutVcSync,
      TimeEnteredBadReputation: state.TimeEnteredBadReputation,
      Config: config,
    },
  };

  // include error field if found errors
  const errorText = getErrorText(state);
  if (errorText) {
    status.Error = errorText;
  }

  // do the actual writing to local file
  ensureFileDirectoryExists(filePath);
  const content = JSON.stringify(status, null, 2);
  writeFileSync(filePath, content);

  // log progress
  Logger.log(`Wrote status JSON to ${filePath} (${content.length} bytes).`);
}

// helpers

function getStatusText(state: State) {
  const res = [];
  res.push();
  res.push(`EthereumSyncStatus = ${state.EthereumSyncStatus}`);
  res.push(`VchainSyncStatus = ${state.VchainSyncStatus}`);
  res.push(`EtherBalance = ${state.EtherBalance}`);
  return res.join(', ');
}

function getErrorText(state: State) {
  const res = [];
  if (state.EthereumSyncStatus == 'need-reset') {
    res.push(`Service requires reset.`);
  }
  if (BigInt(state.EtherBalance) < MINIMUM_ALLOWED_ETH_BALANCE_WEI) {
    res.push(`Eth balance low: ${state.EtherBalance}.`);
  }
  if (state.EthereumSyncStatus == 'out-of-sync') {
    res.push(`Eth is out of sync.`);
  }
  return res.join(' ');
}
