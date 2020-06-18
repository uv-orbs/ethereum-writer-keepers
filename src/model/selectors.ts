import { State } from './state';

// return empty string if not found
export function findEthFromOrbsAddress(orbsAddress: string, state: State): string {
  for (const [eth, orbs] of Object.entries(state.ManagementEthToOrbsAddress)) {
    if (orbsAddress.toLowerCase() == orbs.toLowerCase()) return eth.toLowerCase();
  }
  return '';
}
