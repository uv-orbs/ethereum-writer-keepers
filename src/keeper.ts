import Web3 from "web3";
import { AbiItem } from "web3-utils"
import { Contract } from 'web3-eth-contract';
import { parseArgs } from './cli-args';
import { writeStatusToDisk } from './write/status';
import { jsonStringifyComplexTypes, toNumber } from './helpers';
import { TransactionConfig } from 'web3-core';
import Signer from 'orbs-signer-client';
import { readManagementStatus2, setLeaderStatus } from './leader'
import { readFileSync, readdirSync } from 'fs';

import * as tasks from './tasks.json';
import * as Logger from './logger';

const GAS_LIMIT_ESTIMATE_EXTRA = 300000;
const GAS_LIMIT_HARD_LIMIT = 2000000;
const MAX_LAST_TX = 10;
const PERIODIC_MINUTES = 5; // every 5 min

const abiFolder = process.cwd() + '/abi/';
const config = parseArgs(process.argv);
const HTTP_TIMEOUT_SEC = 20;

//////////////////////////////////////
export class Keeper {
    private abis: { [key: string]: AbiItem };
    private contracts: { [key: string]: Contract };
    private web3: Web3;
    private status: any;
    private signer: Signer;
    private gasPrice: string;

    //////////////////////////////////////
    constructor() {
        this.abis = {};
        this.contracts = {};
        this.gasPrice = '';
        this.status = {
            start: Date.now(),
            successTX: [],
            failedTX: [],
            config: config,
            periodicUpdates: 0,
            lastUpdate: '',
            leaderIndex: -1,
            leaderName: '',
            balance: {
                "BNB": 0
            }
        };
        this.web3 = new Web3(
            new Web3.providers.HttpProvider(config.EthereumEndpoint, {
                keepAlive: true,
                timeout: HTTP_TIMEOUT_SEC * 1000,
            })
        );
        this.signer = new Signer(config.SignerEndpoint);


        // load all ABIs                
        Logger.log(`loading abis at ${abiFolder}`);
        readdirSync(abiFolder).forEach(file => {
            Logger.log(`loading ABI file: ${file}`);
            let abi = JSON.parse(readFileSync(abiFolder + file, 'utf8'));
            if (abi) {
                var name = file.substring(0, file.lastIndexOf('.')) || file;
                this.abis[name] = abi;
            }
        });
    }
    getUptime(): string {
        // get total seconds between the times
        var delta = Math.abs(Date.now() - this.status.start) / 1000;

        // calculate (and subtract) whole days
        var days = Math.floor(delta / 86400);
        delta -= days * 86400;

        // calculate (and subtract) whole hours
        var hours = Math.floor(delta / 3600) % 24;
        delta -= hours * 3600;

        // calculate (and subtract) whole minutes
        var minutes = Math.floor(delta / 60) % 60;
        delta -= minutes * 60;

        // what's left is seconds
        var seconds = delta % 60;  // in theory the modulus is not required

        return `${days} days : ${hours}:${minutes}:${seconds}`;
    }
    //////////////////////////////////////
    getStatus(): any {
        // keept last 5 tx
        if (this.status.successTX.length > MAX_LAST_TX) {
            this.status.successTX.length.shift();
        }
        if (this.status.failTX.length > MAX_LAST_TX) {
            this.status.successTX.length.shift();
        }
        this.status.uptime = this.getUptime();
        return this.status;
    }
    //////////////////////////////////////
    async periodicUpdate() {
        this.status.periodicUpdates += 1;
        const now = new Date();
        this.status.lastUpdateUTC = now.toUTCString();

        // has to be set- used in [findEthFromOrbsAddress]
        const management =
            await readManagementStatus2(config.ManagementServiceEndpoint, config.NodeOrbsAddress, this.status);

        // sets leader index and name
        setLeaderStatus(management.Payload.CurrentCommittee, this.status);

        // balance
        this.status.balance.BNB = await this.web3.eth.getBalance(`0x${this.status.myEthAddress}`);

        writeStatusToDisk(config.StatusJsonPath, this.status, config);
    }
    //////////////////////////////////////
    async start() {
        Logger.log('Manager started');
        // first update
        await this.periodicUpdate();
        // periodic every 10 min
        setInterval(this.periodicUpdate.bind(this), 60000 * PERIODIC_MINUTES);

        for (const t of tasks) {
            // first call - after that, task sets the next execution
            this.exec(t);
        }
    }
    //////////////////////////////////////
    async signAndSendTransaction(
        encodedAbi: string,
        contractAddress: string,
        senderAddress: string
    ): Promise<string> {
        const web3 = this.web3;
        if (!web3) throw new Error('Cannot send tx until web3 client is initialized.');
        if (!this.signer) throw new Error('Cannot send tx until signer is initialized.');

        const nonce = await web3.eth.getTransactionCount(senderAddress, 'latest'); // ignore pending pool

        const txObject: TransactionConfig = {
            from: senderAddress,
            to: contractAddress,
            gasPrice: this.gasPrice,
            data: encodedAbi,
            nonce: nonce,
        };

        Logger.log(`About to estimate gas for tx object: ${jsonStringifyComplexTypes(txObject)}.`);

        let gasLimit = toNumber(await web3.eth.estimateGas(txObject));
        if (gasLimit <= 0) {
            throw new Error(`Cannot estimate gas for tx with data ${encodedAbi}.`);
        }
        gasLimit += GAS_LIMIT_ESTIMATE_EXTRA;
        if (gasLimit > GAS_LIMIT_HARD_LIMIT) {
            throw new Error(`Gas limit estimate ${gasLimit} over hard limit ${GAS_LIMIT_HARD_LIMIT}.`);
        }
        txObject.gas = gasLimit;

        Logger.log(`About to sign and send tx object: ${jsonStringifyComplexTypes(txObject)}.`);

        const { rawTransaction, transactionHash } = await this.signer.sign(txObject);
        if (!rawTransaction || !transactionHash) {
            throw new Error(`Could not sign tx object: ${jsonStringifyComplexTypes(txObject)}.`);
        }

        return new Promise<string>((resolve, reject) => {
            // normally this returns a promise that resolves on receipt, but we ignore this mechanism and have our own
            web3.eth
                .sendSignedTransaction(rawTransaction, (err) => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve(transactionHash);

                    }
                })
                .catch(() => {
                    // do nothing (ignore the web3 promise)
                });
        });
    }

    //////////////////////////////////////
    async sendNetworkContract(network: string, contract: Contract, method: string, params: any) {
        const now = new Date();
        const dt = now.toISOString();

        const tx = `${dt} ${network} ${contract} ${method} ${params}`;

        // encode call
        const encoded = contract.methods[method](params).encodeABI();
        await this.signAndSendTransaction(encoded, contract.options.address, config.NodeOrbsAddress).then(() => {
            this.status.successTX.push(tx);
            Logger.log('SUCCESS:' + tx);
        }).catch(() => {
            this.status.failedTX.push(tx);
            Logger.log('FAIL:' + tx);
        });
    }
    //////////////////////////////////////
    execNetworkAdress(task: any, network: string, adrs: string) {
        // resolve abi
        const abi = this.abis[task.abi];
        if (!abi) {
            return console.error(`abi ${task.abi} does not exist in folder`);
        }

        // resolev contract
        if (!(adrs in this.contracts)) {
            this.contracts[adrs] = new this.web3.eth.Contract(abi, adrs, {
                from: config.NodeOrbsAddress, // default from address
                gasPrice: this.gasPrice // default gas price in wei, 20 gwei in this case
            });
        }
        const contract = this.contracts[adrs];

        for (let send of task.send) {
            // has params
            if (send.params) {
                for (let params of send.params) {
                    this.sendNetworkContract(network, contract, send.method, params);
                }
            } // no params
            else {
                this.sendNetworkContract(network, contract, send.method, null);
            }
        }
    }
    //////////////////////////////////////
    execNetwork(task: any, network: string) {
        for (let adrs of task.addresses) {
            this.execNetworkAdress(task, network, adrs);
        }
    }
    //////////////////////////////////////
    async exec(task: any) {
        Logger.log(`execute task: ${task.name}`);
        if (!task.active) {
            Logger.log(`task ${task.name} inactive`);
            return;
        }

        for (let network of task.networks) {
            this.execNetwork(task, network);

        }
        // update before loop execution
        this.gasPrice = await this.web3.eth.getGasPrice();

        setTimeout(() => {
            this.exec(task);
        }, task.minInterval * 1000 * 60);

    }
}

////////////////////////////////////////////////
// test
if (require.main === module) {
    const m = new Keeper();
    m.start();
}