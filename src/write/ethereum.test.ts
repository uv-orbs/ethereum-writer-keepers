import test from 'ava';
import { State } from '../model/state';
import _ from 'lodash';
import { initWeb3Client } from './ethereum';
import { exampleConfig } from '../config.example';

const exampleState = new State();

test.serial('initializes web3 and contracts', (t) => {
  const state = _.cloneDeep(exampleState);
  initWeb3Client(exampleConfig, state);
  t.assert(state.Web3);
  t.assert(state.EthereumElectionsContract);
  // eslint-disable-next-line @typescript-eslint/unbound-method
  t.assert(_.isFunction(state.EthereumElectionsContract?.setBanningVotes));
});
