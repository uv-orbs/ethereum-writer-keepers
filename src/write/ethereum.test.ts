import test from 'ava';
import { State } from '../state';
import _ from 'lodash';
import { initWeb3Client } from './ethereum';
import { validConfig } from '../config.test';

const exampleState = new State();

test.serial('initializes web3 and contracts', (t) => {
  const state = _.cloneDeep(exampleState);
  initWeb3Client(validConfig, state);
  t.assert(state.web3);
  t.assert(state.ethereumElectionsContract);
  // eslint-disable-next-line @typescript-eslint/unbound-method
  t.assert(_.isFunction(state.ethereumElectionsContract?.setBanningVotes));
});
