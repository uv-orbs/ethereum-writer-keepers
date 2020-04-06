import * as Logger from '../logger';
import { State } from '../state';
import fetch from 'node-fetch';
import { Decoder, decodeString, num, object, array } from 'ts-json-decode';

interface NodeManagementConfig {
  chains: Array<{
    Id: number;
  }>;
}

const nodeManagementConfigDecoder: Decoder<NodeManagementConfig> = object({
  chains: array(
    object({
      Id: num,
    })
  ),
});

export async function readNodeManagementConfig(url: string, state: State) {
  let nodeManagementConfig: NodeManagementConfig;
  const res = await fetch(url);
  const body = await res.text();
  try {
    nodeManagementConfig = decodeString(nodeManagementConfigDecoder, body);
  } catch (err) {
    Logger.error(err.message);
    throw new Error(`Invalid NodeManagementConfig response:\n${body}`);
  }
  readVirtualChains(nodeManagementConfig, state);
}

function readVirtualChains(nodeManagementConfig: NodeManagementConfig, state: State) {
  state.numVirtualChains = nodeManagementConfig.chains.length;
}
