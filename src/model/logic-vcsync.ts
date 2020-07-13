import { State, VchainSyncStatusEnum } from './state';
import { getCurrentClockTime } from '../helpers';

export function calcVchainSyncStatus(state: State, config: VchainSyncStatusParams): VchainSyncStatusEnum {
  if (!doAllVcsExist(state, config)) return 'not-exist';
  if (areAllLiveVcsNear(state, config)) return 'in-sync';
  if (isAnyLiveVcFar(state, config)) return 'exist-not-in-sync';
  return state.VchainSyncStatus; // don't change the state
}

// helpers

export interface VchainSyncStatusParams {
  VchainUptimeRequiredSeconds: number;
  VchainSyncThresholdSeconds: number;
  VchainOutOfSyncThresholdSeconds: number;
}

function doAllVcsExist(state: State, config: VchainSyncStatusParams): boolean {
  for (const [, metrics] of Object.entries(state.VchainMetrics)) {
    if (metrics.UptimeSeconds < config.VchainUptimeRequiredSeconds) return false;
  }
  return true;
}

function areAllLiveVcsNear(state: State, config: VchainSyncStatusParams): boolean {
  const now = getCurrentClockTime();
  for (const [vcId, metrics] of Object.entries(state.VchainMetrics)) {
    if (!isVcLive(vcId, state, config)) continue;
    if (now - metrics.LastBlockTime > config.VchainSyncThresholdSeconds) return false;
  }
  return true;
}

function isAnyLiveVcFar(state: State, config: VchainSyncStatusParams): boolean {
  const now = getCurrentClockTime();
  for (const [vcId, metrics] of Object.entries(state.VchainMetrics)) {
    if (!isVcLive(vcId, state, config)) continue;
    if (now - metrics.LastBlockTime > config.VchainOutOfSyncThresholdSeconds) return true;
  }
  return false;
}

function isVcLive(vcId: string, state: State, config: VchainSyncStatusParams): boolean {
  if (!state.ManagementVirtualChains[vcId]) return false;
  const nowEth = state.ManagementRefTime;
  const genesisTime = state.ManagementVirtualChains[vcId].GenesisRefTime;
  if (nowEth - genesisTime < config.VchainSyncThresholdSeconds) return false;
  return true;
}
