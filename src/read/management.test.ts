import test from 'ava';
import nock from 'nock';
import { readManagementStatus } from './management';
import { State } from '../model/state';
import _ from 'lodash';
import { getCurrentClockTime, jsonStringifyComplexTypes } from '../helpers';

const myOrbsAddress = '86544bdd6c8b957cd198252c45fa215fc3892126';
const exampleManagementServiceEndpoint = 'http://management-service:8080';
const managementStatusPath = '/status';
const validManagementStatusResponse = {
  ExtraField: 'something',
  Payload: {
    CurrentRefTime: 1592400033,
    CurrentRefBlock: 3454,
    CurrentCommittee: [
      {
        EthAddress: '8a670ddc1910c27278ab7db2a148a0dccc6bf0f5',
        Weight: 40000,
        Name: 'Validator3',
      },
      {
        EthAddress: 'e16e965a4cc3fcd597ecdb9cd9ab8f3e6a750ac9',
        Weight: 30000,
        Name: 'Validator1',
      },
    ],
    CurrentCandidates: [
      {
        EthAddress: 'cb6642be414696f77336dae06fed3775f08de0ea',
        IsStandby: true,
        Name: 'Validator4',
      },
      {
        EthAddress: '51baa09f2f7dfc7a0f65886b68720958d389cac7',
        IsStandby: true,
        Name: 'Validator2',
      },
      {
        EthAddress: '29ce860a2247d97160d6dfc087a15f41e2349087',
        IsStandby: true,
        Name: 'Validator0',
      },
    ],
    Guardians: {
      '29ce860a2247d97160d6dfc087a15f41e2349087': {
        EthAddress: '29ce860a2247d97160d6dfc087a15f41e2349087',
        OrbsAddress: '16fcf728f8dc3f687132f2157d8379c021a08c12',
        Ip: '41.206.134.10',
        EffectiveStake: 10000,
        ElectionsStatus: {
          LastUpdateTime: 1592400001,
          ReadyToSync: true,
          ReadyForCommittee: true,
          TimeToStale: 5000,
        },
        Name: 'Validator0',
        Website: 'Validator0-website',
        Contact: 'Validator0-contact',
      },
      e16e965a4cc3fcd597ecdb9cd9ab8f3e6a750ac9: {
        // that's me
        EthAddress: 'e16e965a4cc3fcd597ecdb9cd9ab8f3e6a750ac9',
        OrbsAddress: '86544bdd6c8b957cd198252c45fa215fc3892126',
        Ip: '225.110.150.90',
        EffectiveStake: 20000,
        ElectionsStatus: {
          LastUpdateTime: 1592400002,
          ReadyToSync: true,
          ReadyForCommittee: true,
          TimeToStale: 604800,
        },
        Name: 'Validator1',
        Website: 'Validator1-website',
        Contact: 'Validator1-contact',
      },
      '51baa09f2f7dfc7a0f65886b68720958d389cac7': {
        EthAddress: '51baa09f2f7dfc7a0f65886b68720958d389cac7',
        OrbsAddress: '174dc3b45bdbbc32aa0b95e64d0247ce99b08f69',
        Ip: '81.186.160.159',
        EffectiveStake: 30000,
        ElectionsStatus: {
          LastUpdateTime: 1592400001,
          ReadyToSync: true,
          ReadyForCommittee: false,
          TimeToStale: 86400,
        },
        Name: 'Validator2',
        Website: 'Validator2-website',
        Contact: 'Validator2-contact',
      },
      '8a670ddc1910c27278ab7db2a148a0dccc6bf0f5': {
        EthAddress: '8a670ddc1910c27278ab7db2a148a0dccc6bf0f5',
        OrbsAddress: '7c2300d32ebf4a6ae9edf95f4f57ab5a07488c2e',
        Ip: '138.103.13.220',
        EffectiveStake: 40000,
        ElectionsStatus: {
          LastUpdateTime: 1592400001,
          ReadyToSync: true,
          ReadyForCommittee: true,
          TimeToStale: 604800,
        },
        Name: 'Validator3',
        Website: 'Validator3-website',
        Contact: 'Validator3-contact',
      },
      cb6642be414696f77336dae06fed3775f08de0ea: {
        EthAddress: 'cb6642be414696f77336dae06fed3775f08de0ea',
        OrbsAddress: '33546759bdcfb5c753a4102b86b3e73e714d5213',
        Ip: '203.102.66.190',
        EffectiveStake: 50000,
        ElectionsStatus: {
          LastUpdateTime: 1592400001,
          ReadyToSync: true,
          ReadyForCommittee: false,
          TimeToStale: 0,
        },
        Name: 'Validator4',
        Website: 'Validator4-website',
        Contact: 'Validator4-contact',
      },
    },
    CurrentVirtualChains: {
      '1000000': {
        Expiration: 1592400011,
        GenesisRefTime: 1592400010,
        IdentityType: 0,
        RolloutGroup: 'main',
        Tier: 'defaultTier',
      },
      '1000001': {
        Expiration: 1592400021,
        GenesisRefTime: 1592400020,
        IdentityType: 0,
        RolloutGroup: 'canary',
        Tier: 'defaultTier',
      },
    },
    ExtraField: 'something',
  },
};

