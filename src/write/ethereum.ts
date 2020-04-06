import { Configuration } from '../config';
import { State } from '../state';
import HDWalletProvider from '@truffle/hdwallet-provider';
import Web3 from 'web3';
import { provider } from 'web3-core';
import { ElectionsContract } from '@orbs-network/orbs-ethereum-contracts-v2/release/typings/elections-contract';
import { compiledContracts } from '@orbs-network/orbs-ethereum-contracts-v2/release/compiled-contracts';

export function initWeb3Client(config: Configuration, state: State) {
  // init web3
  const provider = (new HDWalletProvider(
    'vanish junk genuine web seminar cook absurd royal ability series taste method identify elevator liquid',
    config.EthereumEndpoint,
    0,
    100,
    false
  ) as unknown) as provider;
  const web3 = new Web3(provider);
  web3.eth.defaultAccount = config.NodeEthereumAddress;
  state.web3 = web3;

  // init ethereum contracts
  const electionsContractAbi = compiledContracts['Elections'].abi;
  state.ethereumElectionsContract = (new web3.eth.Contract(
    electionsContractAbi,
    config.EthereumElectionsContract
  ) as unknown) as ElectionsContract;
}

export async function sendEthereumVoteOutTransaction(bannedValidatorsEthereumAddresses: string[], state: State) {
  if (!state.ethereumElectionsContract) throw new Error('Cannot send Ethereum tx until web3 client is initialized');
  await state.ethereumElectionsContract.setBanningVotes(bannedValidatorsEthereumAddresses);
}

export async function readEtherBalance(state: State) {
  if (!state.web3) throw new Error('Cannot check ETH balance until web3 client is initialized');
  state.etherBalance = await state.web3.eth.getBalance(state.web3.eth.defaultAccount as string);
}
