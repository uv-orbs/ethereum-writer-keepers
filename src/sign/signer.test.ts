import test from 'ava';
import BN from 'bn.js';
import {Signer} from './signer';


// import nock from 'nock';

test('testSigner', async (t) => {
    new Signer('');
    await Promise.resolve();
    t.deepEqual(1, 1)


    const signer = new Signer('');
    try {
        await signer.sign({
            to: '0x3535353535353535353535353535353535353535',
            gasPrice: 20 * 10**9,
            gasLimit: 1,
            value: new BN('10').pow(new BN(18)),
            data: '0x',
            nonce: 9,
        }, 1)
    } catch (err) {
        t.log(err)
    }
});
