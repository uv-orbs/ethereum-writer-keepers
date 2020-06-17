import * as Logger from '../logger';
import { State } from '../model/state';
import { Decoder, decodeString, object, num } from 'ts-json-decode';
import fetch from 'node-fetch';
import { getCurrentClockTime } from '../helpers';

export async function readAllVchainMetrics(endpointSchema: string, state: State) {
  let successful = 0;
  for (const [vcId] of Object.entries(state.managementVirtualChains)) {
    try {
      const url = `${getEndpoint(vcId, endpointSchema)}/metrics`;
      const response = await fetchVchainMetrics(url);

      state.vchainMetrics[vcId] = {
        LastBlockHeight: response['BlockStorage.BlockHeight'].Value,
        LastBlockTime: Math.floor(response['BlockStorage.LastCommitted.TimeNano'].Value / 1e9),
        Uptime: response['Runtime.Uptime.Seconds'].Value,
      };
      successful++;
    } catch (err) {
      Logger.error(err.stack);
      state.vchainMetrics[vcId] = {
        LastBlockHeight: -1,
        LastBlockTime: -1,
        Uptime: -1,
      };
    }
  }

  // last to be after all possible exceptions and processing delays
  state.vchainMetricsLastPollTime = getCurrentClockTime();

  // log progress
  Logger.log(
    `Fetched vchain metrics, num vchains succeeded: ${successful}/${Object.keys(state.managementVirtualChains).length}.`
  );
}

// helpers

export function getEndpoint(virtualChainId: string, endpointSchema: string) {
  return endpointSchema.replace(/{{ID}}/g, virtualChainId);
}

async function fetchVchainMetrics(url: string): Promise<VchainMetrics> {
  const res = await fetch(url);
  const body = await res.text();
  try {
    return decodeString(vchainMetricsDecoder, body);
  } catch (err) {
    Logger.error(err.message);
    throw new Error(`Invalid VchainMetrics response for ${url} (HTTP-${res.status}):\n${body}`);
  }
}

interface VchainMetrics {
  'BlockStorage.BlockHeight': {
    Value: number;
  };
  'BlockStorage.LastCommitted.TimeNano': {
    Value: number;
  };
  'Runtime.Uptime.Seconds': {
    Value: number;
  };
}

const vchainMetricsDecoder: Decoder<VchainMetrics> = object({
  'BlockStorage.BlockHeight': object({
    Value: num,
  }),
  'BlockStorage.LastCommitted.TimeNano': object({
    Value: num,
  }),
  'Runtime.Uptime.Seconds': object({
    Value: num,
  }),
});
