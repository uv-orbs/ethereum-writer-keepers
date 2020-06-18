import * as Logger from '../logger';
import { State, VchainMetrics } from '../model/state';
import { Decoder, decodeString, object, num } from 'ts-json-decode';
import fetch from 'node-fetch';
import { getCurrentClockTime } from '../helpers';

export async function readAllVchainMetrics(endpointSchema: string, state: State) {
  let successful = 0;
  for (const [vcId] of Object.entries(state.managementVirtualChains)) {
    try {
      const url = `${getEndpoint(vcId, endpointSchema)}/metrics`;
      state.vchainMetrics[vcId] = await fetchVchainMetrics(url);
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
    const decoded = decodeString(vchainMetricsResponseDecoder, body);
    return {
      LastBlockHeight: decoded['BlockStorage.BlockHeight'].Value,
      LastBlockTime: Math.floor(decoded['BlockStorage.LastCommitted.TimeNano'].Value / 1e9),
      Uptime: decoded['Runtime.Uptime.Seconds'].Value,
    };
  } catch (err) {
    Logger.error(err.message);
    throw new Error(`Invalid VchainMetrics response for ${url} (HTTP-${res.status}):\n${body}`);
  }
}

interface VchainMetricsResponse {
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

const vchainMetricsResponseDecoder: Decoder<VchainMetricsResponse> = object({
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
