import test from 'ava';
import { State } from '../model/state';
import _ from 'lodash';
import { getOrbsClient, readAllVchainReputations } from './vchain-reputations';
import * as Orbs from 'orbs-client-sdk';
import { jsonStringifyComplexTypes, getCurrentClockTime } from '../helpers';

const exampleVchainEndpointSchema = 'http://vchain-{{ID}}:8080';
const exampleState = new State();
exampleState.managementVirtualChains['1000000'] = {
  Expiration: 1592400011,
  GenesisRefTime: 1592400010,
  IdentityType: 0,
  RolloutGroup: 'main',
  Tier: 'defaultTier',
};
exampleState.managementVirtualChains['1000001'] = {
  Expiration: 1592400021,
  GenesisRefTime: 1592400020,
  IdentityType: 0,
  RolloutGroup: 'canary',
  Tier: 'defaultTier',
};

test.serial('gets Orbs client', (t) => {
  const state = _.cloneDeep(exampleState);
  getOrbsClient('1000000', exampleVchainEndpointSchema, state);
  t.assert(state.orbsClientPerVchain['1000000']);
});

function getMockOrbsClient(result = Orbs.ExecutionResult.EXECUTION_RESULT_SUCCESS) {
  return {
    createQuery: () => null,
    sendQuery: () => {
      return {
        executionResult: result,
        outputArguments: [{ value: BigInt(17) }],
      };
    },
  };
}

test.serial('reads data from valid VchainReputations', async (t) => {
  const state = _.cloneDeep(exampleState);
  state.orbsClientPerVchain['1000000'] = (getMockOrbsClient() as unknown) as Orbs.Client;
  state.orbsClientPerVchain['1000001'] = (getMockOrbsClient() as unknown) as Orbs.Client;
  await readAllVchainReputations(exampleVchainEndpointSchema, state);

  t.log('state:', jsonStringifyComplexTypes(state));

  t.assert(getCurrentClockTime() - state.vchainReputationsLastPollTime < 5);
  for (const vcId of ['1000000', '1000001']) {
    t.is(state.vchainReputations[vcId].TempCounter, BigInt(17));
  }
});

test.serial('invalid VchainReputations response from first vchain', async (t) => {
  const state = _.cloneDeep(exampleState);
  state.orbsClientPerVchain['1000000'] = (getMockOrbsClient(
    Orbs.ExecutionResult.EXECUTION_RESULT_ERROR_UNEXPECTED
  ) as unknown) as Orbs.Client;
  state.orbsClientPerVchain['1000001'] = (getMockOrbsClient() as unknown) as Orbs.Client;
  await readAllVchainReputations(exampleVchainEndpointSchema, state);

  t.log('state:', jsonStringifyComplexTypes(state));

  t.assert(getCurrentClockTime() - state.vchainReputationsLastPollTime < 5);
  t.is(state.vchainReputations['1000001'].TempCounter, BigInt(17));
  t.is(state.vchainReputations['1000000'].TempCounter, BigInt(0));
});
