import { State } from './state';

export function shouldVoteOutValidator(ethAddress: string, state: State): boolean {
  if (state.EthereumWriteStatus != 'operational') return false;
  if (!isValidatorInCommittee(ethAddress, state)) return false;
  throw new Error('not implemented'); // TODO: complete me
}

// helpers

function isValidatorInCommittee(ethAddress: string, state: State): boolean {
  return state.ManagementCurrentCommittee.some((n) => n.EthAddress == ethAddress);
}