test.serial.afterEach.always(() => {
  nock.cleanAll();
});

test.serial('reads data from valid ManagementStatus', async (t) => {
  const state = new State();
  nock(exampleManagementServiceEndpoint)
    .get(managementStatusPath)
    .reply(200, JSON.stringify(validManagementStatusResponse));
  await readManagementStatus(exampleManagementServiceEndpoint, myOrbsAddress, state);

  t.log('state:', jsonStringifyComplexTypes(state));

  t.assert(getCurrentClockTime() - state.ManagementLastPollTime < 5);
  t.is(state.ManagementRefTime, 1592400033);
  t.is(state.ManagementEthRefBlock, 3454);
  t.deepEqual(state.ManagementEthToOrbsAddress, {
    '29ce860a2247d97160d6dfc087a15f41e2349087': '16fcf728f8dc3f687132f2157d8379c021a08c12',
    e16e965a4cc3fcd597ecdb9cd9ab8f3e6a750ac9: '86544bdd6c8b957cd198252c45fa215fc3892126',
    '51baa09f2f7dfc7a0f65886b68720958d389cac7': '174dc3b45bdbbc32aa0b95e64d0247ce99b08f69',
    '8a670ddc1910c27278ab7db2a148a0dccc6bf0f5': '7c2300d32ebf4a6ae9edf95f4f57ab5a07488c2e',
    cb6642be414696f77336dae06fed3775f08de0ea: '33546759bdcfb5c753a4102b86b3e73e714d5213',
  });
  t.deepEqual(state.ManagementVirtualChains, validManagementStatusResponse.Payload.CurrentVirtualChains);
  t.is(state.ManagementInCommittee, true);
  t.is(state.ManagementIsStandby, false);
  t.deepEqual(state.ManagementMyElectionsStatus, {
    LastUpdateTime: 1592400002,
    ReadyToSync: true,
    ReadyForCommittee: true,
    TimeToStale: 604800,
  });
  t.deepEqual(state.ManagementOthersElectionsStatus, {
    '29ce860a2247d97160d6dfc087a15f41e2349087': {
      LastUpdateTime: 1592400001,
      ReadyToSync: true,
      ReadyForCommittee: true,
      TimeToStale: 5000,
    },
    '51baa09f2f7dfc7a0f65886b68720958d389cac7': {
      LastUpdateTime: 1592400001,
      ReadyToSync: true,
      ReadyForCommittee: false,
      TimeToStale: 86400,
    },
    '8a670ddc1910c27278ab7db2a148a0dccc6bf0f5': {
      LastUpdateTime: 1592400001,
      ReadyToSync: true,
      ReadyForCommittee: true,
      TimeToStale: 604800,
    },
    cb6642be414696f77336dae06fed3775f08de0ea: {
      LastUpdateTime: 1592400001,
      ReadyToSync: true,
      ReadyForCommittee: false,
      TimeToStale: 0,
    },
  });
  t.assert(
    _.isMatch(state.ManagementCurrentCommittee, [
      {
        EthAddress: '8a670ddc1910c27278ab7db2a148a0dccc6bf0f5',
        Weight: 40000,
      },
      {
        EthAddress: 'e16e965a4cc3fcd597ecdb9cd9ab8f3e6a750ac9',
        Weight: 30000,
      },
    ])
  );
  t.assert(
    _.isMatch(state.ManagementCurrentStandbys, [
      {
        EthAddress: 'cb6642be414696f77336dae06fed3775f08de0ea',
      },
      {
        EthAddress: '51baa09f2f7dfc7a0f65886b68720958d389cac7',
      },
      {
        EthAddress: '29ce860a2247d97160d6dfc087a15f41e2349087',
      },
    ])
  );
});

