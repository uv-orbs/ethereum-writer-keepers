import Web3 from 'web3';
import { Contracts } from '@orbs-network/orbs-ethereum-contracts-v2/release/typings/contracts';
import * as Orbs from 'orbs-client-sdk';

export class State {
  // state machines
  VchainSyncStatus: VchainSyncStatusEnum = 'not-exist';
  EthereumWriteStatus: EthereumWriteStatusEnum = 'out-of-sync';
  TimeEnteredStandbyWithoutVcSync = 0;

  // management service
  ManagementLastPollTime = 0; // UTC time in seconds (like unix timestamp / Ethereum block time)
  ManagementRefTime = 0; // UTC time in seconds (like unix timestamp / Ethereum block time)
  ManagementEthRefBlock = 0;
  ManagementEthToOrbsAddress: { [EthAddress: string]: string } = {};
  ManagementVirtualChains: { [VirtualChainId: string]: ManagementVirtualChain } = {};
  ManagementInCommittee = false;
  ManagementIsStandby = false;
  ManagementMyElectionStatus?: ManagementElectionsStatus;
  ManagementOthersElectionStatus: { [EthAddress: string]: ManagementElectionsStatus } = {};
  ManagementCurrentStandbys: { EthAddress: string }[] = [];

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
  EthereumLastElectionsTxPollTime = 0;
  EthereumLastElectionsTx?: EthereumTxStatus;
  EtherBalance = ''; // string in wei
}

// helpers

export type VchainSyncStatusEnum = 'not-exist' | 'exist-not-in-sync' | 'in-sync';

export type EthereumWriteStatusEnum = 'out-of-sync' | 'operational' | 'tx-pending' | 'need-reset';

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

export interface EthereumTxStatus {
  SendTime: number;
  Status: 'pending' | 'final' | 'revert'; // final according to ManagementEthRefBlock
  TxHash: string;
  EthBlock: number;
}
