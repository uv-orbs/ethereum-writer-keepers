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
    CurrentOrbsAddress: {
      '29ce860a2247d97160d6dfc087a15f41e2349087': '16fcf728f8dc3f687132f2157d8379c021a08c12',
      e16e965a4cc3fcd597ecdb9cd9ab8f3e6a750ac9: '86544bdd6c8b957cd198252c45fa215fc3892126',
    },
    CurrentElectionsStatus: {
      '29ce860a2247d97160d6dfc087a15f41e2349087': {
        LastUpdateTime: 1592400001,
        ReadyToSync: true,
        ReadyForCommittee: false,
      },
      e16e965a4cc3fcd597ecdb9cd9ab8f3e6a750ac9: {
        LastUpdateTime: 1592400002,
        ReadyToSync: true,
        ReadyForCommittee: true,
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

const exampleState = new State();

test.serial.afterEach.always(() => {
  nock.cleanAll();
});

test.serial('reads data from valid ManagementStatus', async (t) => {
  const state = _.cloneDeep(exampleState);
  nock(exampleManagementServiceEndpoint)
    .get(managementStatusPath)
    .reply(200, JSON.stringify(validManagementStatusResponse));
  await readManagementStatus(exampleManagementServiceEndpoint, myOrbsAddress, state);

  t.log('state:', jsonStringifyComplexTypes(state));

  t.assert(getCurrentClockTime() - state.managementLastPollTime < 5);
  t.is(state.managementRefTime, 1592400033);
  t.deepEqual(state.managementEthToOrbsAddress, validManagementStatusResponse.Payload.CurrentOrbsAddress);
  t.deepEqual(state.managementVirtualChains, validManagementStatusResponse.Payload.CurrentVirtualChains);
  t.deepEqual(state.managementMyElectionStatus, {
    LastUpdateTime: 1592400002,
    ReadyToSync: true,
    ReadyForCommittee: true,
  });
});

test.serial('my orbsAddress not found in ManagementStatus', async (t) => {
  const state = _.cloneDeep(exampleState);
  nock(exampleManagementServiceEndpoint)
    .get(managementStatusPath)
    .reply(200, JSON.stringify(validManagementStatusResponse));
  const unknownOrbsAddress = '77777777008b957cd198252c45fa215fc3892126';
  await readManagementStatus(exampleManagementServiceEndpoint, unknownOrbsAddress, state);

  t.log('state:', jsonStringifyComplexTypes(state));

  t.falsy(state.managementMyElectionStatus);
});

test.serial('my elections status not found in ManagementStatus', async (t) => {
  const state = _.cloneDeep(exampleState);
  const partialResponse = _.cloneDeep(validManagementStatusResponse);
  delete partialResponse.Payload.CurrentElectionsStatus['e16e965a4cc3fcd597ecdb9cd9ab8f3e6a750ac9'];
  nock(exampleManagementServiceEndpoint).get(managementStatusPath).reply(200, JSON.stringify(partialResponse));
  await readManagementStatus(exampleManagementServiceEndpoint, myOrbsAddress, state);

  t.log('state:', jsonStringifyComplexTypes(state));

  t.falsy(state.managementMyElectionStatus);
});

test.serial('no ManagementStatus response from management service', async (t) => {
  const state = _.cloneDeep(exampleState);
  await t.throwsAsync(async () => {
    await readManagementStatus(exampleManagementServiceEndpoint, myOrbsAddress, state);
  });
});

test.serial('404 ManagementStatus response from management service', async (t) => {
  const state = _.cloneDeep(exampleState);
  nock(exampleManagementServiceEndpoint).get(managementStatusPath).reply(404);
  await t.throwsAsync(async () => {
    await readManagementStatus(exampleManagementServiceEndpoint, myOrbsAddress, state);
  });
});

test.serial('invalid JSON format ManagementStatus response from management service', async (t) => {
  const state = _.cloneDeep(exampleState);
  nock(exampleManagementServiceEndpoint)
    .get(managementStatusPath)
    .reply(200, JSON.stringify(validManagementStatusResponse) + '}}}');
  await t.throwsAsync(async () => {
    await readManagementStatus(exampleManagementServiceEndpoint, myOrbsAddress, state);
  });
});

test.serial('partial ManagementStatus response from management service', async (t) => {
  const state = _.cloneDeep(exampleState);
  const partialResponse = _.cloneDeep(validManagementStatusResponse);
  delete partialResponse.Payload.CurrentVirtualChains['1000001'].GenesisRefTime;
  nock(exampleManagementServiceEndpoint).get(managementStatusPath).reply(200, JSON.stringify(partialResponse));
  await t.throwsAsync(async () => {
    await readManagementStatus(exampleManagementServiceEndpoint, myOrbsAddress, state);
  });
});
