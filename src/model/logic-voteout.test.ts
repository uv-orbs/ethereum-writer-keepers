import test from 'ava';
import { State } from './state';
import { getAllValidatorsToVoteOut } from './logic-voteout';
import { exampleConfig } from '../config.example';
import { getCurrentClockTime } from '../helpers';

// example state reflects excellent reputations
function getExampleState() {
  const exampleState = new State();
  exampleState.EthereumSyncStatus = 'operational';
  exampleState.VchainSyncStatus = 'in-sync';
  exampleState.ManagementRefTime = getCurrentClockTime() - 10;
  exampleState.ManagementInCommittee = true;
  exampleState.ManagementCurrentCommittee = [
    { EthAddress: 'e1', Weight: 10 },
    { EthAddress: 'e2', Weight: 10 },
    { EthAddress: 'e3', Weight: 10 },
  ];
  exampleState.ManagementEthToOrbsAddress = { e1: 'o1', e2: 'o2', e3: 'o3' };
  exampleState.VchainReputations = {
    '42': { o1: 0, o2: 0, o3: 0 },
    '43': { o1: 0, o2: 0, o3: 0 },
  };
  return exampleState;
}

test('validator starts having bad reputation in one vc until voted out', (t) => {
  const state = getExampleState();
  t.deepEqual(getAllValidatorsToVoteOut(state, exampleConfig), []);
  t.assert(state.TimeEnteredBadReputation['e3']['43'] == 0);

  state.VchainReputations['43']['o1'] = 3;
  state.VchainReputations['43']['o2'] = 3;
  state.VchainReputations['43']['o3'] = 3; // below minimum threshold
  t.deepEqual(getAllValidatorsToVoteOut(state, exampleConfig), []);
  t.assert(state.TimeEnteredBadReputation['e3']['43'] == 0);

  state.VchainReputations['43']['o1'] = 6;
  state.VchainReputations['43']['o2'] = 6; // median causes it to be ignored
  state.VchainReputations['43']['o3'] = 6; // bad
  t.deepEqual(getAllValidatorsToVoteOut(state, exampleConfig), []);
  t.assert(state.TimeEnteredBadReputation['e3']['43'] == 0);

  state.VchainReputations['43']['o1'] = 1;
  state.VchainReputations['43']['o2'] = 1; // median is now no longer ignored
  state.VchainReputations['43']['o3'] = 6; // bad
  t.deepEqual(getAllValidatorsToVoteOut(state, exampleConfig), []);
  t.assert(state.TimeEnteredBadReputation['e3']['43'] > 1400000000);

  state.VchainReputations['43']['o1'] = 1;
  state.VchainReputations['43']['o2'] = 1;
  state.VchainReputations['43']['o3'] = 1; // now ok
  t.deepEqual(getAllValidatorsToVoteOut(state, exampleConfig), []);
  t.assert(state.TimeEnteredBadReputation['e3']['43'] == 0);

  state.VchainReputations['43']['o1'] = 1;
  state.VchainReputations['43']['o2'] = 1;
  state.VchainReputations['43']['o3'] = 6; // bad again
  t.deepEqual(getAllValidatorsToVoteOut(state, exampleConfig), []);
  t.assert(state.TimeEnteredBadReputation['e3']['43'] > 1400000000);

  state.TimeEnteredBadReputation['e3']['43'] = getCurrentClockTime() - 2 * 60 * 60;
  t.deepEqual(getAllValidatorsToVoteOut(state, exampleConfig), []);

  state.TimeEnteredBadReputation['e3']['43'] = getCurrentClockTime() - 10 * 60 * 60;
  t.deepEqual(getAllValidatorsToVoteOut(state, exampleConfig), [{ EthAddress: 'e3', Weight: 10 }]);

  state.EthereumLastVoteOutTime['e3'] = getCurrentClockTime() - 2 * 24 * 60 * 60;
  t.deepEqual(getAllValidatorsToVoteOut(state, exampleConfig), []);

  state.EthereumLastVoteOutTime['e3'] = getCurrentClockTime() - 9 * 24 * 60 * 60;
  t.deepEqual(getAllValidatorsToVoteOut(state, exampleConfig), [{ EthAddress: 'e3', Weight: 10 }]);

  state.EthereumLastVoteOutTime['e3'] = getCurrentClockTime() - 2 * 24 * 60 * 60;
  state.ManagementOthersElectionsStatus['e3'] = {
    LastUpdateTime: getCurrentClockTime() - 1 * 24 * 60 * 60,
    ReadyToSync: true,
    ReadyForCommittee: true,
    TimeToStale: 6 * 24 * 60 * 60,
  };
  t.deepEqual(getAllValidatorsToVoteOut(state, exampleConfig), [{ EthAddress: 'e3', Weight: 10 }]);
});

