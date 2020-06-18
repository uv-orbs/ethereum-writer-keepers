import * as Logger from '../logger';
import { State } from '../model/state';
import { writeFileSync } from 'fs';
import { ensureFileDirectoryExists, JsonResponse } from '../helpers';

const MINIMUM_ALLOWED_ETH_BALANCE_WEI = BigInt('20000000000000000');

export function writeStatusToDisk(filePath: string, state: State) {
  const status: JsonResponse = {
    Status: getStatusText(state),
    Timestamp: new Date().toISOString(),
    Payload: {
      NumVirtualChains: Object.keys(state.ManagementVirtualChains).length,
      EtherBalance: state.EtherBalance,
      VchainReputations: state.VchainReputations,
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
  res.push(`EtherBalance = ${state.EtherBalance}`);
  return res.join(', ');
}

function getErrorText(state: State) {
  const res = [];
  if (BigInt(state.EtherBalance) < MINIMUM_ALLOWED_ETH_BALANCE_WEI) {
    res.push(`Eth balance low: ${state.EtherBalance}.`);
  }
  return res.join(' ');
}
