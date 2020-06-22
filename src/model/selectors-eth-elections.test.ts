import test from 'ava';
import { State } from './state';
import { shouldNotifyReadyToSync, shouldNotifyReadyForCommittee } from './selectors-eth-elections';
import { exampleConfig } from '../config.example';
import { getCurrentClockTime } from '../helpers';

// example state reflects operational eth state and standbys updated
function getExampleState() {
  const exampleState = new State();
  exampleState.EthereumWriteStatus = 'operational';
  exampleState.ManagementRefTime = getCurrentClockTime() - 3 * 60;
  exampleState.ManagementCurrentStandbys = [{ EthAddress: 's1' }];
  exampleState.ManagementOthersElectionStatus = {
    s1: {
      LastUpdateTime: getCurrentClockTime() - 10,
      ReadyToSync: true,
      ReadyForCommittee: false,
    },
  };
  return exampleState;
}

function getAuditConfig() {
  return { ...exampleConfig, ElectionsAuditOnly: true };
}

test('shouldNotifyReadyToSync: new node with standbys full', (t) => {
  const state = getExampleState();
  state.VchainSyncStatus = 'not-exist';
  t.false(shouldNotifyReadyToSync(state, exampleConfig));

  state.VchainSyncStatus = 'exist-not-in-sync';
  t.true(shouldNotifyReadyToSync(state, exampleConfig));

  state.ManagementMyElectionStatus = {
    LastUpdateTime: getCurrentClockTime() - 2 * 24 * 60 * 60,
    ReadyToSync: true,
    ReadyForCommittee: false,
  };
  t.false(shouldNotifyReadyToSync(state, exampleConfig));

  state.ManagementMyElectionStatus = {
    LastUpdateTime: getCurrentClockTime() - 20 * 24 * 60 * 60,
    ReadyToSync: true,
    ReadyForCommittee: false,
  };
  t.true(shouldNotifyReadyToSync(state, exampleConfig));

  state.ManagementMyElectionStatus = {
    LastUpdateTime: getCurrentClockTime() - 2 * 24 * 60 * 60,
    ReadyToSync: false,
    ReadyForCommittee: false,
  };
  t.true(shouldNotifyReadyToSync(state, exampleConfig));

  state.ManagementIsStandby = true;
  t.false(shouldNotifyReadyToSync(state, exampleConfig));

  state.ManagementIsStandby = false;
  t.true(shouldNotifyReadyToSync(state, exampleConfig));

  state.ManagementIsStandby = true;
  t.false(shouldNotifyReadyToSync(state, exampleConfig));
});

test('shouldNotifyReadyToSync: standby slot becomes available', (t) => {
  const state = getExampleState();
  state.VchainSyncStatus = 'exist-not-in-sync';
  state.ManagementMyElectionStatus = {
    LastUpdateTime: getCurrentClockTime() - 2 * 24 * 60 * 60,
    ReadyToSync: true,
    ReadyForCommittee: false,
  };
  t.false(shouldNotifyReadyToSync(state, exampleConfig));

  state.ManagementOthersElectionStatus['s1'].LastUpdateTime = getCurrentClockTime() - 8 * 24 * 60 * 60;
  t.true(shouldNotifyReadyToSync(state, exampleConfig));
});

test('shouldNotifyReadyToSync: only when ethereum state is operational', (t) => {
  const state = getExampleState();
  state.VchainSyncStatus = 'exist-not-in-sync';
  t.true(shouldNotifyReadyToSync(state, exampleConfig));

  state.EthereumWriteStatus = 'out-of-sync';
  t.false(shouldNotifyReadyToSync(state, exampleConfig));

  state.EthereumWriteStatus = 'tx-pending';
  t.false(shouldNotifyReadyToSync(state, exampleConfig));

  state.EthereumWriteStatus = 'need-reset';
  t.false(shouldNotifyReadyToSync(state, exampleConfig));

  state.EthereumWriteStatus = 'operational';
  t.true(shouldNotifyReadyToSync(state, exampleConfig));
});