test('more than 1 validator voted out', (t) => {
  const state = getExampleState();
  state.VchainReputations['42']['o1'] = 1;
  state.VchainReputations['42']['o2'] = 6; // bad
  state.VchainReputations['42']['o3'] = 1;
  state.VchainReputations['43']['o1'] = 6; // bad
  state.VchainReputations['43']['o2'] = 1;
  state.VchainReputations['43']['o3'] = 1;
  t.deepEqual(getAllValidatorsToVoteOut(state, exampleConfig), []);
  t.assert(state.TimeEnteredBadReputation['e2']['42'] > 1400000000);
  t.assert(state.TimeEnteredBadReputation['e1']['43'] > 1400000000);

  state.TimeEnteredBadReputation['e2']['42'] = getCurrentClockTime() - 10 * 60 * 60;
  state.TimeEnteredBadReputation['e1']['43'] = getCurrentClockTime() - 10 * 60 * 60;
  t.deepEqual(getAllValidatorsToVoteOut(state, exampleConfig), [
    { EthAddress: 'e1', Weight: 10 },
    { EthAddress: 'e2', Weight: 10 },
  ]);
});

test('missing reputations for vc does not fail', (t) => {
  const state = getExampleState();
  state.VchainReputations['42'] = {};
  t.deepEqual(getAllValidatorsToVoteOut(state, exampleConfig), []);
});

test('validator which is not in committee is not voted out', (t) => {
  const state = getExampleState();
  state.VchainReputations['42']['o1'] = 1;
  state.VchainReputations['42']['o2'] = 6; // bad
  state.VchainReputations['42']['o3'] = 1;
  t.deepEqual(getAllValidatorsToVoteOut(state, exampleConfig), []);
  t.assert(state.TimeEnteredBadReputation['e2']['42'] > 1400000000);

  state.TimeEnteredBadReputation['e2']['42'] = getCurrentClockTime() - 10 * 60 * 60;
  t.deepEqual(getAllValidatorsToVoteOut(state, exampleConfig), [{ EthAddress: 'e2', Weight: 10 }]);

  state.ManagementCurrentCommittee = [
    { EthAddress: 'e1', Weight: 10 },
    { EthAddress: 'e7', Weight: 10 },
    { EthAddress: 'e3', Weight: 10 },
  ];
  t.deepEqual(getAllValidatorsToVoteOut(state, exampleConfig), []);
});

test('validator with unknown orbs address is not voted out', (t) => {
  const state = getExampleState();
  state.VchainReputations['42']['o1'] = 1;
  state.VchainReputations['42']['o2'] = 6; // bad
  state.VchainReputations['42']['o3'] = 1;
  t.deepEqual(getAllValidatorsToVoteOut(state, exampleConfig), []);
  t.assert(state.TimeEnteredBadReputation['e2']['42'] > 1400000000);

  state.TimeEnteredBadReputation['e2']['42'] = getCurrentClockTime() - 10 * 60 * 60;
  t.deepEqual(getAllValidatorsToVoteOut(state, exampleConfig), [{ EthAddress: 'e2', Weight: 10 }]);

  delete state.ManagementEthToOrbsAddress['e2'];
  t.deepEqual(getAllValidatorsToVoteOut(state, exampleConfig), []);
});

test('only sending vote outs if good eth sync, good vchain sync and sender in committee', (t) => {
  const state = getExampleState();
  state.VchainReputations['42']['o1'] = 1;
  state.VchainReputations['42']['o2'] = 6; // bad
  state.VchainReputations['42']['o3'] = 1;
  t.deepEqual(getAllValidatorsToVoteOut(state, exampleConfig), []);
  t.assert(state.TimeEnteredBadReputation['e2']['42'] > 1400000000);

  state.TimeEnteredBadReputation['e2']['42'] = getCurrentClockTime() - 10 * 60 * 60;
  t.deepEqual(getAllValidatorsToVoteOut(state, exampleConfig), [{ EthAddress: 'e2', Weight: 10 }]);

  state.EthereumSyncStatus = 'out-of-sync';
  t.deepEqual(getAllValidatorsToVoteOut(state, exampleConfig), []);

  state.EthereumSyncStatus = 'tx-pending';
  t.deepEqual(getAllValidatorsToVoteOut(state, exampleConfig), []);

  state.EthereumSyncStatus = 'need-reset';
  t.deepEqual(getAllValidatorsToVoteOut(state, exampleConfig), []);

  state.EthereumSyncStatus = 'operational';
  state.VchainSyncStatus = 'not-exist';
  t.deepEqual(getAllValidatorsToVoteOut(state, exampleConfig), []);

  state.VchainSyncStatus = 'exist-not-in-sync';
  t.deepEqual(getAllValidatorsToVoteOut(state, exampleConfig), []);

  state.VchainSyncStatus = 'in-sync';
  state.ManagementInCommittee = false;
  t.deepEqual(getAllValidatorsToVoteOut(state, exampleConfig), []);

  state.ManagementInCommittee = true;
  t.deepEqual(getAllValidatorsToVoteOut(state, exampleConfig), [{ EthAddress: 'e2', Weight: 10 }]);
});
