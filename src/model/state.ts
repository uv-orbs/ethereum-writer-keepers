import Web3 from 'web3';
import { Contracts } from '@orbs-network/orbs-ethereum-contracts-v2/release/typings/contracts';
import * as Orbs from 'orbs-client-sdk';

export class State {
  // management service
  managementLastPollTime = 0;
  managementRefTime = 0;
  managementEthToOrbsAddress: { [EthAddress: string]: string } = {};
  managementVirtualChains: { [virtualChainId: string]: ManagementVirtualChain } = {};
  managementMyElectionStatus?: ManagementElectionsStatus;

  // ethereum
  web3?: Web3;
  ethereumElectionsContract?: Contracts['Elections'];
  etherBalance = ''; // string in wei

  // orbs
  orbsAccount?: Orbs.Account;
  orbsClientPerVc: { [virtualChainId: string]: Orbs.Client } = {};
  orbsCounter = BigInt(0);
}

// helpers

// taken from management-service/src/model/state.ts
interface ManagementVirtualChain {
  Expiration: number;
  RolloutGroup: string;
  IdentityType: number;
  Tier: string;
  GenesisRefTime: number;
}

// taken from management-service/src/model/state.ts
interface ManagementElectionsStatus {
  LastUpdateTime: number;
  ReadyToSync: boolean;
  ReadyForCommittee: boolean;
}
