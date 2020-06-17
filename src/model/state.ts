import Web3 from 'web3';
import { Contracts } from '@orbs-network/orbs-ethereum-contracts-v2/release/typings/contracts';
import * as Orbs from 'orbs-client-sdk';

export class State {
  // management
  numVirtualChains = 0;

  // ethereum
  web3?: Web3;
  ethereumElectionsContract?: Contracts['Elections'];
  etherBalance = ''; // string in wei

  // orbs
  orbsAccount?: Orbs.Account;
  orbsClientPerVc: { [virtualChainId: number]: Orbs.Client } = {};
  orbsCounter = BigInt(0);
}
