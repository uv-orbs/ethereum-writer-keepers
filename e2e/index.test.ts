import test from 'ava';
import { TestEnvironment } from './driver';
import { join } from 'path';
import { sleep } from '../src/helpers';

const driver = new TestEnvironment(join(__dirname, 'docker-compose.yml'));
driver.launchServices();

test.serial('[E2E] app updates Timestamp, Status, Error in status.json', async (t) => {
  t.log('started');
  driver.testLogger = t.log;
  t.timeout(60 * 1000);

  const status1 = JSON.parse(await driver.catFileInService('app', '/opt/orbs/status/status.json'));
  await sleep(2000);
  const status2 = JSON.parse(await driver.catFileInService('app', '/opt/orbs/status/status.json'));

  t.log('status1:', JSON.stringify(status1, null, 2));
  t.log('status2:', JSON.stringify(status2, null, 2));

  t.assert(new Date().getTime() - new Date(status2.Timestamp).getTime() < 10000);
  t.assert(status2.Status.includes('EtherBalance ='));
  t.falsy(status2.Error);
  t.not(status1.Timestamp, status2.Timestamp);
});

test.serial('[E2E] app updates NumVirtualChains in status.json', async (t) => {
  t.log('started');
  driver.testLogger = t.log;
  t.timeout(60 * 1000);

  const status = JSON.parse(await driver.catFileInService('app', '/opt/orbs/status/status.json'));

  t.log('status:', JSON.stringify(status, null, 2));

  t.is(status.Payload.NumVirtualChains, 1);
});

test.serial('[E2E] app updates EtherBalance in status.json', async (t) => {
  t.log('started');
  driver.testLogger = t.log;
  t.timeout(60 * 1000);

  const status = JSON.parse(await driver.catFileInService('app', '/opt/orbs/status/status.json'));

  t.log('status:', JSON.stringify(status, null, 2));

  t.assert(status.Payload.EtherBalance.startsWith('99'));
});

test.serial('[E2E] app sends vote out Ethereum transactions', async (t) => {
  t.log('started');
  driver.testLogger = t.log;
  t.timeout(60 * 1000);

  const events = await driver.ethereumPosDriver.elections.web3Contract.getPastEvents('BanningVote');

  t.log('events:', JSON.stringify(events, null, 2));

  t.assert(events.length > 0);
  t.is(events[0].returnValues.voter, driver.nodeOrbsAddress);
  t.deepEqual(events[0].returnValues.against, ['0x11f4d0A3c12e86B4b5F39B213F7E19D048276DAe']);
});

test.serial('[E2E] app queries Orbs contract', async (t) => {
  t.log('started');
  driver.testLogger = t.log;
  t.timeout(60 * 1000);

  await driver.gammaDriver.incrementCounter();
  await driver.gammaDriver.incrementCounter();
  await sleep(2000);
  const status = JSON.parse(await driver.catFileInService('app', '/opt/orbs/status/status.json'));

  t.log('status:', JSON.stringify(status, null, 2));

  t.is(status.Payload.OrbsCounter, '2');
});
