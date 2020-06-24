import test from 'ava';
import { State } from '../model/state';
import _ from 'lodash';
import { OLDinitWeb3Client } from './old-ethereum';
import { exampleConfig } from '../config.example';

test('initializes web3 and contracts', (t) => {
  const state = new State();
  OLDinitWeb3Client(exampleConfig, state);
  t.assert(state.OLDWeb3);
  t.assert(state.OLDEthereumElectionsContract);
  // eslint-disable-next-line @typescript-eslint/unbound-method
  t.assert(_.isFunction(state.OLDEthereumElectionsContract?.setBanningVotes));
});
