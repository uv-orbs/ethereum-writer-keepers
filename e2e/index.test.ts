import test from 'ava';
import { TestEnvironment } from './driver';
import { join } from 'path';
import { sleep } from '../src/helpers';
import {
  deepDataMatcher,
  isValidEtherBalance,
  isPositiveNumber,
  isValidTimeRef,
  isValidBlock,
  isNonEmptyString,
} from './deep-matcher';

const driver = new TestEnvironment(join(__dirname, 'docker-compose.yml'));
driver.launchServices();

// node is OrbsAddress 16fcf728f8dc3f687132f2157d8379c021a08c12, EthAddress 29ce860a2247d97160d6dfc087a15f41e2349087
// node was voted unready, so "ReadyToSync": false, also the node is not standby
test.serial('[E2E] launches with one vchain out of sync -> sends ready-to-sync', async (t) => {
  t.log('started');
  driver.testLogger = t.log;
  t.timeout(60 * 1000);

  await sleep(1000);

  const status = await driver.catJsonInService('app', '/opt/orbs/status/status.json');
  t.log('status:', JSON.stringify(status, null, 2));

  const errors = deepDataMatcher(status.Payload, {
    Uptime: isPositiveNumber,
    MemoryBytesUsed: isPositiveNumber,
    EthereumSyncStatus: 'operational',
    VchainSyncStatus: 'exist-not-in-sync',
    EthereumBalanceLastPollTime: isValidTimeRef,
    EtherBalance: isValidEtherBalance,
    EthereumConsecutiveTxTimeouts: 0,
    EthereumLastElectionsTx: {
      Type: 'ready-to-sync',
      SendTime: isValidTimeRef,
      GasPriceStrategy: 'discount',
      GasPrice: 30000000000,
    },
    EthereumLastVoteUnreadyTime: {},
    VchainReputationsLastPollTime: isValidTimeRef,
    VchainReputations: {
      '42': {
        '1111111111111111111111111111111111111111': 2,
        '86544bdd6c8b957cd198252c45fa215fc3892126': 6,
        '2222222222222222222222222222222222222222': 1,
      },
      '43': {},
    },
    VchainMetricsLastPollTime: isValidTimeRef,
    VchainMetrics: {
      '42': {
        LastBlockHeight: isValidBlock,
        LastBlockTime: isValidTimeRef,
        UptimeSeconds: isPositiveNumber,
      },
      '43': {
        LastBlockHeight: isValidBlock,
        LastBlockTime: isValidTimeRef,
        UptimeSeconds: isPositiveNumber,
      },
    },
    ManagementLastPollTime: isValidTimeRef,
    ManagementEthRefBlock: 3454,
    ManagementInCommittee: false,
    ManagementIsStandby: false,
    ManagementMyElectionStatus: {
      LastUpdateTime: isValidTimeRef,
      ReadyToSync: false,
      ReadyForCommittee: false,
    },
    TimeEnteredStandbyWithoutVcSync: 0,
    TimeEnteredBadReputation: {},
  });
  t.deepEqual(errors, []);

  const events = await driver.ethereumPosDriver.elections.web3Contract.getPastEvents('GuardianStatusUpdated');
  t.log('events:', JSON.stringify(events, null, 2));

  t.assert(events.length == 1);
  t.is(events[0].returnValues.addr.toLowerCase(), '0x29ce860a2247d97160d6dfc087a15f41e2349087');
  t.is(events[0].returnValues.readyToSync, true);
  t.is(events[0].returnValues.readyForCommittee, false);
});

test.serial('[E2E] all vchains synced -> sends ready-for-committee', async (t) => {
  t.log('started');
  driver.testLogger = t.log;
  t.timeout(60 * 1000);

  t.log('telling mock to start showing chain-43 as synced');
  await driver.fetch('chain-43', 8080, 'change-mock-state/synced');
  await sleep(4000);

  const status = await driver.catJsonInService('app', '/opt/orbs/status/status.json');
  t.log('status:', JSON.stringify(status, null, 2));

  const errors = deepDataMatcher(status.Payload, {
    Uptime: isPositiveNumber,
    MemoryBytesUsed: isPositiveNumber,
    EthereumSyncStatus: 'operational',
    VchainSyncStatus: 'in-sync',
    EthereumBalanceLastPollTime: isValidTimeRef,
    EtherBalance: isValidEtherBalance,
    EthereumConsecutiveTxTimeouts: 0,
    EthereumLastElectionsTx: {
      Type: 'ready-for-committee',
      SendTime: isValidTimeRef,
      GasPriceStrategy: 'discount',
      GasPrice: 30000000000,
    },
    EthereumLastVoteUnreadyTime: {},
    VchainReputationsLastPollTime: isValidTimeRef,
    VchainReputations: {
      '42': {
        '1111111111111111111111111111111111111111': 2,
        '86544bdd6c8b957cd198252c45fa215fc3892126': 6,
        '2222222222222222222222222222222222222222': 1,
      },
      '43': {},
    },
    VchainMetricsLastPollTime: isValidTimeRef,
    VchainMetrics: {
      '42': {
        LastBlockHeight: isValidBlock,
        LastBlockTime: isValidTimeRef,
        UptimeSeconds: isPositiveNumber,
      },
      '43': {
        LastBlockHeight: isValidBlock,
        LastBlockTime: isValidTimeRef,
        UptimeSeconds: isPositiveNumber,
      },
    },
    ManagementLastPollTime: isValidTimeRef,
    ManagementEthRefBlock: 3454,
    ManagementInCommittee: false,
    ManagementIsStandby: false,
    ManagementMyElectionStatus: {
      LastUpdateTime: isValidTimeRef,
      ReadyToSync: false,
      ReadyForCommittee: false,
    },
    TimeEnteredStandbyWithoutVcSync: 0,
    TimeEnteredBadReputation: {},
  });
  t.deepEqual(errors, []);

  const events = await driver.ethereumPosDriver.elections.web3Contract.getPastEvents('GuardianStatusUpdated');
  t.log('last event:', JSON.stringify(events, null, 2));

  t.assert(events.length == 1);
  t.is(events[0].returnValues.addr.toLowerCase(), '0x29ce860a2247d97160d6dfc087a15f41e2349087');
  t.is(events[0].returnValues.readyToSync, true);
  t.is(events[0].returnValues.readyForCommittee, true);
});

