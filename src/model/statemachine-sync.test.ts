import test from 'ava';
import { State } from './state';
import { getCurrentClockTime } from '../helpers';
import { calcVchainSyncStatus } from './statemachine-sync';
import { exampleConfig } from '../config.example';

// example state reflects all vcs in sync
function getExampleState() {
  const exampleState = new State();
  exampleState.VchainMetrics['1000'] = {
    LastBlockHeight: 5000,
    UptimeSeconds: 3000,
    LastBlockTime: getCurrentClockTime() - 35,
  };
  exampleState.VchainMetrics['1001'] = {
    LastBlockHeight: 5000,
    UptimeSeconds: 3000,
    LastBlockTime: getCurrentClockTime() - 42,
  };
  return exampleState;
}

test('in sync becomes out of sync and returns to sync', (t) => {
  const state = getExampleState();
  state.VchainSyncStatus = calcVchainSyncStatus(state, exampleConfig);
  t.is(state.VchainSyncStatus, 'in-sync');

  state.VchainMetrics['1001'].LastBlockTime = getCurrentClockTime() - 24 * 60 * 60;
  state.VchainSyncStatus = calcVchainSyncStatus(state, exampleConfig);
  t.is(state.VchainSyncStatus, 'exist-not-in-sync');

  state.VchainMetrics['1001'].LastBlockTime = getCurrentClockTime() - 13;
  state.VchainSyncStatus = calcVchainSyncStatus(state, exampleConfig);
  t.is(state.VchainSyncStatus, 'in-sync');
});

test('new vchain becomes out of sync then in sync', (t) => {
  const state = getExampleState();
  state.VchainMetrics['1001'].UptimeSeconds = -1;
  state.VchainMetrics['1001'].LastBlockTime = -1;
  state.VchainSyncStatus = calcVchainSyncStatus(state, exampleConfig);
  t.is(state.VchainSyncStatus, 'not-exist');

  state.VchainMetrics['1001'].UptimeSeconds = 1;
  state.VchainMetrics['1001'].LastBlockTime = 0;
  state.VchainSyncStatus = calcVchainSyncStatus(state, exampleConfig);
  t.is(state.VchainSyncStatus, 'not-exist');

  state.VchainMetrics['1001'].UptimeSeconds = 14;
  state.VchainMetrics['1001'].LastBlockTime = 0;
  state.VchainSyncStatus = calcVchainSyncStatus(state, exampleConfig);
  t.is(state.VchainSyncStatus, 'exist-not-in-sync');

  state.VchainMetrics['1001'].LastBlockTime = getCurrentClockTime() - 13;
  state.VchainSyncStatus = calcVchainSyncStatus(state, exampleConfig);
  t.is(state.VchainSyncStatus, 'in-sync');
});
