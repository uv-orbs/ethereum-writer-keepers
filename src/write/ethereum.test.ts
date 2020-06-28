import test from 'ava';
import Web3 from 'web3';
import { State, EthereumTxStatus } from '../model/state';
import { Contract } from 'web3-eth-contract';
import {
  initWeb3Client,
  sendEthereumElectionsTransaction,
  sendEthereumVoteOutTransaction,
  readPendingTransactionStatus,
} from './ethereum';
import { sleep } from '../helpers';
import Signer from 'orbs-signer-client';

test('initializes web3 and contracts', (t) => {
  const state = new State();
  initWeb3Client('http://ganache:7545', '0xf8B352100dE45D2668768290504DC89e85766E02', state);
  t.assert(state.web3);
  t.assert(state.ethereumElectionsContract);
});

function getMockWeb3Client(committed = true, reverted = false) {
  return {
    eth: {
      getTransactionCount: async () => {
        await sleep(0);
        return 17;
      },
      sendSignedTransaction: async () => {
        await sleep(0);
        if (!committed) throw new Error('send error');
      },
      getTransaction: async () => {
        await sleep(0);
        if (!committed) return { blockNumber: null };
        else return { blockNumber: 117 };
      },
      getTransactionReceipt: async () => {
        await sleep(0);
        if (!committed) return null;
        if (!reverted) return { status: true, blockNumber: 117 };
        else return { status: false, blockNumber: 117 };
      },
    },
  };
}

function getMockElectionsContract() {
  return {
    options: {
      address: '0xaddress',
    },
    methods: {
      notifyReadyToSync: () => {
        return { encodeABI: () => '0xencodedAbi' };
      },
      notifyReadyForCommittee: () => {
        return { encodeABI: () => '0xencodedAbi' };
      },
      voteOut: () => {
        return { encodeABI: () => '0xencodedAbi' };
      },
    },
  };
}

function getMockSigner(successful = true) {
  return {
    sign: async () => {
      await sleep(0);
      if (!successful) return {};
      return {
        rawTransaction: '0xrawTx',
        transactionHash: '0xtxHash',
      };
    },
  };
}

test('sendEthereumElectionsTransaction ready-to-sync successful', async (t) => {
  const state = new State();
  state.web3 = (getMockWeb3Client() as unknown) as Web3;
  state.signer = (getMockSigner() as unknown) as Signer;
  state.ethereumElectionsContract = (getMockElectionsContract() as unknown) as Contract;
  await sendEthereumElectionsTransaction('ready-to-sync', 'sender', state);

  if (!state.EthereumLastElectionsTx) throw new Error(`EthereumLastElectionsTx not defined`);
  t.is(state.EthereumLastElectionsTx.LastPollTime, 0);
  t.is(state.EthereumLastElectionsTx.Type, 'ready-to-sync');
  t.assert(state.EthereumLastElectionsTx.SendTime > 1400000000);
  t.is(state.EthereumLastElectionsTx.Status, 'pending');
  t.is(state.EthereumLastElectionsTx.TxHash, '0xtxHash');
  t.is(state.EthereumLastElectionsTx.EthBlock, 0);
  t.falsy(state.EthereumLastElectionsTx.OnFinal);
});

test('sendEthereumElectionsTransaction ready-for-committee successful', async (t) => {
  const state = new State();
  state.web3 = (getMockWeb3Client() as unknown) as Web3;
  state.signer = (getMockSigner() as unknown) as Signer;
  state.ethereumElectionsContract = (getMockElectionsContract() as unknown) as Contract;
  await sendEthereumElectionsTransaction('ready-for-committee', 'sender', state);

  if (!state.EthereumLastElectionsTx) throw new Error(`EthereumLastElectionsTx not defined`);
  t.is(state.EthereumLastElectionsTx.LastPollTime, 0);
  t.is(state.EthereumLastElectionsTx.Type, 'ready-for-committee');
  t.assert(state.EthereumLastElectionsTx.SendTime > 1400000000);
  t.is(state.EthereumLastElectionsTx.Status, 'pending');
  t.is(state.EthereumLastElectionsTx.TxHash, '0xtxHash');
  t.is(state.EthereumLastElectionsTx.EthBlock, 0);
  t.falsy(state.EthereumLastElectionsTx.OnFinal);
});

