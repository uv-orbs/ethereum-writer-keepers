import * as Logger from '../logger';
import { Configuration } from '../config';
import { State } from '../model/state';
import * as Orbs from 'orbs-client-sdk';

export function getOrbsClient(virtualChainId: number, config: Configuration, state: State) {
  // create account if needed
  if (!state.orbsAccount) {
    state.orbsAccount = Orbs.createAccount();
  }

  // create client if needed
  if (!state.orbsClientPerVc[virtualChainId]) {
    state.orbsClientPerVc[virtualChainId] = new Orbs.Client(
      getEndpoint2(virtualChainId, config),
      virtualChainId,
      Orbs.NetworkType.NETWORK_TYPE_MAIN_NET,
      new Orbs.LocalSigner(state.orbsAccount)
    );
  }

  return state.orbsClientPerVc[virtualChainId];
}

export async function readVirtualChainCounter(virtualChainId: number, config: Configuration, state: State) {
  const client = getOrbsClient(virtualChainId, config, state);
  const query = await client.createQuery('Counter', 'value', []);
  const response = await client.sendQuery(query);
  if (response.executionResult != Orbs.ExecutionResult.EXECUTION_RESULT_SUCCESS) {
    throw new Error(`Orbs counter query failed: ${JSON.stringify(response)}.`);
  }
  state.orbsCounter = response.outputArguments[0].value as bigint;
  Logger.log(`Read counter value from virtual chain ${virtualChainId}: ${state.orbsCounter}.`);
}

export function getEndpoint2(virtualChainId: number, config: Configuration) {
  return config.VirtualChainEndpointSchema.replace(/{{ID}}/g, virtualChainId.toString());
}
