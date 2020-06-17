import * as Logger from '../logger';
import { State } from '../model/state';
import fetch from 'node-fetch';
import { Decoder, decodeString, num, object, record, bool, str } from 'ts-json-decode';
import { getCurrentClockTime } from '../helpers';
import { findEthFromOrbsAddress } from '../model/selectors';

export async function readManagementStatus(endpoint: string, myOrbsAddress: string, state: State) {
  const url = `${endpoint}/status`;
  const response = await fetchManagementStatus(url);

  state.managementRefTime = response.Payload.CurrentRefTime;
  state.managementEthToOrbsAddress = response.Payload.CurrentOrbsAddress;
  state.managementVirtualChains = response.Payload.CurrentVirtualChains;

  const myEthAddress = findEthFromOrbsAddress(myOrbsAddress, state);
  state.managementMyElectionStatus = response.Payload.CurrentElectionsStatus[myEthAddress];

  // last to be after all possible exceptions and processing delays
  state.managementLastPollTime = getCurrentClockTime();

  // log progress
  Logger.log(`Fetched management service, num vchains: ${Object.keys(state.managementVirtualChains).length}.`);
}

// helpers

async function fetchManagementStatus(url: string): Promise<ManagementStatus> {
  const res = await fetch(url);
  const body = await res.text();
  try {
    return decodeString(managementStatusDecoder, body);
  } catch (err) {
    Logger.error(err.message);
    throw new Error(`Invalid ManagementStatus response (HTTP-${res.status}):\n${body}`);
  }
}

interface ManagementStatus {
  Payload: {
    CurrentRefTime: number;
    CurrentOrbsAddress: { [EthAddress: string]: string };
    CurrentElectionsStatus: {
      [EthAddress: string]: {
        LastUpdateTime: number;
        ReadyToSync: boolean;
        ReadyForCommittee: boolean;
      };
    };
    CurrentVirtualChains: {
      [VirtualChainId: string]: {
        Expiration: number;
        RolloutGroup: string;
        IdentityType: number;
        Tier: string;
        GenesisRefTime: number;
      };
    };
  };
}

const managementStatusDecoder: Decoder<ManagementStatus> = object({
  Payload: object({
    CurrentRefTime: num,
    CurrentOrbsAddress: record(str),
    CurrentElectionsStatus: record(
      object({
        LastUpdateTime: num,
        ReadyToSync: bool,
        ReadyForCommittee: bool,
      })
    ),
    CurrentVirtualChains: record(
      object({
        Expiration: num,
        RolloutGroup: str,
        IdentityType: num,
        Tier: str,
        GenesisRefTime: num,
      })
    ),
  }),
});