test('sendEthereumElectionsTransaction fails on send', async (t) => {
  const state = new State();
  state.web3 = (getMockWeb3Client(false) as unknown) as Web3;
  state.signer = (getMockSigner() as unknown) as Signer;
  state.ethereumElectionsContract = (getMockElectionsContract() as unknown) as Contract;
  await sendEthereumElectionsTransaction('ready-to-sync', 'sender', state);

  if (!state.EthereumLastElectionsTx) throw new Error(`EthereumLastElectionsTx not defined`);
  t.assert(state.EthereumLastElectionsTx.SendTime > 1400000000);
  t.is(state.EthereumLastElectionsTx.Status, 'failed');
});

test('sendEthereumElectionsTransaction fails on sign', async (t) => {
  const state = new State();
  state.web3 = (getMockWeb3Client() as unknown) as Web3;
  state.signer = (getMockSigner(false) as unknown) as Signer;
  state.ethereumElectionsContract = (getMockElectionsContract() as unknown) as Contract;
  await sendEthereumElectionsTransaction('ready-to-sync', 'sender', state);

  if (!state.EthereumLastElectionsTx) throw new Error(`EthereumLastElectionsTx not defined`);
  t.assert(state.EthereumLastElectionsTx.SendTime > 1400000000);
  t.is(state.EthereumLastElectionsTx.Status, 'failed');
});

test('sendEthereumVoteOutTransaction successful', async (t) => {
  const state = new State();
  state.ManagementRefTime = 99999;
  state.web3 = (getMockWeb3Client() as unknown) as Web3;
  state.signer = (getMockSigner() as unknown) as Signer;
  state.ethereumElectionsContract = (getMockElectionsContract() as unknown) as Contract;
  await sendEthereumVoteOutTransaction([{ EthAddress: 'abc', Weight: 10 }], 'sender', state);

  if (!state.EthereumLastVoteOutTx) throw new Error(`EthereumLastVoteOutTx not defined`);
  t.is(state.EthereumLastVoteOutTx.LastPollTime, 0);
  t.is(state.EthereumLastVoteOutTx.Type, 'vote-out');
  t.assert(state.EthereumLastVoteOutTx.SendTime > 1400000000);
  t.is(state.EthereumLastVoteOutTx.Status, 'pending');
  t.is(state.EthereumLastVoteOutTx.TxHash, '0xtxHash');
  t.is(state.EthereumLastVoteOutTx.EthBlock, 0);
  t.truthy(state.EthereumLastVoteOutTx.OnFinal);
  t.falsy(state.EthereumLastVoteOutTime['abc']);
  state.EthereumLastVoteOutTx.OnFinal?.();
  t.is(state.EthereumLastVoteOutTime['abc'], 99999);
});

test('sendEthereumVoteOutTransaction with no targets', async (t) => {
  const state = new State();
  state.web3 = (getMockWeb3Client() as unknown) as Web3;
  state.signer = (getMockSigner() as unknown) as Signer;
  state.ethereumElectionsContract = (getMockElectionsContract() as unknown) as Contract;
  await sendEthereumVoteOutTransaction([], 'sender', state);
  t.falsy(state.EthereumLastVoteOutTx);
});

test('sendEthereumVoteOutTransaction fails on send', async (t) => {
  const state = new State();
  state.web3 = (getMockWeb3Client(false) as unknown) as Web3;
  state.signer = (getMockSigner() as unknown) as Signer;
  state.ethereumElectionsContract = (getMockElectionsContract() as unknown) as Contract;
  await sendEthereumVoteOutTransaction([{ EthAddress: 'abc', Weight: 10 }], 'sender', state);

  if (!state.EthereumLastVoteOutTx) throw new Error(`EthereumLastVoteOutTx not defined`);
  t.assert(state.EthereumLastVoteOutTx.SendTime > 1400000000);
  t.is(state.EthereumLastVoteOutTx.Status, 'failed');
});

test('sendEthereumVoteOutTransaction fails on sign', async (t) => {
  const state = new State();
  state.web3 = (getMockWeb3Client() as unknown) as Web3;
  state.signer = (getMockSigner(false) as unknown) as Signer;
  state.ethereumElectionsContract = (getMockElectionsContract() as unknown) as Contract;
  await sendEthereumVoteOutTransaction([{ EthAddress: 'abc', Weight: 10 }], 'sender', state);

  if (!state.EthereumLastVoteOutTx) throw new Error(`EthereumLastVoteOutTx not defined`);
  t.assert(state.EthereumLastVoteOutTx.SendTime > 1400000000);
  t.is(state.EthereumLastVoteOutTx.Status, 'failed');
});

