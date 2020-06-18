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
      NumVirtualChains: Object.keys(state.managementVirtualChains).length,
      EtherBalance: state.etherBalance,
      OrbsCounter: state.vchainReputations['42']?.TempCounter.toString(), // TEMP
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
  res.push(`EtherBalance = ${state.etherBalance}`);
  return res.join(', ');
}

function getErrorText(state: State) {
  const res = [];
  if (BigInt(state.etherBalance) < MINIMUM_ALLOWED_ETH_BALANCE_WEI) {
    res.push(`Eth balance low: ${state.etherBalance}.`);
  }
  return res.join(' ');
}
