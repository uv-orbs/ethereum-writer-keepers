import * as Logger from '../logger';
import { State, VchainMetrics } from '../model/state';
import { Decoder, decodeString, object, num } from 'ts-json-decode';
import fetch from 'node-fetch';
import { getCurrentClockTime } from '../helpers';

export async function readAllVchainMetrics(endpointSchema: string, state: State) {
  let successful = 0;
  for (const [vcId] of Object.entries(state.ManagementVirtualChains)) {
    try {
      const url = `${getEndpoint(vcId, endpointSchema)}/metrics`;
      state.VchainMetrics[vcId] = await fetchVchainMetrics(url);
      successful++;
    } catch (err) {
      Logger.error(err.stack);
      state.VchainMetrics[vcId] = {
        LastBlockHeight: -1,
        LastBlockTime: -1,
        UptimeSeconds: -1,
        LastCommitTime: -1,
      };
    }
  }

  // last to be after all possible exceptions and processing delays
  state.VchainMetricsLastPollTime = getCurrentClockTime();

  // log progress
  Logger.log(
    `Fetched vchain metrics, num vchains succeeded: ${successful}/${Object.keys(state.ManagementVirtualChains).length}.`
  );
}

// helpers

export function getEndpoint(virtualChainId: string, endpointSchema: string) {
  return endpointSchema.replace(/{{ID}}/g, virtualChainId);
}

async function fetchVchainMetrics(url: string): Promise<VchainMetrics> {
  const res = await fetch(url);
  const body = await res.text();
  // try deprecated format first - start
  try {
    const decoded = decodeString(vchainMetricsResponseDecoderDeprecated, body);
    return {
      LastBlockHeight: decoded['BlockStorage.BlockHeight'].Value,
      LastBlockTime: Math.floor(decoded['BlockStorage.LastCommitted.TimeNano'].Value / 1e9),
      UptimeSeconds: decoded['Runtime.Uptime.Seconds'].Value,
      LastCommitTime: -1,
    };
  } catch (err) {
    Logger.log(`VchainMetrics no longer in deprecated format, did we move to the new format?`);
  }
  // try deprecated format first - end
  try {
    const decoded = decodeString(vchainMetricsResponseDecoder, body);
    return {
      LastBlockHeight: decoded.BlockStorage.InOrderBlock.BlockHeight,
      LastBlockTime: Math.floor(decoded.BlockStorage.InOrderBlock.BlockTime.Value / 1e9),
      UptimeSeconds: decoded.Runtime.Uptime.Value,
      LastCommitTime: Math.floor(decoded.BlockStorage.LastCommit.Value / 1e9),
    };
  } catch (err) {
    Logger.error(err.message);
    throw new Error(`Invalid VchainMetrics response for ${url} (HTTP-${res.status}):\n${body}.`);
  }
}

interface VchainMetricsResponse {
  BlockStorage: {
    InOrderBlock: {
      BlockHeight: number;
      BlockTime: {
        Value: number;
      };
    };
    LastCommit: {
      Value: number;
    };
  };
  Runtime: {
    Uptime: {
      Value: number;
    };
  };
}

const vchainMetricsResponseDecoder: Decoder<VchainMetricsResponse> = object({
  BlockStorage: object({
    InOrderBlock: object({
      BlockHeight: num,
      BlockTime: object({
        Value: num,
      }),
    }),
    LastCommit: object({
      Value: num,
    }),
  }),
  Runtime: object({
    Uptime: object({
      Value: num,
    }),
  }),
});

// deprecated format - we should eventually delete - start
interface VchainMetricsResponseDeprecated {
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

const vchainMetricsResponseDecoderDeprecated: Decoder<VchainMetricsResponseDeprecated> = object({
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
// deprecated format - we should eventually delete - end
