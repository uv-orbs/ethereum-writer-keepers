const { Transaction } = require("ethereumjs-tx");
const fetch = require("node-fetch");
const { encode } = require("rlp");
const { keccak256, isHexStrict, hexToNumber } = require("web3-utils");
const NodeSignInputBuilder = require("./node-sign-input-builder");
const NodeSignOutputReader = require("./node-sign-output-reader");

function getSignatureParameters(signature, chainId) {
    if (!isHexStrict(signature)) {
        throw new Error(`Given value "${signature}" is not a valid hex string.`);
    }

    const r = signature.slice(0, 66);
    const s = `0x${signature.slice(66, 130)}`;
    let v = `0x${signature.slice(130, 132)}`;
    v = hexToNumber(v);

    if (![27, 28].includes(v)) v += 27;

    v = v + 8 + chainId * 2 // see https://github.com/ethereum/EIPs/blob/master/EIPS/eip-155.md
    return {
        r,
        s,
        v
    };
}

function getRlpEncodedDataForSignature(ethTx, chainId) {
    const rawBuffers = ethTx.raw.slice(0, 6);

    // see https://github.com/ethereum/EIPs/blob/master/EIPS/eip-155.md
    const additional = [Buffer.of(chainId), Buffer.of(0), Buffer.of(0)]
    const allElements = rawBuffers.concat(additional)
    const payload = encode(allElements);
    return payload;
}

class Signer {
    constructor(host) {
        this.host = host;
    }

    async _sign(payload) {
        const body = new NodeSignInputBuilder(payload).build();

        const res = await fetch(`${this.host}/eth-sign`, {
            method: "post",
            body:  body,
            headers: { "Content-Type": "application/membuffers" },
        });

        if (!res.ok) {
            throw new Error(`Bad response: ${res.statusText}`);
        }

        const data = await res.buffer();
        return new NodeSignOutputReader(data).getSignature();
    }

    async sign(transaction, privateKey) {
        // we are going to ignore privateKey completely - and use our signer service instead

        const ethTx = new Transaction(transaction);

        console.log('injecting chainId to first buffer', transaction.chainId)

        const payload = getRlpEncodedDataForSignature(ethTx, transaction.chainId);
        const signature = await this._sign(payload);

        const { r, s, v } = getSignatureParameters("0x" + signature.toString("hex"), transaction.chainId);

        ethTx.r = r;
        ethTx.s = s;
        ethTx.v = v;

        const validationResult = ethTx.validate(true);

        if (validationResult !== '') {
            // TODO throw instead of print
            console.error(`XXXXXXX TransactionSigner Error: ${validationResult}`);
        }

        const rlpEncoded = ethTx.serialize().toString('hex');
        const rawTransaction = '0x' + rlpEncoded;
        const transactionHash = keccak256(rawTransaction);

        return {
            messageHash: Buffer.from(ethTx.hash(false)).toString('hex'),
            v: '0x' + Buffer.from(ethTx.v).toString('hex'),
            r: '0x' + Buffer.from(ethTx.r).toString('hex'),
            s: '0x' + Buffer.from(ethTx.s).toString('hex'),
            rawTransaction,
            transactionHash
        };
    }
}

module.exports = {
    Signer
}
