import { State } from './state';
import * as Logger from '../logger';

const MAX_STANDBYS = 5; // in future, can be taken from the MaxStandbysChanged event

export function shouldNotifyReadyToSync(state: State, config: EthereumElectionsParams): boolean {
  if (state.EthereumSyncStatus != 'operational') return false;

  if (
    !(state.ManagementIsStandby || state.ManagementInCommittee) &&
    (isUpdateStale(state, config) || isStandbyAvailable(state, config)) &&
    state.VchainSyncStatus == 'exist-not-in-sync'
  ) {
    Logger.log(
      `shouldNotifyReadyToSync because node is deployed, not in topology and does not have a non-stale RTS in place.`
    );
    return true;
  }

  if (
    config.ElectionsAuditOnly &&
    state.ManagementIsStandby &&
    isUpdateStale(state, config) &&
    state.VchainSyncStatus == 'in-sync'
  ) {
    Logger.log(
      `shouldNotifyReadyToSync because audit only node, in sync that want to keep its position in the standby.`
    );
    return true;
  }

  return false;
}

export function shouldNotifyReadyForCommittee(state: State, config: EthereumElectionsParams): boolean {
  if (state.EthereumSyncStatus != 'operational') return false;
  if (config.ElectionsAuditOnly) return false;
  if (state.VchainSyncStatus != 'in-sync') return false;

  if (
    !state.ManagementInCommittee &&
    (!state.ManagementMyElectionStatus || state.ManagementMyElectionStatus.ReadyForCommittee == false)
  ) {
    Logger.log(
      `shouldNotifyReadyForCommittee because node that the world thinks is not ready for committee, and is now ready.`
    );
    return true;
  }

  if (
    state.ManagementIsStandby &&
    state.ManagementMyElectionStatus &&
    state.ManagementMyElectionStatus.ReadyForCommittee == true &&
    isUpdateStale(state, config)
  ) {
    Logger.log(`shouldNotifyReadyForCommittee because consensus node refresh - in standby, in sync and stale.`);
    return true;
  }

  return false;
}

// helpers

export interface EthereumElectionsParams {
  ElectionsStaleUpdateSeconds: number;
  ElectionsRefreshWindowSeconds: number;
  ElectionsAuditOnly: boolean;
}

function isUpdateStale(state: State, config: EthereumElectionsParams): boolean {
  if (!state.ManagementMyElectionStatus) return true;
  if (state.ManagementMyElectionStatus.ReadyToSync != true) return true; // TODO: verify with odedw
  const nowEth = state.ManagementRefTime;
  const lastUpdate = state.ManagementMyElectionStatus.LastUpdateTime;
  if (nowEth - lastUpdate + config.ElectionsRefreshWindowSeconds > config.ElectionsStaleUpdateSeconds) return true;
  return false;
}

function isStandbyAvailable(state: State, config: EthereumElectionsParams): boolean {
  // no enough standbys
  if (state.ManagementCurrentStandbys.length < MAX_STANDBYS) return true;
  // or one of the standbys is stale
  for (const node of state.ManagementCurrentStandbys) {
    if (!state.ManagementOthersElectionStatus[node.EthAddress]) return true;
    const nowEth = state.ManagementRefTime;
    const lastUpdate = state.ManagementOthersElectionStatus[node.EthAddress].LastUpdateTime;
    if (nowEth - lastUpdate > config.ElectionsStaleUpdateSeconds) return true;
  }
  return false;
}
