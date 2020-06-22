import * as Logger from '../logger';
import { State } from '../model/state';
import fetch from 'node-fetch';
import { Decoder, decodeString, num, object, record, bool, str, array } from 'ts-json-decode';
import { getCurrentClockTime } from '../helpers';
import { findEthFromOrbsAddress } from '../model/helpers';

export async function readManagementStatus(endpoint: string, myOrbsAddress: string, state: State) {
  const url = `${endpoint}/status`;
  const response = await fetchManagementStatus(url);

  state.ManagementRefTime = response.Payload.CurrentRefTime;
  state.ManagementEthRefBlock = response.Payload.CurrentRefBlock;
  state.ManagementEthToOrbsAddress = response.Payload.CurrentOrbsAddress;
  state.ManagementVirtualChains = response.Payload.CurrentVirtualChains;
  state.ManagementCurrentCommittee = response.Payload.CurrentCommittee;
  state.ManagementCurrentStandbys = response.Payload.CurrentStandbys;

  const myEthAddress = findEthFromOrbsAddress(myOrbsAddress, state);
  state.ManagementInCommittee = response.Payload.CurrentCommittee.some((n) => n.EthAddress == myEthAddress);
  state.ManagementIsStandby = response.Payload.CurrentStandbys.some((n) => n.EthAddress == myEthAddress);
  state.ManagementMyElectionStatus = response.Payload.CurrentElectionsStatus[myEthAddress];
  state.ManagementOthersElectionStatus = response.Payload.CurrentElectionsStatus;
  delete state.ManagementOthersElectionStatus[myEthAddress];

  // last to be after all possible exceptions and processing delays
  state.ManagementLastPollTime = getCurrentClockTime();

  // log progress
  Logger.log(`Fetched management service, num vchains: ${Object.keys(state.ManagementVirtualChains).length}.`);
}

// helpers

async function fetchManagementStatus(url: string): Promise<ManagementStatusResponse> {
  const res = await fetch(url);
  const body = await res.text();
  try {
    return decodeString(managementStatusResponseDecoder, body);
  } catch (err) {
    Logger.error(err.message);
    throw new Error(`Invalid ManagementStatus response (HTTP-${res.status}):\n${body}`);
  }
}

interface ManagementStatusResponse {
  Payload: {
    CurrentRefTime: number;
    CurrentRefBlock: number;
    CurrentCommittee: { EthAddress: string; Weight: number }[];
    CurrentOrbsAddress: { [EthAddress: string]: string };
    CurrentStandbys: { EthAddress: string }[];
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

const managementStatusResponseDecoder: Decoder<ManagementStatusResponse> = object({
  Payload: object({
    CurrentRefTime: num,
    CurrentRefBlock: num,
    CurrentCommittee: array(
      object({
        EthAddress: str,
        Weight: num,
      })
    ),
    CurrentOrbsAddress: record(str),
    CurrentStandbys: array(
      object({
        EthAddress: str,
      })
    ),
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
