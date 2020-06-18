import Web3 from 'web3';
import { Contracts } from '@orbs-network/orbs-ethereum-contracts-v2/release/typings/contracts';
import * as Orbs from 'orbs-client-sdk';

export class State {
  // management service
  managementLastPollTime = 0; // UTC time in seconds (like unix timestamp / Ethereum block time)
  managementRefTime = 0; // UTC time in seconds (like unix timestamp / Ethereum block time)
  managementEthToOrbsAddress: { [EthAddress: string]: string } = {};
  managementVirtualChains: { [virtualChainId: string]: ManagementVirtualChain } = {};
  managementMyElectionStatus?: ManagementElectionsStatus;

  // vchains
  vchainMetricsLastPollTime = 0; // UTC time in seconds (like unix timestamp / Ethereum block time)
  vchainMetrics: { [virtualChainId: string]: VchainMetrics } = {};
  vchainReputationsLastPollTime = 0; // UTC time in seconds (like unix timestamp / Ethereum block time)
  vchainReputations: { [virtualChainId: string]: VchainReputations } = {};

  // ethereum
  web3?: Web3;
  ethereumElectionsContract?: Contracts['Elections'];
  etherBalance = ''; // string in wei

  // orbs
  orbsAccount = Orbs.createAccount();
  orbsClientPerVchain: { [virtualChainId: string]: Orbs.Client } = {};
}

// helpers

// taken from management-service/src/model/state.ts
export interface ManagementVirtualChain {
  Expiration: number;
  RolloutGroup: string;
  IdentityType: number;
  Tier: string;
  GenesisRefTime: number;
}

// taken from management-service/src/model/state.ts
export interface ManagementElectionsStatus {
  LastUpdateTime: number;
  ReadyToSync: boolean;
  ReadyForCommittee: boolean;
}

export interface VchainMetrics {
  LastBlockHeight: number;
  LastBlockTime: number; // UTC time in seconds (like unix timestamp / Ethereum block time)
  Uptime: number; // seconds
}

export interface VchainReputations {
  TempCounter: BigInt;
}
