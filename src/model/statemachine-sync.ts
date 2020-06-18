import { State, VchainSyncStatusEnum } from './state';
import { getCurrentClockTime } from '../helpers';

export function calcVchainSyncStatus(state: State, config: VchainSyncStatusParams): VchainSyncStatusEnum {
  if (!doAllVcsExist(state, config)) return 'not-exist';
  if (areAllVcsNear(state, config)) return 'in-sync';
  if (isAnyVcFar(state, config)) return 'exist-not-in-sync';
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

function areAllVcsNear(state: State, config: VchainSyncStatusParams): boolean {
  const now = getCurrentClockTime();
  for (const [, metrics] of Object.entries(state.VchainMetrics)) {
    if (now - metrics.LastBlockTime > config.VchainSyncThresholdSeconds) return false;
  }
  return true;
}

function isAnyVcFar(state: State, config: VchainSyncStatusParams): boolean {
  const now = getCurrentClockTime();
  for (const [, metrics] of Object.entries(state.VchainMetrics)) {
    if (now - metrics.LastBlockTime > config.VchainOutOfSyncThresholdSeconds) return true;
  }
  return false;
}
