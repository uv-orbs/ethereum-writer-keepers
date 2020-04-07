import test from 'ava';
import { State } from '../state';
import _ from 'lodash';
import { exampleConfig } from '../config.example';
import { getOrbsClient, getEndpoint } from './vchain';

const exampleState = new State();

test.serial('gets Orbs client', (t) => {
  const state = _.cloneDeep(exampleState);
  getOrbsClient(42, exampleConfig, state);
  t.assert(state.orbsClientPerVc[42]);
});

test.serial('gets Orbs virtual chain endpoint', (t) => {
  const endpoint = getEndpoint(42, exampleConfig);
  t.is(endpoint, 'http://vchain-42:8080');
});
