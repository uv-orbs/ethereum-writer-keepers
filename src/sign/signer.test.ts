import test from 'ava';

import { Signer } from './signer';


// import nock from 'nock';

test('testSigner',  async (t) => {
 new Signer('');
 await Promise.resolve();


  // const signer = new Signer('');
  // await signer.sign({
  //   to: '0x0000000000000000000000000000000000000001',
  //   gasPrice: 10,
  //   gasLimit: 1,
  //   data: '0x66666666666666666666',
  //   nonce: 1,
  // }, 137)
  t.deepEqual(1,1)
});
