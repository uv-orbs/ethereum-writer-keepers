import test from 'ava';
import { TestEnvironment } from './driver';
import { join } from 'path';
import { sleep } from '../src/helpers';

const driver = new TestEnvironment(join(__dirname, 'docker-compose.yml'));
driver.launchServices();

test.serial('[E2E] app updates LastStatusTime in status.json', async (t) => {
  t.timeout(60 * 1000);
  const status1 = JSON.parse(await driver.catFileInService('app', '/opt/orbs/status/status.json'));
  await sleep(2000);
  const status2 = JSON.parse(await driver.catFileInService('app', '/opt/orbs/status/status.json'));
  t.assert(new Date().getTime() - new Date(status2.LastStatusTime).getTime() < 10000);
  t.not(status1.LastStatusTime, status2.LastStatusTime);
});

test.serial('[E2E] app updates NumVirtualChains in status.json', async (t) => {
  t.timeout(60 * 1000);
  const status = JSON.parse(await driver.catFileInService('app', '/opt/orbs/status/status.json'));
  t.is(status.NumVirtualChains, 2);
});

test.serial('[E2E] app updates EtherBalance in status.json', async (t) => {
  t.timeout(60 * 1000);
  const status = JSON.parse(await driver.catFileInService('app', '/opt/orbs/status/status.json'));
  t.assert(status.EtherBalance.startsWith('99'));
});

test.serial('[E2E] app sends vote out Ethereum transactions', async (t) => {
  t.timeout(60 * 1000);
  const events = await driver.ethereumPosDriver.elections.web3Contract.getPastEvents('BanningVote');
  t.assert(events.length > 0);
  t.is(events[0].returnValues.voter, driver.nodeEthereumAddress);
  t.deepEqual(events[0].returnValues.against, ['0x11f4d0A3c12e86B4b5F39B213F7E19D048276DAe']);
});
