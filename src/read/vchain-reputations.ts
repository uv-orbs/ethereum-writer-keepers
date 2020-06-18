import * as Logger from '../logger';
import { State, VchainReputations } from '../model/state';
import * as Orbs from 'orbs-client-sdk';
import { jsonStringifyComplexTypes, getCurrentClockTime } from '../helpers';

export async function readAllVchainReputations(endpointSchema: string, state: State) {
  let successful = 0;
  for (const [vcId] of Object.entries(state.managementVirtualChains)) {
    try {
      const client = getOrbsClient(vcId, endpointSchema, state);
      state.vchainReputations[vcId] = await fetchVchainReputations(client);
      successful++;
    } catch (err) {
      Logger.error(err.stack);
      state.vchainReputations[vcId] = {
        TempCounter: BigInt(0),
      };
    }
  }

  // last to be after all possible exceptions and processing delays
  state.vchainReputationsLastPollTime = getCurrentClockTime();

  // log progress
  Logger.log(
    `Fetched vchain reputations, num vchains succeeded: ${successful}/${
      Object.keys(state.managementVirtualChains).length
    }.`
  );
}

// helpers

function getEndpoint(virtualChainId: string, endpointSchema: string) {
  return endpointSchema.replace(/{{ID}}/g, virtualChainId);
}

export function getOrbsClient(virtualChainId: string, endpointSchema: string, state: State) {
  // create client if needed (cached)
  if (!state.orbsClientPerVchain[virtualChainId]) {
    state.orbsClientPerVchain[virtualChainId] = new Orbs.Client(
      getEndpoint(virtualChainId, endpointSchema),
      parseInt(virtualChainId),
      Orbs.NetworkType.NETWORK_TYPE_MAIN_NET,
      new Orbs.LocalSigner(state.orbsAccount)
    );
  }
  return state.orbsClientPerVchain[virtualChainId];
}

async function fetchVchainReputations(client: Orbs.Client): Promise<VchainReputations> {
  const query = await client.createQuery('Counter', 'value', []);
  const response = await client.sendQuery(query);
  if (response.executionResult != Orbs.ExecutionResult.EXECUTION_RESULT_SUCCESS) {
    throw new Error(`Orbs counter query failed: ${jsonStringifyComplexTypes(response)}.`);
  }
  return {
    TempCounter: response.outputArguments[0].value as bigint,
  };
}