test.serial('[E2E] enter committee -> sends vote unready for bad rep', async (t) => {
  t.log('started');
  driver.testLogger = t.log;
  t.timeout(60 * 1000);

  t.log('telling mock to start showing the node in the committee');
  await driver.fetch('management-service', 8080, 'change-mock-state/in-committee');
  await sleep(5000);

  const status = await driver.catJsonInService('app', '/opt/orbs/status/status.json');
  t.log('status:', JSON.stringify(status, null, 2));

  const errors = deepDataMatcher(status.Payload, {
    Uptime: isPositiveNumber,
    MemoryBytesUsed: isPositiveNumber,
    EthereumSyncStatus: 'operational',
    VchainSyncStatus: 'in-sync',
    EthereumBalanceLastPollTime: isValidTimeRef,
    EtherBalance: isValidEtherBalance,
    EthereumConsecutiveTxTimeouts: 0,
    EthereumLastElectionsTx: {
      LastPollTime: isValidTimeRef,
      Type: 'ready-for-committee',
      SendTime: isValidTimeRef,
      GasPriceStrategy: 'discount',
      GasPrice: 30000000000,
      Status: 'final',
      TxHash: isNonEmptyString,
      EthBlock: isValidBlock,
    },
    EthereumLastVoteUnreadyTx: {
      LastPollTime: isValidTimeRef,
      Type: 'vote-unready',
      SendTime: isValidTimeRef,
      GasPriceStrategy: 'discount',
      GasPrice: 30000000000,
      Status: 'final',
      TxHash: isNonEmptyString,
      EthBlock: isValidBlock,
    },
    EthereumLastVoteUnreadyTime: {
      e16e965a4cc3fcd597ecdb9cd9ab8f3e6a750ac9: isValidTimeRef,
    },
    VchainReputationsLastPollTime: isValidTimeRef,
    VchainReputations: {
      '42': {
        '1111111111111111111111111111111111111111': 2,
        '86544bdd6c8b957cd198252c45fa215fc3892126': 6,
        '2222222222222222222222222222222222222222': 1,
      },
      '43': {},
    },
    VchainMetricsLastPollTime: isValidTimeRef,
    VchainMetrics: {
      '42': {
        LastBlockHeight: isValidBlock,
        LastBlockTime: isValidTimeRef,
        UptimeSeconds: isPositiveNumber,
      },
      '43': {
        LastBlockHeight: isValidBlock,
        LastBlockTime: isValidTimeRef,
        UptimeSeconds: isPositiveNumber,
      },
    },
    ManagementLastPollTime: isValidTimeRef,
    ManagementEthRefBlock: 3454,
    ManagementInCommittee: true,
    ManagementIsStandby: false,
    ManagementMyElectionStatus: {
      LastUpdateTime: isValidTimeRef,
      ReadyToSync: false,
      ReadyForCommittee: false,
    },
    TimeEnteredStandbyWithoutVcSync: 0,
    TimeEnteredBadReputation: {
      '8a670ddc1910c27278ab7db2a148a0dccc6bf0f5': {
        '42': 0,
        '43': 0,
      },
      e16e965a4cc3fcd597ecdb9cd9ab8f3e6a750ac9: {
        '42': isValidTimeRef,
        '43': 0,
      },
      '29ce860a2247d97160d6dfc087a15f41e2349087': {
        '42': 0,
        '43': 0,
      },
    },
  });
  t.deepEqual(errors, []);

  const events = await driver.ethereumPosDriver.elections.web3Contract.getPastEvents('VoteUnreadyCasted');
  t.log('last event:', JSON.stringify(events, null, 2));

  t.assert(events.length == 1);
  t.is(events[0].returnValues.voter.toLowerCase(), '0x29ce860a2247d97160d6dfc087a15f41e2349087');
  t.is(events[0].returnValues.subject.toLowerCase(), '0xe16e965a4cc3fcd597ecdb9cd9ab8f3e6a750ac9');
});
