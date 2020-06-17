import * as Logger from '../logger';
import { Configuration } from '../config';
import { State } from '../model/state';
import HDWalletProvider from '@truffle/hdwallet-provider';
import Web3 from 'web3';
import { provider } from 'web3-core';
import { Web3Driver } from '@orbs-network/orbs-ethereum-contracts-v2/release/eth';

export function initWeb3Client(config: Configuration, state: State) {
  // init web3
  const provider = (new HDWalletProvider(
    'vanish junk genuine web seminar cook absurd royal ability series taste method identify elevator liquid',
    config.EthereumEndpoint,
    0,
    100,
    false
  ) as unknown) as provider;
  state.web3 = new Web3(provider);
  state.web3.eth.defaultAccount = config.NodeEthereumAddress;

  // init ethereum contracts
  const web3 = state.web3;
  const orbsWeb3Driver = new Web3Driver(() => web3);
  state.ethereumElectionsContract = orbsWeb3Driver.getExisting('Elections', config.EthereumElectionsContract);
  state.ethereumElectionsContract.web3Contract.defaultAccount = config.NodeEthereumAddress;
}

// TODO: improve timeouts, retries and such
export async function sendEthereumVoteOutTransaction(
  bannedValidatorsEthereumAddresses: string[],
  senderEthereumAddress: string,
  state: State
) {
  if (!state.ethereumElectionsContract) throw new Error('Cannot send Ethereum tx until web3 client is initialized.');
  const receipt = await state.ethereumElectionsContract.setBanningVotes(bannedValidatorsEthereumAddresses, {
    from: senderEthereumAddress,
  });
  Logger.log(`Sent vote out against [${bannedValidatorsEthereumAddresses}], txHash: ${receipt.transactionHash}.`);
}

export async function readEtherBalance(state: State) {
  if (!state.web3) throw new Error('Cannot check ETH balance until web3 client is initialized.');
  state.etherBalance = await state.web3.eth.getBalance(state.web3.eth.defaultAccount as string);
}
