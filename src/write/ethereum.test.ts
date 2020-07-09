import test from 'ava';
import {
  initWeb3Client,
  sendEthereumElectionsTransaction,
  sendEthereumVoteOutTransaction,
  readPendingTransactionStatus,
} from './ethereum';
import Web3 from 'web3';
import { State, EthereumTxStatus } from '../model/state';
import { Contract } from 'web3-eth-contract';
import { sleep, getCurrentClockTime } from '../helpers';
import Signer from 'orbs-signer-client';
import { exampleConfig } from '../config.example';

test('initializes web3 and contracts', (t) => {
  const state = new State();
  initWeb3Client('http://ganache:7545', '0xf8B352100dE45D2668768290504DC89e85766E02', state);
  t.assert(state.web3);
  t.assert(state.ethereumElectionsContract);
});

function getMockWeb3Client(committed = true, reverted = false, removed = false, overmax = false) {
  return {
    eth: {
      getTransactionCount: async () => {
        await sleep(0);
        return 17;
      },
      getGasPrice: async () => {
        await sleep(0);
        if (overmax) return '999000000000';
        return '40000000000';
      },
      sendSignedTransaction: async () => {
        await sleep(0);
        if (!committed) throw new Error('send error');
      },
      getTransaction: async () => {
        await sleep(0);
        if (removed) return null;
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

test('sendEthereumElectionsTransaction ready-to-sync successful after successful send', async (t) => {
  const state = new State();
  state.EthereumLastElectionsTx = getExampleEthereumTxStatus([]);
  state.EthereumLastElectionsTx.Status = 'final';
  state.web3 = (getMockWeb3Client() as unknown) as Web3;
  state.signer = (getMockSigner() as unknown) as Signer;
  state.ethereumElectionsContract = (getMockElectionsContract() as unknown) as Contract;
  await sendEthereumElectionsTransaction('ready-to-sync', 'sender', state, exampleConfig);

  if (!state.EthereumLastElectionsTx) throw new Error(`EthereumLastElectionsTx not defined`);
  t.is(state.EthereumLastElectionsTx.LastPollTime, 0);
  t.is(state.EthereumLastElectionsTx.Type, 'ready-to-sync');
  t.assert(state.EthereumLastElectionsTx.SendTime > 1400000000);
  t.is(state.EthereumLastElectionsTx.GasPriceStrategy, 'discount');
  t.is(state.EthereumLastElectionsTx.GasPrice, 30000000000);
  t.is(state.EthereumLastElectionsTx.Status, 'pending');
  t.is(state.EthereumLastElectionsTx.TxHash, '0xtxHash');
  t.is(state.EthereumLastElectionsTx.EthBlock, 0);
  t.falsy(state.EthereumLastElectionsTx.OnFinal);
  t.is(state.EthereumConsecutiveTxTimeouts, 0);
});

test('sendEthereumElectionsTransaction ready-for-committee successful after timeout', async (t) => {
  const state = new State();
  state.EthereumLastElectionsTx = getExampleEthereumTxStatus([]);
  state.EthereumLastElectionsTx.Status = 'timeout';
  state.web3 = (getMockWeb3Client() as unknown) as Web3;
  state.signer = (getMockSigner() as unknown) as Signer;
  state.ethereumElectionsContract = (getMockElectionsContract() as unknown) as Contract;
  await sendEthereumElectionsTransaction('ready-for-committee', 'sender', state, exampleConfig);

  if (!state.EthereumLastElectionsTx) throw new Error(`EthereumLastElectionsTx not defined`);
  t.is(state.EthereumLastElectionsTx.LastPollTime, 0);
  t.is(state.EthereumLastElectionsTx.Type, 'ready-for-committee');
  t.assert(state.EthereumLastElectionsTx.SendTime > 1400000000);
  t.is(state.EthereumLastElectionsTx.GasPriceStrategy, 'recommended');
  t.is(state.EthereumLastElectionsTx.GasPrice, 40000000000);
  t.is(state.EthereumLastElectionsTx.Status, 'pending');
  t.is(state.EthereumLastElectionsTx.TxHash, '0xtxHash');
  t.is(state.EthereumLastElectionsTx.EthBlock, 0);
  t.falsy(state.EthereumLastElectionsTx.OnFinal);
  t.is(state.EthereumConsecutiveTxTimeouts, 0);
});

test('sendEthereumElectionsTransaction ready-for-committee successful with huge gas price', async (t) => {
  const state = new State();
  state.EthereumLastElectionsTx = getExampleEthereumTxStatus([]);
  state.EthereumLastElectionsTx.Status = 'timeout';
  state.web3 = (getMockWeb3Client(true, false, false, true) as unknown) as Web3;
  state.signer = (getMockSigner() as unknown) as Signer;
  state.ethereumElectionsContract = (getMockElectionsContract() as unknown) as Contract;
  await sendEthereumElectionsTransaction('ready-for-committee', 'sender', state, exampleConfig);

  if (!state.EthereumLastElectionsTx) throw new Error(`EthereumLastElectionsTx not defined`);
  t.is(state.EthereumLastElectionsTx.LastPollTime, 0);
  t.is(state.EthereumLastElectionsTx.Type, 'ready-for-committee');
  t.assert(state.EthereumLastElectionsTx.SendTime > 1400000000);
  t.is(state.EthereumLastElectionsTx.GasPriceStrategy, 'recommended');
  t.is(state.EthereumLastElectionsTx.GasPrice, exampleConfig.EthereumMaxGasPrice);
  t.is(state.EthereumLastElectionsTx.Status, 'pending');
  t.is(state.EthereumLastElectionsTx.TxHash, '0xtxHash');
  t.is(state.EthereumLastElectionsTx.EthBlock, 0);
  t.falsy(state.EthereumLastElectionsTx.OnFinal);
  t.is(state.EthereumConsecutiveTxTimeouts, 0);
});

test('sendEthereumElectionsTransaction fails on send', async (t) => {
  const state = new State();
  state.web3 = (getMockWeb3Client(false) as unknown) as Web3;
  state.signer = (getMockSigner() as unknown) as Signer;
  state.ethereumElectionsContract = (getMockElectionsContract() as unknown) as Contract;
  await sendEthereumElectionsTransaction('ready-to-sync', 'sender', state, exampleConfig);

  if (!state.EthereumLastElectionsTx) throw new Error(`EthereumLastElectionsTx not defined`);
  t.assert(state.EthereumLastElectionsTx.SendTime > 1400000000);
  t.is(state.EthereumLastElectionsTx.Status, 'failed-send');
});

test('sendEthereumElectionsTransaction fails on sign', async (t) => {
  const state = new State();
  state.web3 = (getMockWeb3Client() as unknown) as Web3;
  state.signer = (getMockSigner(false) as unknown) as Signer;
  state.ethereumElectionsContract = (getMockElectionsContract() as unknown) as Contract;
  await sendEthereumElectionsTransaction('ready-to-sync', 'sender', state, exampleConfig);

  if (!state.EthereumLastElectionsTx) throw new Error(`EthereumLastElectionsTx not defined`);
  t.assert(state.EthereumLastElectionsTx.SendTime > 1400000000);
  t.is(state.EthereumLastElectionsTx.Status, 'failed-send');
});

test('sendEthereumVoteOutTransaction successful after failed send', async (t) => {
  const state = new State();
  state.EthereumLastVoteOutTx = getExampleEthereumTxStatus([]);
  state.EthereumLastVoteOutTx.Status = 'failed-send';
  state.ManagementRefTime = 99999;
  state.web3 = (getMockWeb3Client() as unknown) as Web3;
  state.signer = (getMockSigner() as unknown) as Signer;
  state.ethereumElectionsContract = (getMockElectionsContract() as unknown) as Contract;
  await sendEthereumVoteOutTransaction([{ EthAddress: 'abc', Weight: 10 }], 'sender', state, exampleConfig);

  if (!state.EthereumLastVoteOutTx) throw new Error(`EthereumLastVoteOutTx not defined`);
  t.is(state.EthereumLastVoteOutTx.LastPollTime, 0);
  t.is(state.EthereumLastVoteOutTx.Type, 'vote-out');
  t.assert(state.EthereumLastVoteOutTx.SendTime > 1400000000);
  t.is(state.EthereumLastVoteOutTx.GasPriceStrategy, 'recommended');
  t.is(state.EthereumLastVoteOutTx.GasPrice, 40000000000);
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
  await sendEthereumVoteOutTransaction([], 'sender', state, exampleConfig);
  t.falsy(state.EthereumLastVoteOutTx);
});

test('sendEthereumVoteOutTransaction fails on send', async (t) => {
  const state = new State();
  state.web3 = (getMockWeb3Client(false) as unknown) as Web3;
  state.signer = (getMockSigner() as unknown) as Signer;
  state.ethereumElectionsContract = (getMockElectionsContract() as unknown) as Contract;
  await sendEthereumVoteOutTransaction([{ EthAddress: 'abc', Weight: 10 }], 'sender', state, exampleConfig);

  if (!state.EthereumLastVoteOutTx) throw new Error(`EthereumLastVoteOutTx not defined`);
  t.assert(state.EthereumLastVoteOutTx.SendTime > 1400000000);
  t.is(state.EthereumLastVoteOutTx.Status, 'failed-send');
});

test('sendEthereumVoteOutTransaction fails on sign', async (t) => {
  const state = new State();
  state.web3 = (getMockWeb3Client() as unknown) as Web3;
  state.signer = (getMockSigner(false) as unknown) as Signer;
  state.ethereumElectionsContract = (getMockElectionsContract() as unknown) as Contract;
  await sendEthereumVoteOutTransaction([{ EthAddress: 'abc', Weight: 10 }], 'sender', state, exampleConfig);

  if (!state.EthereumLastVoteOutTx) throw new Error(`EthereumLastVoteOutTx not defined`);
  t.assert(state.EthereumLastVoteOutTx.SendTime > 1400000000);
  t.is(state.EthereumLastVoteOutTx.Status, 'failed-send');
});

// reflects a tx status for a recent pending tx that already has tx hash but no block number
function getExampleEthereumTxStatus(arr: number[]): EthereumTxStatus {
  return {
    LastPollTime: 0,
    Type: 'ready-to-sync',
    SendTime: getCurrentClockTime(),
    GasPriceStrategy: 'discount',
    GasPrice: 30000000000,
    Status: 'pending',
    TxHash: 'abc',
    EthBlock: 0,
    OnFinal: () => {
      arr.push(1);
    },
  };
}

test('readPendingTransactionStatus on a recent pending tx that still has no txHash', async (t) => {
  const state = new State();
  state.web3 = (getMockWeb3Client(false, false) as unknown) as Web3;
  const arr: number[] = [];
  state.EthereumLastElectionsTx = getExampleEthereumTxStatus(arr);
  state.EthereumLastElectionsTx.TxHash = '';
  state.EthereumConsecutiveTxTimeouts = 3;
  await readPendingTransactionStatus(state.EthereumLastElectionsTx, state, exampleConfig);

  t.assert(state.EthereumLastElectionsTx.LastPollTime == 0);
  t.is(state.EthereumLastElectionsTx.Status, 'pending');
  t.is(state.EthereumConsecutiveTxTimeouts, 3);
  t.is(arr.length, 0);
});

test('readPendingTransactionStatus on an old pending tx that still has no txHash', async (t) => {
  const state = new State();
  state.web3 = (getMockWeb3Client(false, false) as unknown) as Web3;
  const arr: number[] = [];
  state.EthereumLastElectionsTx = getExampleEthereumTxStatus(arr);
  state.EthereumLastElectionsTx.TxHash = '';
  state.EthereumLastElectionsTx.SendTime = getCurrentClockTime() - 24 * 60 * 60;
  state.EthereumConsecutiveTxTimeouts = 3;
  await readPendingTransactionStatus(state.EthereumLastElectionsTx, state, exampleConfig);

  t.assert(state.EthereumLastElectionsTx.LastPollTime == 0);
  t.is(state.EthereumLastElectionsTx.Status, 'pending');
  t.is(state.EthereumConsecutiveTxTimeouts, 3);
  t.is(arr.length, 0);
});

test('readPendingTransactionStatus on a recent pending tx that has txHash but no block', async (t) => {
  const state = new State();
  state.web3 = (getMockWeb3Client(false, false) as unknown) as Web3;
  const arr: number[] = [];
  state.EthereumLastElectionsTx = getExampleEthereumTxStatus(arr);
  state.EthereumConsecutiveTxTimeouts = 3;
  await readPendingTransactionStatus(state.EthereumLastElectionsTx, state, exampleConfig);

  t.assert(state.EthereumLastElectionsTx.LastPollTime > 1400000000);
  t.is(state.EthereumLastElectionsTx.Status, 'pending');
  t.is(state.EthereumConsecutiveTxTimeouts, 3);
  t.is(arr.length, 0);
});

test('readPendingTransactionStatus on an old pending tx that has txHash but no block', async (t) => {
  const state = new State();
  state.web3 = (getMockWeb3Client(false, false) as unknown) as Web3;
  const arr: number[] = [];
  state.EthereumLastElectionsTx = getExampleEthereumTxStatus(arr);
  state.EthereumLastElectionsTx.SendTime = getCurrentClockTime() - 24 * 60 * 60;
  state.EthereumConsecutiveTxTimeouts = 3;
  await readPendingTransactionStatus(state.EthereumLastElectionsTx, state, exampleConfig);

  t.assert(state.EthereumLastElectionsTx.LastPollTime > 1400000000);
  t.is(state.EthereumLastElectionsTx.Status, 'timeout');
  t.is(state.EthereumConsecutiveTxTimeouts, 4);
  t.is(arr.length, 0);
});

test('readPendingTransactionStatus on a recent pending tx that becomes committed in block', async (t) => {
  const state = new State();
  state.web3 = (getMockWeb3Client(true, false) as unknown) as Web3;
  const arr: number[] = [];
  state.EthereumLastElectionsTx = getExampleEthereumTxStatus(arr);
  state.EthereumConsecutiveTxTimeouts = 3;
  await readPendingTransactionStatus(state.EthereumLastElectionsTx, state, exampleConfig);

  t.assert(state.EthereumLastElectionsTx.LastPollTime > 1400000000);
  t.is(state.EthereumLastElectionsTx.Status, 'pending');
  t.is(state.EthereumLastElectionsTx.EthBlock, 117);
  t.is(state.EthereumConsecutiveTxTimeouts, 0);
  t.is(arr.length, 0);
});

test('readPendingTransactionStatus on an old pending tx that becomes committed in block', async (t) => {
  const state = new State();
  state.web3 = (getMockWeb3Client(true, false) as unknown) as Web3;
  const arr: number[] = [];
  state.EthereumLastElectionsTx = getExampleEthereumTxStatus(arr);
  state.EthereumLastElectionsTx.SendTime = getCurrentClockTime() - 24 * 60 * 60;
  state.EthereumConsecutiveTxTimeouts = 3;
  await readPendingTransactionStatus(state.EthereumLastElectionsTx, state, exampleConfig);

  t.assert(state.EthereumLastElectionsTx.LastPollTime > 1400000000);
  t.is(state.EthereumLastElectionsTx.Status, 'pending');
  t.is(state.EthereumLastElectionsTx.EthBlock, 117);
  t.is(state.EthereumConsecutiveTxTimeouts, 0);
  t.is(arr.length, 0);
});

test('readPendingTransactionStatus on a recent pending tx that becomes removed from pool', async (t) => {
  const state = new State();
  state.web3 = (getMockWeb3Client(true, false, true) as unknown) as Web3;
  const arr: number[] = [];
  state.EthereumLastElectionsTx = getExampleEthereumTxStatus(arr);
  state.EthereumConsecutiveTxTimeouts = 3;
  await readPendingTransactionStatus(state.EthereumLastElectionsTx, state, exampleConfig);

  t.assert(state.EthereumLastElectionsTx.LastPollTime > 1400000000);
  t.is(state.EthereumLastElectionsTx.Status, 'removed-from-pool');
  t.is(state.EthereumConsecutiveTxTimeouts, 3);
  t.is(arr.length, 0);
});

test('readPendingTransactionStatus on a recent pending tx that becomes reverted in block', async (t) => {
  const state = new State();
  state.web3 = (getMockWeb3Client(true, true) as unknown) as Web3;
  const arr: number[] = [];
  state.EthereumLastElectionsTx = getExampleEthereumTxStatus(arr);
  state.EthereumConsecutiveTxTimeouts = 3;
  await readPendingTransactionStatus(state.EthereumLastElectionsTx, state, exampleConfig);

  t.assert(state.EthereumLastElectionsTx.LastPollTime > 1400000000);
  t.is(state.EthereumLastElectionsTx.Status, 'revert');
  t.is(state.EthereumLastElectionsTx.EthBlock, 117);
  t.is(state.EthereumConsecutiveTxTimeouts, 0);
  t.is(arr.length, 0);
});

test('readPendingTransactionStatus on a recent pending tx committed in block but not final', async (t) => {
  const state = new State();
  state.web3 = (getMockWeb3Client(true, false) as unknown) as Web3;
  state.ManagementEthRefBlock = 100;
  const arr: number[] = [];
  state.EthereumLastElectionsTx = getExampleEthereumTxStatus(arr);
  state.EthereumLastElectionsTx.EthBlock = 117;
  state.EthereumConsecutiveTxTimeouts = 0;
  await readPendingTransactionStatus(state.EthereumLastElectionsTx, state, exampleConfig);

  t.assert(state.EthereumLastElectionsTx.LastPollTime == 0);
  t.is(state.EthereumLastElectionsTx.Status, 'pending');
  t.is(state.EthereumConsecutiveTxTimeouts, 0);
  t.is(arr.length, 0);
});

test('readPendingTransactionStatus on an old pending tx committed in block but not final', async (t) => {
  const state = new State();
  state.web3 = (getMockWeb3Client(true, false) as unknown) as Web3;
  state.ManagementEthRefBlock = 100;
  const arr: number[] = [];
  state.EthereumLastElectionsTx = getExampleEthereumTxStatus(arr);
  state.EthereumLastElectionsTx.SendTime = getCurrentClockTime() - 24 * 60 * 60;
  state.EthereumLastElectionsTx.EthBlock = 117;
  state.EthereumConsecutiveTxTimeouts = 0;
  await readPendingTransactionStatus(state.EthereumLastElectionsTx, state, exampleConfig);

  t.assert(state.EthereumLastElectionsTx.LastPollTime == 0);
  t.is(state.EthereumLastElectionsTx.Status, 'pending');
  t.is(state.EthereumConsecutiveTxTimeouts, 0);
  t.is(arr.length, 0);
});

test('readPendingTransactionStatus on a recent pending tx committed in block that becomes final', async (t) => {
  const state = new State();
  state.web3 = (getMockWeb3Client(true, false) as unknown) as Web3;
  state.ManagementEthRefBlock = 122;
  const arr: number[] = [];
  state.EthereumLastElectionsTx = getExampleEthereumTxStatus(arr);
  state.EthereumLastElectionsTx.EthBlock = 117;
  state.EthereumConsecutiveTxTimeouts = 0;
  await readPendingTransactionStatus(state.EthereumLastElectionsTx, state, exampleConfig);

  t.assert(state.EthereumLastElectionsTx.LastPollTime == 0);
  t.is(state.EthereumLastElectionsTx.Status, 'final');
  t.is(state.EthereumConsecutiveTxTimeouts, 0);
  t.is(arr.length, 1);
});

test('readPendingTransactionStatus on an old pending tx committed in block that becomes final', async (t) => {
  const state = new State();
  state.web3 = (getMockWeb3Client(true, false) as unknown) as Web3;
  state.ManagementEthRefBlock = 122;
  const arr: number[] = [];
  state.EthereumLastElectionsTx = getExampleEthereumTxStatus(arr);
  state.EthereumLastElectionsTx.SendTime = getCurrentClockTime() - 24 * 60 * 60;
  state.EthereumLastElectionsTx.EthBlock = 117;
  state.EthereumConsecutiveTxTimeouts = 0;
  await readPendingTransactionStatus(state.EthereumLastElectionsTx, state, exampleConfig);

  t.assert(state.EthereumLastElectionsTx.LastPollTime == 0);
  t.is(state.EthereumLastElectionsTx.Status, 'final');
  t.is(state.EthereumConsecutiveTxTimeouts, 0);
  t.is(arr.length, 1);
});
