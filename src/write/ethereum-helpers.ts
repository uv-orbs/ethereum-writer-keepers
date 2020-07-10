import * as Logger from '../logger';
import { State, EthereumTxStatus, GasPriceStrategy } from '../model/state';
import { getCurrentClockTime, jsonStringifyComplexTypes } from '../helpers';

export type Type = 'ready-to-sync' | 'ready-for-committee';

export interface EthereumTxParams {
  EthereumDiscountGasPriceFactor: number;
  EthereumDiscountTxTimeoutSeconds: number;
  EthereumNonDiscountTxTimeoutSeconds: number;
  EthereumMaxGasPrice: number;
}

export function getGasPriceStrategy(previousTxStatus: EthereumTxStatus | undefined): GasPriceStrategy {
  if (!previousTxStatus) return 'discount';
  if (previousTxStatus.Status == 'final') return 'discount';
  return 'recommended';
}

export async function calcGasPrice(
  strategy: GasPriceStrategy,
  state: State,
  config: EthereumTxParams
): Promise<number> {
  if (!state.web3) throw new Error('Cannot calc gas price until web3 client is initialized.');

  const recommendedGasPrice = parseInt(await state.web3.eth.getGasPrice());
  if (recommendedGasPrice <= 0) {
    throw new Error(`Cannot retrieve recommended gas price.`);
  }

  let res = recommendedGasPrice;
  if (strategy == 'discount') res = Math.round(config.EthereumDiscountGasPriceFactor * recommendedGasPrice);
  if (res > config.EthereumMaxGasPrice) {
    Logger.error(`Gas price ${res} surpassed maximum allowed ${config.EthereumMaxGasPrice}.`);
    res = config.EthereumMaxGasPrice;
  }
  return res;
}

export async function signAndSendTransaction(
  encodedAbi: string,
  contractAddress: string,
  senderAddress: string,
  gasPrice: number,
  state: State
): Promise<string> {
  if (!state.web3) throw new Error('Cannot send tx until web3 client is initialized.');
  if (!state.signer) throw new Error('Cannot send tx until signer is initialized.');

  const nonce = await state.web3.eth.getTransactionCount(senderAddress, 'latest'); // ignore pending pool

  const txObject = {
    from: senderAddress,
    to: contractAddress,
    gasPrice: gasPrice,
    gas: '0x7FFFFFFF', // TODO: fix with real value
    data: encodedAbi,
    nonce: nonce,
  };
  const { rawTransaction, transactionHash } = await state.signer.sign(txObject);
  if (!rawTransaction || !transactionHash) {
    throw new Error(`Could not sign tx object: ${jsonStringifyComplexTypes(txObject)}.`);
  }

  await state.web3.eth.sendSignedTransaction(rawTransaction);
  return transactionHash;
}

export function handlePendingTxTimeout(status: EthereumTxStatus | undefined, state: State, config: EthereumTxParams) {
  if (!status) return;
  if (status.EthBlock > 0) return; // committed
  if (status.Status != 'pending') return;

  const now = getCurrentClockTime();
  const timeout =
    status.GasPriceStrategy == 'discount'
      ? config.EthereumDiscountTxTimeoutSeconds
      : config.EthereumNonDiscountTxTimeoutSeconds;
  if (now - status.SendTime > timeout) {
    Logger.error(`Last ethereum ${status.Type} tx ${status.TxHash} timed out with gas price ${status.GasPrice}.`);
    status.Status = 'timeout';
    state.EthereumConsecutiveTxTimeouts++;
  }
}
