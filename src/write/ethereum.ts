import * as Logger from '../logger';
import { State, EthereumTxStatus, CommitteeMember } from '../model/state';
import Web3 from 'web3';
import { compiledContracts } from '@orbs-network/orbs-ethereum-contracts-v2/release/compiled-contracts';
import { getCurrentClockTime, jsonStringifyComplexTypes } from '../helpers';

export async function sendEthereumElectionsTransaction(type: Type, nodeOrbsAddress: string, state: State) {
  if (!state.ethereumElectionsContract) throw new Error('Cannot send tx until contract object is initialized.');

  const contractMethod =
    type == 'ready-to-sync'
      ? state.ethereumElectionsContract.methods.notifyReadyToSync
      : state.ethereumElectionsContract.methods.notifyReadyForCommittee;

  state.EthereumLastElectionsTx = {
    LastPollTime: 0,
    Type: type,
    SendTime: getCurrentClockTime(),
    Status: 'pending',
    TxHash: '',
    EthBlock: 0,
  };

  try {
    const encodedAbi = contractMethod().encodeABI() as string;
    const contractAddress = state.ethereumElectionsContract.options.address;
    const senderAddress = `0x${nodeOrbsAddress}`;
    const txHash = await signAndSendTransaction(encodedAbi, contractAddress, senderAddress, state);
    state.EthereumLastElectionsTx.TxHash = txHash;
    Logger.log(`${type} transaction sent with txHash ${txHash}.`);
  } catch (err) {
    Logger.error(`Failed sending ${type} transaction: ${err.stack}`);
    state.EthereumLastElectionsTx.Status = 'failed';
  }
}

export async function sendEthereumVoteOutTransaction(to: CommitteeMember[], nodeOrbsAddress: string, state: State) {
  if (!state.ethereumElectionsContract) throw new Error('Cannot send tx until contract object is initialized.');

  if (to.length == 0) return;
  const ethAddress = to[0].EthAddress;
  const ethAddressForAbi = `0x${ethAddress}`;
  const contractMethod = state.ethereumElectionsContract.methods.voteOut;

  state.EthereumLastVoteOutTx = {
    LastPollTime: 0,
    Type: 'vote-out',
    SendTime: getCurrentClockTime(),
    Status: 'pending',
    TxHash: '',
    EthBlock: 0,
    OnFinal: () => (state.EthereumLastVoteOutTime[ethAddress] = state.ManagementRefTime),
  };

  try {
    const encodedAbi = contractMethod(ethAddressForAbi).encodeABI() as string;
    const contractAddress = state.ethereumElectionsContract.options.address;
    const senderAddress = `0x${nodeOrbsAddress}`;
    const txHash = await signAndSendTransaction(encodedAbi, contractAddress, senderAddress, state);
    state.EthereumLastVoteOutTx.TxHash = txHash;
    Logger.log(`Vote out transaction against ${ethAddress} sent with txHash ${txHash}.`);
  } catch (err) {
    Logger.error(`Failed sending vote out transaction: ${err.stack}`);
    state.EthereumLastVoteOutTx.Status = 'failed';
  }
}

export async function readPendingTransactionStatus(status: EthereumTxStatus | undefined, state: State) {
  if (!state.web3) throw new Error('Cannot check pending tx status until web3 client is initialized.');
  if (!status) return;
  if (status.Status != 'pending') return;
  if (!status.TxHash) return;

  // no need to poll ethereum if we know the block, just wait until management service reaches it
  if (status.EthBlock > 0) {
    if (state.ManagementEthRefBlock >= status.EthBlock) {
      Logger.log(`Last ethereum ${status.Type} tx ${status.TxHash} is final.`);
      status.Status = 'final';
      if (status.OnFinal) status.OnFinal();
    }
    return;
  }

  // done before the actual execution to space out calls in case of connection errors
  status.LastPollTime = getCurrentClockTime();

  // needed since getTransactionReceipt fails on light client when tx is pending
  const tx = await state.web3.eth.getTransaction(status.TxHash);
  if (tx.blockNumber == null) {
    Logger.log(`Last ethereum ${status.Type} tx ${status.TxHash} is still waiting for block.`);
    return; // still pending
  }

  const receipt = await state.web3.eth.getTransactionReceipt(status.TxHash);
  if (receipt == null) return; // still pending
  status.EthBlock = receipt.blockNumber;
  if (receipt.status) {
    Logger.log(`Last ethereum ${status.Type} tx ${status.TxHash} was successful in block ${receipt.blockNumber}.`);
    if (state.ManagementEthRefBlock >= receipt.blockNumber) {
      Logger.log(`Last ethereum ${status.Type} tx ${status.TxHash} is final.`);
      status.Status = 'final';
      if (status.OnFinal) status.OnFinal();
    }
  } else {
    Logger.error(`Last ethereum ${status.Type} tx ${status.TxHash} was reverted in block ${receipt.blockNumber}.`);
    status.Status = 'revert';
  }
}

export async function readEtherBalance(nodeOrbsAddress: string, state: State) {
  if (!state.web3) throw new Error('Cannot check ETH balance until web3 client is initialized.');

  // done before the actual execution to space out calls in case of connection errors
  state.EthereumBalanceLastPollTime = getCurrentClockTime();

  state.EtherBalance = await state.web3.eth.getBalance(nodeOrbsAddress);

  // log progress
  Logger.log(`Fetched ETH balance for account ${nodeOrbsAddress}: ${state.EtherBalance}.`);
}

// helpers

type Type = 'ready-to-sync' | 'ready-for-committee';

export function initWeb3Client(ethereumEndpoint: string, electionsContractAddress: string, state: State) {
  // init web3
  state.web3 = new Web3(ethereumEndpoint);
  // TODO: state.web3.eth.transactionPollingTimeout = 0.01;
  // TODO:  do we need to disable web3 receipt polling explicitly?

  // init contracts
  const electionsAbi = compiledContracts.Elections.abi;
  state.ethereumElectionsContract = new state.web3.eth.Contract(electionsAbi, electionsContractAddress);
}

async function signAndSendTransaction(
  encodedAbi: string,
  contractAddress: string,
  senderAddress: string,
  state: State
): Promise<string> {
  if (!state.web3) throw new Error('Cannot send tx until web3 client is initialized.');
  if (!state.signer) throw new Error('Cannot send tx until signer is initialized.');

  const nonce = await state.web3.eth.getTransactionCount(senderAddress);

  const txObject = {
    from: senderAddress,
    to: contractAddress,
    // TODO: complete me gasPrice: '1',
    // TODO: complete me gas: 1,
    gas: '0x7FFFFFFF',
    data: encodedAbi,
    nonce: nonce,
  };
  const { rawTransaction, transactionHash } = await state.signer.sign(txObject);
  if (!rawTransaction || !transactionHash)
    throw new Error(`Could not sign tx object: ${jsonStringifyComplexTypes(txObject)}.`);

  await state.web3.eth.sendSignedTransaction(rawTransaction);
  return transactionHash;
}
