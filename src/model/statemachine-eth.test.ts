import test from 'ava';
import { State } from './state';
import { getCurrentClockTime } from '../helpers';
import { calcEthereumWriteStatus } from './statemachine-eth';
import { exampleConfig } from '../config.example';

// example state reflects no pending tx, eth in sync, not standby
function getExampleState() {
  const exampleState = new State();
  exampleState.ManagementRefTime = getCurrentClockTime() - 33;
  return exampleState;
}

test('eth in sync then drops out of sync then returns to sync', (t) => {
  const state = getExampleState();
  state.EthereumWriteStatus = calcEthereumWriteStatus(state, exampleConfig);
  t.is(state.EthereumWriteStatus, 'operational');

  state.ManagementRefTime = getCurrentClockTime() - 120 * 60;
  state.EthereumWriteStatus = calcEthereumWriteStatus(state, exampleConfig);
  t.is(state.EthereumWriteStatus, 'out-of-sync');

  state.ManagementRefTime = getCurrentClockTime() - 10 * 60;
  state.EthereumWriteStatus = calcEthereumWriteStatus(state, exampleConfig);
  t.is(state.EthereumWriteStatus, 'operational');
});

test('tx reverted becomes stuck until reset', (t) => {
  const state = getExampleState();
  state.EthereumWriteStatus = calcEthereumWriteStatus(state, exampleConfig);
  t.is(state.EthereumWriteStatus, 'operational');

  state.EthereumLastElectionsTx = { Status: 'revert', SendTime: 123, TxHash: 'abc', EthBlock: 456 };
  state.EthereumWriteStatus = calcEthereumWriteStatus(state, exampleConfig);
  t.is(state.EthereumWriteStatus, 'need-reset');

  state.EthereumLastElectionsTx = { Status: 'final', SendTime: 123, TxHash: 'abc', EthBlock: 456 };
  state.EthereumWriteStatus = calcEthereumWriteStatus(state, exampleConfig);
  t.is(state.EthereumWriteStatus, 'need-reset');
});

test('voted out becomes stuck until reset', (t) => {
  const state = getExampleState();
  state.EthereumWriteStatus = calcEthereumWriteStatus(state, exampleConfig);
  t.is(state.EthereumWriteStatus, 'operational');

  state.ManagementMyElectionStatus = { ReadyToSync: false, ReadyForCommittee: false, LastUpdateTime: 123 };
  state.EthereumWriteStatus = calcEthereumWriteStatus(state, exampleConfig);
  t.is(state.EthereumWriteStatus, 'need-reset');

  state.ManagementMyElectionStatus = { ReadyToSync: true, ReadyForCommittee: true, LastUpdateTime: 123 };
  state.EthereumWriteStatus = calcEthereumWriteStatus(state, exampleConfig);
  t.is(state.EthereumWriteStatus, 'need-reset');
});

test('failed to sync vcs becomes stuck until reset', (t) => {
  const state = getExampleState();
  state.EthereumWriteStatus = calcEthereumWriteStatus(state, exampleConfig);
  t.is(state.EthereumWriteStatus, 'operational');
  t.assert(state.TimeEnteredStandbyWithoutVcSync == 0);

  state.ManagementIsStandby = true;
  state.VchainSyncStatus = 'exist-not-in-sync';
  state.EthereumWriteStatus = calcEthereumWriteStatus(state, exampleConfig);
  t.is(state.EthereumWriteStatus, 'operational');
  t.assert(state.TimeEnteredStandbyWithoutVcSync > 0);

  state.TimeEnteredStandbyWithoutVcSync = getCurrentClockTime() - 25 * 60 * 60;
  state.EthereumWriteStatus = calcEthereumWriteStatus(state, exampleConfig);
  t.is(state.EthereumWriteStatus, 'need-reset');

  state.TimeEnteredStandbyWithoutVcSync = 0;
  state.EthereumWriteStatus = calcEthereumWriteStatus(state, exampleConfig);
  t.is(state.EthereumWriteStatus, 'need-reset');
});

