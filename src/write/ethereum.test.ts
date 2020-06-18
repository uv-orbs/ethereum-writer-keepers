import test from 'ava';
import { State } from '../model/state';
import _ from 'lodash';
import { initWeb3Client } from './ethereum';
import { exampleConfig } from '../config.example';

test('initializes web3 and contracts', (t) => {
  const state = new State();
  initWeb3Client(exampleConfig, state);
  t.assert(state.Web3);
  t.assert(state.EthereumElectionsContract);
  // eslint-disable-next-line @typescript-eslint/unbound-method
  t.assert(_.isFunction(state.EthereumElectionsContract?.setBanningVotes));
});
