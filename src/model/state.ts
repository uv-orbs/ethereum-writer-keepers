import Web3 from 'web3';
import { Contracts } from '@orbs-network/orbs-ethereum-contracts-v2/release/typings/contracts';
import * as Orbs from 'orbs-client-sdk';

export class State {
  // state machines
  VchainSyncStatus: VchainSyncStatusEnum = 'not-exist';

  // management service
  ManagementLastPollTime = 0; // UTC time in seconds (like unix timestamp / Ethereum block time)
  ManagementRefTime = 0; // UTC time in seconds (like unix timestamp / Ethereum block time)
  ManagementEthToOrbsAddress: { [EthAddress: string]: string } = {};
  ManagementVirtualChains: { [VirtualChainId: string]: ManagementVirtualChain } = {};
  ManagementMyElectionStatus?: ManagementElectionsStatus;

  // vchains
  VchainMetricsLastPollTime = 0; // UTC time in seconds (like unix timestamp / Ethereum block time)
  VchainMetrics: { [VirtualChainId: string]: VchainMetrics } = {};
  VchainReputationsLastPollTime = 0; // UTC time in seconds (like unix timestamp / Ethereum block time)
  VchainReputations: { [VirtualChainId: string]: VchainReputations } = {};

  // orbs
  OrbsAccount = Orbs.createAccount();
  OrbsClientPerVchain: { [VirtualChainId: string]: Orbs.Client } = {};

  // ethereum
  Web3?: Web3;
  EthereumElectionsContract?: Contracts['Elections'];
  EtherBalance = ''; // string in wei
}

// helpers

export type VchainSyncStatusEnum = 'not-exist' | 'exist-not-in-sync' | 'in-sync';

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
  UptimeSeconds: number;
}

export type VchainReputations = { [OrbsAddress: string]: number };