test('failed to sync vcs counter is reset if out of standby or vcs sync', (t) => {
  const state = getExampleState();
  state.EthereumWriteStatus = calcEthereumWriteStatus(state, exampleConfig);
  t.is(state.EthereumWriteStatus, 'operational');
  t.assert(state.TimeEnteredStandbyWithoutVcSync == 0);

  state.ManagementIsStandby = true;
  state.VchainSyncStatus = 'exist-not-in-sync';
  state.EthereumWriteStatus = calcEthereumWriteStatus(state, exampleConfig);
  t.is(state.EthereumWriteStatus, 'operational');
  t.assert(state.TimeEnteredStandbyWithoutVcSync > 0);

  state.ManagementIsStandby = false;
  state.EthereumWriteStatus = calcEthereumWriteStatus(state, exampleConfig);
  t.is(state.EthereumWriteStatus, 'operational');
  t.assert(state.TimeEnteredStandbyWithoutVcSync == 0);

  state.ManagementIsStandby = true;
  state.VchainSyncStatus = 'not-exist';
  state.EthereumWriteStatus = calcEthereumWriteStatus(state, exampleConfig);
  t.is(state.EthereumWriteStatus, 'operational');
  t.assert(state.TimeEnteredStandbyWithoutVcSync > 0);

  state.VchainSyncStatus = 'in-sync';
  state.EthereumWriteStatus = calcEthereumWriteStatus(state, exampleConfig);
  t.is(state.EthereumWriteStatus, 'operational');
  t.assert(state.TimeEnteredStandbyWithoutVcSync == 0);

  state.ManagementIsStandby = true;
  state.VchainSyncStatus = 'not-exist';
  state.EthereumWriteStatus = calcEthereumWriteStatus(state, exampleConfig);
  t.is(state.EthereumWriteStatus, 'operational');
  t.assert(state.TimeEnteredStandbyWithoutVcSync > 0);

  state.TimeEnteredStandbyWithoutVcSync = getCurrentClockTime() - 25 * 60 * 60;
  state.EthereumWriteStatus = calcEthereumWriteStatus(state, exampleConfig);
  t.is(state.EthereumWriteStatus, 'need-reset');
});

test('eth out of sync masks failed to sync vcs', (t) => {
  const state = getExampleState();
  state.EthereumWriteStatus = calcEthereumWriteStatus(state, exampleConfig);
  t.is(state.EthereumWriteStatus, 'operational');
  t.assert(state.TimeEnteredStandbyWithoutVcSync == 0);

  state.ManagementRefTime = getCurrentClockTime() - 120 * 60;
  state.ManagementIsStandby = true;
  state.VchainSyncStatus = 'exist-not-in-sync';
  state.EthereumWriteStatus = calcEthereumWriteStatus(state, exampleConfig);
  t.is(state.EthereumWriteStatus, 'out-of-sync');
  t.assert(state.TimeEnteredStandbyWithoutVcSync == 0);
});

test('pending tx then final then another pending', (t) => {
  const state = getExampleState();
  state.EthereumWriteStatus = calcEthereumWriteStatus(state, exampleConfig);
  t.is(state.EthereumWriteStatus, 'operational');

  state.EthereumLastElectionsTx = { Status: 'pending', SendTime: 123, TxHash: 'abc', EthBlock: 456 };
  state.EthereumWriteStatus = calcEthereumWriteStatus(state, exampleConfig);
  t.is(state.EthereumWriteStatus, 'tx-pending');

  state.EthereumLastElectionsTx = { Status: 'final', SendTime: 123, TxHash: 'abc', EthBlock: 456 };
  state.EthereumWriteStatus = calcEthereumWriteStatus(state, exampleConfig);
  t.is(state.EthereumWriteStatus, 'operational');

  state.EthereumLastElectionsTx = { Status: 'pending', SendTime: 123, TxHash: 'abc', EthBlock: 456 };
  state.EthereumWriteStatus = calcEthereumWriteStatus(state, exampleConfig);
  t.is(state.EthereumWriteStatus, 'tx-pending');
});

test('eth out of sync masks pending tx', (t) => {
  const state = getExampleState();
  state.EthereumWriteStatus = calcEthereumWriteStatus(state, exampleConfig);
  t.is(state.EthereumWriteStatus, 'operational');

  state.ManagementRefTime = getCurrentClockTime() - 120 * 60;
  state.EthereumLastElectionsTx = { Status: 'pending', SendTime: 123, TxHash: 'abc', EthBlock: 456 };
  state.EthereumWriteStatus = calcEthereumWriteStatus(state, exampleConfig);
  t.is(state.EthereumWriteStatus, 'out-of-sync');
});
