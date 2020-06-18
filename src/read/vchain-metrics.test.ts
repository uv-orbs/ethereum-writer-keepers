import test from 'ava';
import nock from 'nock';
import { State } from '../model/state';
import { getEndpoint, readAllVchainMetrics } from './vchain-metrics';
import { jsonStringifyComplexTypes, getCurrentClockTime } from '../helpers';

const exampleVchainEndpointSchema = 'http://vchain-{{ID}}:8080';
const vchainMetricsPath = '/metrics';
// prefer json string in these tests since TimeNano is a big number
const validVchainMetricsResponse = `{
  "ExtraField": "something",
  "BlockStorage.BlockHeight": {
    "Name": "BlockStorage.BlockHeight",
    "Value": 4618292
  },
  "BlockStorage.LastCommitted.TimeNano": {
    "Name": "BlockStorage.LastCommitted.TimeNano",
    "Value": 1592414358588627900
  },
  "Runtime.Uptime.Seconds": {
    "Name": "Runtime.Uptime.Seconds",
    "Value": 15
  }
}`;

function getExampleState() {
  const exampleState = new State();
  exampleState.ManagementVirtualChains['1000000'] = {
    Expiration: 1592400011,
    GenesisRefTime: 1592400010,
    IdentityType: 0,
    RolloutGroup: 'main',
    Tier: 'defaultTier',
  };
  exampleState.ManagementVirtualChains['1000001'] = {
    Expiration: 1592400021,
    GenesisRefTime: 1592400020,
    IdentityType: 0,
    RolloutGroup: 'canary',
    Tier: 'defaultTier',
  };
  return exampleState;
}

test.serial.afterEach.always(() => {
  nock.cleanAll();
});

test.serial('reads data from valid VchainMetrics', async (t) => {
  const state = getExampleState();
  for (const vcId of ['1000000', '1000001']) {
    nock(getEndpoint(vcId, exampleVchainEndpointSchema)).get(vchainMetricsPath).reply(200, validVchainMetricsResponse);
  }
  await readAllVchainMetrics(exampleVchainEndpointSchema, state);

  t.log('state:', jsonStringifyComplexTypes(state));

  t.assert(getCurrentClockTime() - state.VchainMetricsLastPollTime < 5);
  for (const vcId of ['1000000', '1000001']) {
    t.deepEqual(state.VchainMetrics[vcId], {
      LastBlockHeight: 4618292,
      LastBlockTime: 1592414358,
      UptimeSeconds: 15,
    });
  }
});

test.serial('no VchainMetrics response from first vchain', async (t) => {
  const state = getExampleState();
  nock(getEndpoint('1000001', exampleVchainEndpointSchema))
    .get(vchainMetricsPath)
    .reply(200, validVchainMetricsResponse);
  await readAllVchainMetrics(exampleVchainEndpointSchema, state);

  t.log('state:', jsonStringifyComplexTypes(state));

  t.assert(getCurrentClockTime() - state.VchainMetricsLastPollTime < 5);
  t.deepEqual(state.VchainMetrics['1000001'], {
    LastBlockHeight: 4618292,
    LastBlockTime: 1592414358,
    UptimeSeconds: 15,
  });
  t.deepEqual(state.VchainMetrics['1000000'], {
    LastBlockHeight: -1,
    LastBlockTime: -1,
    UptimeSeconds: -1,
  });
});

test.serial('404 VchainMetrics response from first vchain', async (t) => {
  const state = getExampleState();
  nock(getEndpoint('1000000', exampleVchainEndpointSchema)).get(vchainMetricsPath).reply(404);
  nock(getEndpoint('1000001', exampleVchainEndpointSchema))
    .get(vchainMetricsPath)
    .reply(200, validVchainMetricsResponse);
  await readAllVchainMetrics(exampleVchainEndpointSchema, state);

  t.log('state:', jsonStringifyComplexTypes(state));

  t.assert(getCurrentClockTime() - state.VchainMetricsLastPollTime < 5);
  t.deepEqual(state.VchainMetrics['1000001'], {
    LastBlockHeight: 4618292,
    LastBlockTime: 1592414358,
    UptimeSeconds: 15,
  });
  t.deepEqual(state.VchainMetrics['1000000'], {
    LastBlockHeight: -1,
    LastBlockTime: -1,
    UptimeSeconds: -1,
  });
});

test.serial('invalid JSON format VchainMetrics response from first vchain', async (t) => {
  const state = getExampleState();
  nock(getEndpoint('1000000', exampleVchainEndpointSchema))
    .get(vchainMetricsPath)
    .reply(200, validVchainMetricsResponse + '}}}');
  nock(getEndpoint('1000001', exampleVchainEndpointSchema))
    .get(vchainMetricsPath)
    .reply(200, validVchainMetricsResponse);
  await readAllVchainMetrics(exampleVchainEndpointSchema, state);

  t.log('state:', jsonStringifyComplexTypes(state));

  t.assert(getCurrentClockTime() - state.VchainMetricsLastPollTime < 5);
  t.deepEqual(state.VchainMetrics['1000001'], {
    LastBlockHeight: 4618292,
    LastBlockTime: 1592414358,
    UptimeSeconds: 15,
  });
  t.deepEqual(state.VchainMetrics['1000000'], {
    LastBlockHeight: -1,
    LastBlockTime: -1,
    UptimeSeconds: -1,
  });
});

const partialVchainMetricsResponse = `{
  "ExtraField": "something",
  "BlockStorage.LastCommitted.TimeNano": {
    "Name": "BlockStorage.LastCommitted.TimeNano",
    "Value": 1592414358588627900
  },
  "Runtime.Uptime.Seconds": {
    "Name": "Runtime.Uptime.Seconds",
    "Value": 15
  }
}`;

test.serial('partial VchainMetrics response from first vchain', async (t) => {
  const state = getExampleState();
  nock(getEndpoint('1000000', exampleVchainEndpointSchema))
    .get(vchainMetricsPath)
    .reply(200, partialVchainMetricsResponse);
  nock(getEndpoint('1000001', exampleVchainEndpointSchema))
    .get(vchainMetricsPath)
    .reply(200, validVchainMetricsResponse);
  await readAllVchainMetrics(exampleVchainEndpointSchema, state);

  t.log('state:', jsonStringifyComplexTypes(state));

  t.assert(getCurrentClockTime() - state.VchainMetricsLastPollTime < 5);
  t.deepEqual(state.VchainMetrics['1000001'], {
    LastBlockHeight: 4618292,
    LastBlockTime: 1592414358,
    UptimeSeconds: 15,
  });
  t.deepEqual(state.VchainMetrics['1000000'], {
    LastBlockHeight: -1,
    LastBlockTime: -1,
    UptimeSeconds: -1,
  });
});
