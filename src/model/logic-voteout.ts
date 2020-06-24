import * as Logger from '../logger';
import { State, CommitteeMember, VchainReputations } from './state';
import { getCurrentClockTime } from '../helpers';
import { calcMedianInPlace } from './helpers';

const INVALID_REPUTATION_THRESHOLD = 4;
const VALID_REPUTATION_THRESHOLD = 2;

export function getAllValidatorsToVoteOut(state: State, config: VoteOutParams): CommitteeMember[] {
  if (state.EthereumSyncStatus != 'operational') return [];
  if (state.VchainSyncStatus != 'in-sync') return [];
  if (!state.ManagementInCommittee) return [];
  return state.ManagementCurrentCommittee.filter((validator) => shouldBeVotedOut(validator, state, config));
}

function shouldBeVotedOut(validator: CommitteeMember, state: State, config: VoteOutParams): boolean {
  if (!noPendingVoteOut(validator.EthAddress, state, config)) return false;
  if (hasLongBadReputationInAnyVc(validator.EthAddress, state, config)) return true;
  return false;
}

// helpers

export interface VoteOutParams {
  InvalidReputationGraceSeconds: number;
  VoteOutValiditySeconds: number;
}

function hasLongBadReputationInAnyVc(ethAddress: string, state: State, config: VoteOutParams): boolean {
  const now = getCurrentClockTime();
  const orbsAddress = state.ManagementEthToOrbsAddress[ethAddress];
  if (!orbsAddress) return false;
  for (const [vcId, reputations] of Object.entries(state.VchainReputations)) {
    initTimeEnteredBadReputationIfNeeded(ethAddress, vcId, state);

    // maintain a helper state variable to see how long they're in bad reputation
    if (isBadReputation(orbsAddress, reputations)) {
      if (state.TimeEnteredBadReputation[ethAddress][vcId] == 0) state.TimeEnteredBadReputation[ethAddress][vcId] = now;
    } else state.TimeEnteredBadReputation[ethAddress][vcId] = 0;

    // rely on the helper state variable to respond
    if (state.TimeEnteredBadReputation[ethAddress][vcId] == 0) continue;
    if (now - state.TimeEnteredBadReputation[ethAddress][vcId] > config.InvalidReputationGraceSeconds) {
      Logger.log(`Found orbs address ${orbsAddress} in vc ${vcId} with bad reputation for a long time!`);
      return true;
    }
  }

  return false;
}

function isBadReputation(orbsAddress: string, reputations: VchainReputations): boolean {
  const value = reputations[orbsAddress] ?? -1;
  if (value < 0) return false;
  if (value < INVALID_REPUTATION_THRESHOLD) return false;
  if (calcMedianInPlace(Object.values(reputations)) > VALID_REPUTATION_THRESHOLD) return false;
  return true;
}

function noPendingVoteOut(ethAddress: string, state: State, config: VoteOutParams): boolean {
  const nowEth = state.ManagementRefTime;
  const lastVoteOut = state.EthereumLastVoteOutTime[ethAddress] ?? 0;
  if (nowEth - lastVoteOut > config.VoteOutValiditySeconds) return true;
  const lastReadyForCommittee = state.ManagementOthersElectionStatus[ethAddress]?.LastUpdateTime ?? 0;
  if (lastReadyForCommittee > lastVoteOut) return true;
  return false;
}

function initTimeEnteredBadReputationIfNeeded(ethAddress: string, vcId: string, state: State) {
  if (!state.TimeEnteredBadReputation[ethAddress]) state.TimeEnteredBadReputation[ethAddress] = {};
  if (!state.TimeEnteredBadReputation[ethAddress][vcId]) state.TimeEnteredBadReputation[ethAddress][vcId] = 0;
}
