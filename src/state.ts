import Web3 from 'web3';
import { ElectionsContract } from '@orbs-network/orbs-ethereum-contracts-v2/release/typings/elections-contract';

export class State {
  // status
  lastStatusTime: Date = new Date();
  // management
  numVirtualChains = 0;
  // ethereum
  web3?: Web3;
  ethereumElectionsContract?: ElectionsContract;
  etherBalance = '';
}
