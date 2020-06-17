import test from 'ava';
import nock from 'nock';
import { readNodeManagementConfig } from './management';
import { State } from '../model/state';
import _ from 'lodash';

const exampleManagementServiceUrl = 'http://management-service:8080';
const nodeManagementPath = '/node/management';
const validNodeManagementConfig = {
  orchestrator: {},
  chains: [
    {
      Id: 42,
      InternalPort: 4400,
    },
    {
      Id: 43,
      InternalPort: 4401,
    },
  ],
};

const exampleState = new State();

test.serial.afterEach.always(() => {
  nock.cleanAll();
});

test.serial('reads virtual chains from valid NodeManagementConfig', async (t) => {
  const state = _.cloneDeep(exampleState);
  nock(exampleManagementServiceUrl).get(nodeManagementPath).reply(200, JSON.stringify(validNodeManagementConfig));
  await readNodeManagementConfig(exampleManagementServiceUrl + nodeManagementPath, state);
  t.is(state.numVirtualChains, 2);
});

test.serial('no NodeManagementConfig response from management service', async (t) => {
  const state = _.cloneDeep(exampleState);
  await t.throwsAsync(async () => {
    await readNodeManagementConfig(exampleManagementServiceUrl + nodeManagementPath, state);
  });
});

test.serial('404 NodeManagementConfig response from management service', async (t) => {
  const state = _.cloneDeep(exampleState);
  nock(exampleManagementServiceUrl).get(nodeManagementPath).reply(404);
  await t.throwsAsync(async () => {
    await readNodeManagementConfig(exampleManagementServiceUrl + nodeManagementPath, state);
  });
});

test.serial('invalid JSON format NodeManagementConfig response from management service', async (t) => {
  const state = _.cloneDeep(exampleState);
  nock(exampleManagementServiceUrl)
    .get(nodeManagementPath)
    .reply(200, JSON.stringify(validNodeManagementConfig) + '}}}');
  await t.throwsAsync(async () => {
    await readNodeManagementConfig(exampleManagementServiceUrl + nodeManagementPath, state);
  });
});

test.serial('partial NodeManagementConfig response from management service', async (t) => {
  const state = _.cloneDeep(exampleState);
  const partialNodeManagementConfig = _.cloneDeep(validNodeManagementConfig);
  delete partialNodeManagementConfig.chains[0].Id;
  nock(exampleManagementServiceUrl).get(nodeManagementPath).reply(200, JSON.stringify(partialNodeManagementConfig));
  await t.throwsAsync(async () => {
    await readNodeManagementConfig(exampleManagementServiceUrl + nodeManagementPath, state);
  });
});
