import Web3 from 'web3';
import { Contract } from 'web3-eth-contract';
import { Contracts } from '@orbs-network/orbs-ethereum-contracts-v2/release/typings/contracts';
import * as Orbs from 'orbs-client-sdk';

export class State {
  // updated by read/management.ts
  ManagementLastPollTime = 0; // UTC seconds
  ManagementRefTime = 0; // UTC seconds
  ManagementEthRefBlock = 0;
  ManagementEthToOrbsAddress: { [EthAddress: string]: string } = {};
  ManagementVirtualChains: { [VirtualChainId: string]: ManagementVirtualChain } = {};
  ManagementInCommittee = false;
  ManagementIsStandby = false;
  ManagementMyElectionStatus?: ManagementElectionsStatus;
  ManagementOthersElectionStatus: { [EthAddress: string]: ManagementElectionsStatus } = {};
  ManagementCurrentCommittee: CommitteeMember[] = [];
  ManagementCurrentStandbys: { EthAddress: string }[] = [];

  // updated by read/vchain-metrics.ts
  VchainMetricsLastPollTime = 0; // UTC seconds
  VchainMetrics: { [VirtualChainId: string]: VchainMetrics } = {};

  // updated by read/vchain-reputations.ts
  VchainReputationsLastPollTime = 0; // UTC seconds
  VchainReputations: { [VirtualChainId: string]: VchainReputations } = {};

  // updated by write/ethereum.ts
  EthereumLastElectionsTx?: EthereumTxStatus;
  EthereumLastVoteOutTx?: EthereumTxStatus;
  EthereumLastVoteOutTime: { [EthAddress: string]: number } = {};
  EthereumBalanceLastPollTime = 0; // UTC seconds
  EtherBalance = ''; // string in wei

  // updated by index.ts
  VchainSyncStatus: VchainSyncStatusEnum = 'not-exist';
  EthereumSyncStatus: EthereumSyncStatusEnum = 'out-of-sync';

  // updated by model/logic-ethsync.ts
  TimeEnteredStandbyWithoutVcSync = 0;

  // updated by model/logic-voteout.ts
  TimeEnteredBadReputation: { [EthAddress: string]: BadReputationSince } = {};

  // TODO: remove all next ones from state (they're not serializable)

  // ethereum clients - updated by write/ethereum.ts
  Web3?: Web3;
  EthereumElectionsContract?: Contract;

  // orbs clients - updated by read/vchain-reputations.ts
  OrbsAccount = Orbs.createAccount();
  OrbsClientPerVchain: { [VirtualChainId: string]: Orbs.Client } = {};

  // OLD ethereum - TODO remove
  OLDWeb3?: Web3;
  OLDEthereumElectionsContract?: Contracts['Elections'];
}

// helpers

export type VchainSyncStatusEnum = 'not-exist' | 'exist-not-in-sync' | 'in-sync';

export type EthereumSyncStatusEnum = 'out-of-sync' | 'operational' | 'tx-pending' | 'need-reset';

export type VchainReputations = { [OrbsAddress: string]: number };

export type BadReputationSince = { [VirtualChainId: string]: number }; // UTC seconds

export type CommitteeMember = { EthAddress: string; Weight: number };

export interface VchainMetrics {
  LastBlockHeight: number;
  LastBlockTime: number; // UTC seconds
  UptimeSeconds: number;
}

export interface EthereumTxStatus {
  LastPollTime: number; // UTC seconds
  Type: 'ready-to-sync' | 'ready-for-committee' | 'vote-out';
  SendTime: number; // UTC seconds
  Status: 'pending' | 'final' | 'revert'; // final according to ManagementEthRefBlock
  TxHash: string;
  EthBlock: number;
  OnFinal?: () => void;
}

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