test.serial('my orbsAddress not found in ManagementStatus', async (t) => {
  const state = new State();
  nock(exampleManagementServiceEndpoint)
    .get(managementStatusPath)
    .reply(200, JSON.stringify(validManagementStatusResponse));
  const unknownOrbsAddress = '77777777008b957cd198252c45fa215fc3892126';
  await readManagementStatus(exampleManagementServiceEndpoint, unknownOrbsAddress, state);

  t.log('state:', jsonStringifyComplexTypes(state));

  t.is(state.ManagementInCommittee, false);
  t.is(state.ManagementIsStandby, false);
  t.falsy(state.ManagementMyElectionsStatus);
  t.deepEqual(state.ManagementOthersElectionsStatus, {
    '29ce860a2247d97160d6dfc087a15f41e2349087': {
      LastUpdateTime: 1592400001,
      ReadyToSync: true,
      ReadyForCommittee: true,
      TimeToStale: 5000,
    },
    '51baa09f2f7dfc7a0f65886b68720958d389cac7': {
      LastUpdateTime: 1592400001,
      ReadyToSync: true,
      ReadyForCommittee: false,
      TimeToStale: 86400,
    },
    '8a670ddc1910c27278ab7db2a148a0dccc6bf0f5': {
      LastUpdateTime: 1592400001,
      ReadyToSync: true,
      ReadyForCommittee: true,
      TimeToStale: 604800,
    },
    cb6642be414696f77336dae06fed3775f08de0ea: {
      LastUpdateTime: 1592400001,
      ReadyToSync: true,
      ReadyForCommittee: false,
      TimeToStale: 0,
    },
    e16e965a4cc3fcd597ecdb9cd9ab8f3e6a750ac9: {
      LastUpdateTime: 1592400002,
      ReadyToSync: true,
      ReadyForCommittee: true,
      TimeToStale: 604800,
    },
  });
});

test.serial('my elections status not found in ManagementStatus', async (t) => {
  const state = new State();
  const partialResponse = _.cloneDeep(validManagementStatusResponse);
  delete partialResponse.Payload.Guardians['e16e965a4cc3fcd597ecdb9cd9ab8f3e6a750ac9'].ElectionsStatus;
  nock(exampleManagementServiceEndpoint).get(managementStatusPath).reply(200, JSON.stringify(partialResponse));
  await readManagementStatus(exampleManagementServiceEndpoint, myOrbsAddress, state);

  t.log('state:', jsonStringifyComplexTypes(state));

  t.falsy(state.ManagementMyElectionsStatus);
  t.deepEqual(state.ManagementOthersElectionsStatus, {
    '29ce860a2247d97160d6dfc087a15f41e2349087': {
      LastUpdateTime: 1592400001,
      ReadyToSync: true,
      ReadyForCommittee: true,
      TimeToStale: 5000,
    },
    '51baa09f2f7dfc7a0f65886b68720958d389cac7': {
      LastUpdateTime: 1592400001,
      ReadyToSync: true,
      ReadyForCommittee: false,
      TimeToStale: 86400,
    },
    '8a670ddc1910c27278ab7db2a148a0dccc6bf0f5': {
      LastUpdateTime: 1592400001,
      ReadyToSync: true,
      ReadyForCommittee: true,
      TimeToStale: 604800,
    },
    cb6642be414696f77336dae06fed3775f08de0ea: {
      LastUpdateTime: 1592400001,
      ReadyToSync: true,
      ReadyForCommittee: false,
      TimeToStale: 0,
    },
  });
});

test.serial('no ManagementStatus response from management service', async (t) => {
  const state = new State();
  await t.throwsAsync(async () => {
    await readManagementStatus(exampleManagementServiceEndpoint, myOrbsAddress, state);
  });
});

test.serial('404 ManagementStatus response from management service', async (t) => {
  const state = new State();
  nock(exampleManagementServiceEndpoint).get(managementStatusPath).reply(404);
  await t.throwsAsync(async () => {
    await readManagementStatus(exampleManagementServiceEndpoint, myOrbsAddress, state);
  });
});

test.serial('invalid JSON format ManagementStatus response from management service', async (t) => {
  const state = new State();
  nock(exampleManagementServiceEndpoint)
    .get(managementStatusPath)
    .reply(200, JSON.stringify(validManagementStatusResponse) + '}}}');
  await t.throwsAsync(async () => {
    await readManagementStatus(exampleManagementServiceEndpoint, myOrbsAddress, state);
  });
});

test.serial('partial ManagementStatus response from management service', async (t) => {
  const state = new State();
  const partialResponse = _.cloneDeep(validManagementStatusResponse);
  delete partialResponse.Payload.CurrentVirtualChains['1000001'].GenesisRefTime;
  nock(exampleManagementServiceEndpoint).get(managementStatusPath).reply(200, JSON.stringify(partialResponse));
  await t.throwsAsync(async () => {
    await readManagementStatus(exampleManagementServiceEndpoint, myOrbsAddress, state);
  });
});