test('shouldNotifyReadyToSync: audit-only keeps position in standby', (t) => {
  const state = getExampleState();
  state.ManagementIsStandby = true;
  state.VchainSyncStatus = 'in-sync';
  t.true(shouldNotifyReadyToSync(state, getAuditConfig()));

  state.VchainSyncStatus = 'exist-not-in-sync';
  t.false(shouldNotifyReadyToSync(state, getAuditConfig()));

  state.VchainSyncStatus = 'in-sync';
  state.ManagementMyElectionStatus = {
    LastUpdateTime: getCurrentClockTime() - 2 * 24 * 60 * 60,
    ReadyToSync: true,
    ReadyForCommittee: false,
  };
  t.false(shouldNotifyReadyToSync(state, getAuditConfig()));

  state.ManagementMyElectionStatus = {
    LastUpdateTime: getCurrentClockTime() - 20 * 24 * 60 * 60,
    ReadyToSync: true,
    ReadyForCommittee: false,
  };
  t.true(shouldNotifyReadyToSync(state, getAuditConfig()));
});

test('shouldNotifyReadyForCommittee: new node finished syncing', (t) => {
  const state = getExampleState();
  state.VchainSyncStatus = 'exist-not-in-sync';
  t.false(shouldNotifyReadyForCommittee(state, exampleConfig));

  state.VchainSyncStatus = 'in-sync';
  t.true(shouldNotifyReadyForCommittee(state, exampleConfig));

  t.false(shouldNotifyReadyForCommittee(state, getAuditConfig()));

  state.ManagementIsStandby = true;
  t.true(shouldNotifyReadyForCommittee(state, exampleConfig));

  state.ManagementInCommittee = true;
  t.false(shouldNotifyReadyForCommittee(state, exampleConfig));

  state.ManagementInCommittee = false;
  state.ManagementMyElectionStatus = {
    LastUpdateTime: getCurrentClockTime() - 2 * 24 * 60 * 60,
    ReadyToSync: true,
    ReadyForCommittee: true,
  };
  t.false(shouldNotifyReadyForCommittee(state, exampleConfig));

  state.ManagementMyElectionStatus = {
    LastUpdateTime: getCurrentClockTime() - 2 * 24 * 60 * 60,
    ReadyToSync: true,
    ReadyForCommittee: false,
  };
  t.true(shouldNotifyReadyForCommittee(state, exampleConfig));
});

test('shouldNotifyReadyForCommittee: standby in sync going stale', (t) => {
  const state = getExampleState();
  state.ManagementIsStandby = true;
  state.VchainSyncStatus = 'in-sync';
  state.ManagementMyElectionStatus = {
    LastUpdateTime: getCurrentClockTime() - 2 * 24 * 60 * 60,
    ReadyToSync: true,
    ReadyForCommittee: true,
  };
  t.false(shouldNotifyReadyForCommittee(state, exampleConfig));

  state.ManagementMyElectionStatus = {
    LastUpdateTime: getCurrentClockTime() - 20 * 24 * 60 * 60,
    ReadyToSync: true,
    ReadyForCommittee: true,
  };
  t.true(shouldNotifyReadyForCommittee(state, exampleConfig));

  t.false(shouldNotifyReadyForCommittee(state, getAuditConfig()));
});

test('shouldNotifyReadyForCommittee: only when ethereum state is operational', (t) => {
  const state = getExampleState();
  state.ManagementIsStandby = true;
  state.VchainSyncStatus = 'in-sync';
  state.ManagementMyElectionStatus = {
    LastUpdateTime: getCurrentClockTime() - 20 * 24 * 60 * 60,
    ReadyToSync: true,
    ReadyForCommittee: true,
  };
  t.true(shouldNotifyReadyForCommittee(state, exampleConfig));

  state.EthereumWriteStatus = 'out-of-sync';
  t.false(shouldNotifyReadyForCommittee(state, exampleConfig));

  state.EthereumWriteStatus = 'tx-pending';
  t.false(shouldNotifyReadyForCommittee(state, exampleConfig));

  state.EthereumWriteStatus = 'need-reset';
  t.false(shouldNotifyReadyForCommittee(state, exampleConfig));

  state.EthereumWriteStatus = 'operational';
  t.true(shouldNotifyReadyForCommittee(state, exampleConfig));
});
