import test from 'ava';
import { State } from './state';
import { findEthFromOrbsAddress } from './selectors';

test('findEthFromOrbsAddress selector', (t) => {
  const state = new State();
  state.ManagementEthToOrbsAddress = {
    '29ce860a2247d97160d6dfc087a15f41e2349087': '16fcf728f8dc3f687132f2157d8379c021a08c12',
    e16e965a4cc3fcd597ecdb9cd9ab8f3e6a750ac9: '86544bdd6c8b957cd198252c45fa215fc3892126',
    '51baa09f2f7dfc7a0f65886b68720958d389cac7': '174dc3b45bdbbc32aa0b95e64d0247ce99b08f69',
  };
  t.is(
    findEthFromOrbsAddress('86544bdd6c8b957cd198252c45fa215fc3892126', state),
    'e16e965a4cc3fcd597ecdb9cd9ab8f3e6a750ac9'
  );
  t.is(
    findEthFromOrbsAddress('174dc3b45bdbbc32aa0b95e64d0247ce99b08f69', state),
    '51baa09f2f7dfc7a0f65886b68720958d389cac7'
  );
  t.falsy(findEthFromOrbsAddress('29ce860a2247d97160d6dfc087a15f41e2349087', state));
  t.falsy(findEthFromOrbsAddress('xyz', state));
});
