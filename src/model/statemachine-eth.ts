import * as Logger from '../logger';
import { EthereumWriteStatusEnum, State } from './state';
import { getCurrentClockTime } from '../helpers';

export function calcEthereumWriteStatus(state: State, config: EthereumWriteStatusParams): EthereumWriteStatusEnum {
  if (state.EthereumWriteStatus == 'need-reset') return 'need-reset'; // stuck until node reset
  if (!isEthValid(state, config)) return 'out-of-sync';
  if (isAnyTxReverted(state)) return 'need-reset';
  if (isVotedOut(state)) return 'need-reset';
  if (isFailedToSyncVcs(state, config)) return 'need-reset';
  if (isAnyTxPending(state)) return 'tx-pending';
  return 'operational';
}

// helpers

export interface EthereumWriteStatusParams {
  EthereumSyncRequirementSeconds: number;
  FailToSyncVcsTimeoutSeconds: number;
}

function isEthValid(state: State, config: EthereumWriteStatusParams): boolean {
  const now = getCurrentClockTime();
  if (now - state.ManagementRefTime > config.EthereumSyncRequirementSeconds) return false;
  return true;
}

function isVotedOut(state: State): boolean {
  if (state.ManagementMyElectionStatus?.ReadyToSync === false) {
    Logger.error(`Found that we have been voted out since RTS is false, reset needed!`);
    return true;
  }
  return false;
}

function isFailedToSyncVcs(state: State, config: EthereumWriteStatusParams): boolean {
  const now = getCurrentClockTime();

  // maintain a helper state variable to see how long we're in failed to sync
  if (state.ManagementIsStandby && state.VchainSyncStatus != 'in-sync') {
    if (state.TimeEnteredStandbyWithoutVcSync == 0) state.TimeEnteredStandbyWithoutVcSync = now;
  } else state.TimeEnteredStandbyWithoutVcSync = 0;

  // rely on the helper state variable to respond
  if (state.TimeEnteredStandbyWithoutVcSync == 0) return false;
  if (now - state.TimeEnteredStandbyWithoutVcSync > config.FailToSyncVcsTimeoutSeconds) {
    Logger.error(`We're standby but can't sync vcs since ${state.TimeEnteredStandbyWithoutVcSync}, reset needed!`);
    return true;
  }
  return false;
}

function isAnyTxReverted(state: State): boolean {
  if (state.EthereumLastElectionsTx?.Status === 'revert') {
    Logger.error(`Found an elections tx ${state.EthereumLastElectionsTx.TxHash} that is reverted, reset needed!`);
    return true;
  }
  return false;
}

function isAnyTxPending(state: State): boolean {
  if (state.EthereumLastElectionsTx?.Status === 'pending') return true;
  return false;
}