// reflects a tx status for a pending tx that already has tx hash but no block number
function getExampleEthereumTxStatus(arr: number[]): EthereumTxStatus {
  return {
    LastPollTime: 0,
    Type: 'ready-to-sync',
    SendTime: 99999,
    Status: 'pending',
    TxHash: 'abc',
    EthBlock: 0,
    OnFinal: () => {
      arr.push(1);
    },
  };
}

test('readPendingTransactionStatus on pending tx that still has no txHash', async (t) => {
  const state = new State();
  state.web3 = (getMockWeb3Client(false, false) as unknown) as Web3;
  const arr: number[] = [];
  state.EthereumLastElectionsTx = getExampleEthereumTxStatus(arr);
  state.EthereumLastElectionsTx.TxHash = '';
  await readPendingTransactionStatus(state.EthereumLastElectionsTx, state);

  t.assert(state.EthereumLastElectionsTx.LastPollTime == 0);
  t.is(arr.length, 0);
});

test('readPendingTransactionStatus on pending tx that has txHash but no block', async (t) => {
  const state = new State();
  state.web3 = (getMockWeb3Client(false, false) as unknown) as Web3;
  const arr: number[] = [];
  state.EthereumLastElectionsTx = getExampleEthereumTxStatus(arr);
  await readPendingTransactionStatus(state.EthereumLastElectionsTx, state);

  t.assert(state.EthereumLastElectionsTx.LastPollTime > 1400000000);
  t.is(state.EthereumLastElectionsTx.Status, 'pending');
  t.is(arr.length, 0);
});

test('readPendingTransactionStatus on pending tx that becomes committed in block', async (t) => {
  const state = new State();
  state.web3 = (getMockWeb3Client(true, false) as unknown) as Web3;
  const arr: number[] = [];
  state.EthereumLastElectionsTx = getExampleEthereumTxStatus(arr);
  await readPendingTransactionStatus(state.EthereumLastElectionsTx, state);

  t.assert(state.EthereumLastElectionsTx.LastPollTime > 1400000000);
  t.is(state.EthereumLastElectionsTx.Status, 'pending');
  t.is(state.EthereumLastElectionsTx.EthBlock, 117);
  t.is(arr.length, 0);
});

test('readPendingTransactionStatus on pending tx that becomes reverted in block', async (t) => {
  const state = new State();
  state.web3 = (getMockWeb3Client(true, true) as unknown) as Web3;
  const arr: number[] = [];
  state.EthereumLastElectionsTx = getExampleEthereumTxStatus(arr);
  await readPendingTransactionStatus(state.EthereumLastElectionsTx, state);

  t.assert(state.EthereumLastElectionsTx.LastPollTime > 1400000000);
  t.is(state.EthereumLastElectionsTx.Status, 'revert');
  t.is(state.EthereumLastElectionsTx.EthBlock, 117);
  t.is(arr.length, 0);
});

test('readPendingTransactionStatus on pending tx that has block but not final', async (t) => {
  const state = new State();
  state.web3 = (getMockWeb3Client(true, false) as unknown) as Web3;
  state.ManagementEthRefBlock = 100;
  const arr: number[] = [];
  state.EthereumLastElectionsTx = getExampleEthereumTxStatus(arr);
  state.EthereumLastElectionsTx.EthBlock = 117;
  await readPendingTransactionStatus(state.EthereumLastElectionsTx, state);

  t.assert(state.EthereumLastElectionsTx.LastPollTime == 0);
  t.is(state.EthereumLastElectionsTx.Status, 'pending');
  t.is(arr.length, 0);
});

test('readPendingTransactionStatus on pending tx that becomes final', async (t) => {
  const state = new State();
  state.web3 = (getMockWeb3Client(true, false) as unknown) as Web3;
  state.ManagementEthRefBlock = 122;
  const arr: number[] = [];
  state.EthereumLastElectionsTx = getExampleEthereumTxStatus(arr);
  state.EthereumLastElectionsTx.EthBlock = 117;
  await readPendingTransactionStatus(state.EthereumLastElectionsTx, state);

  t.assert(state.EthereumLastElectionsTx.LastPollTime == 0);
  t.is(state.EthereumLastElectionsTx.Status, 'final');
  t.is(arr.length, 1);
});
