import test from 'ava';
import _ from 'lodash';
import { validateConfiguration } from './config';

export const validConfig = {
  NodeManagementConfigUrl: 'http://management-server:8080/node/management',
  EthereumEndpoint: 'http://ganache:7545',
  EthereumElectionsContract: '0xf8B352100dE45D2668768290504DC89e85766E02',
  NodeEthereumAddress: '0x11f4d0A3c12e86B4b5F39B213F7E19D048276DAe',
  StatusJsonPath: './status/status.json',
};

test.serial('validateConfiguration works on valid config', (t) => {
  t.notThrows(() => validateConfiguration(validConfig));
});

test.serial('validateConfiguration fails on missing NodeManagementConfigUrl', (t) => {
  const partialConfig = _.cloneDeep(validConfig);
  delete partialConfig.NodeManagementConfigUrl;
  t.throws(() => validateConfiguration(partialConfig));
});

test.serial('validateConfiguration fails on missing EthereumEndpoint', (t) => {
  const partialConfig = _.cloneDeep(validConfig);
  delete partialConfig.EthereumEndpoint;
  t.throws(() => validateConfiguration(partialConfig));
});

test.serial('validateConfiguration fails on missing EthereumElectionsContract', (t) => {
  const partialConfig = _.cloneDeep(validConfig);
  delete partialConfig.EthereumElectionsContract;
  t.throws(() => validateConfiguration(partialConfig));
});

test.serial('validateConfiguration fails on invalid EthereumElectionsContract', (t) => {
  const invalidConfig = _.cloneDeep(validConfig);
  invalidConfig.EthereumElectionsContract = 'hello world';
  t.throws(() => validateConfiguration(invalidConfig));
});

test.serial('validateConfiguration fails on missing NodeEthereumAddress', (t) => {
  const partialConfig = _.cloneDeep(validConfig);
  delete partialConfig.NodeEthereumAddress;
  t.throws(() => validateConfiguration(partialConfig));
});

test.serial('validateConfiguration fails on invalid NodeEthereumAddress', (t) => {
  const invalidConfig = _.cloneDeep(validConfig);
  invalidConfig.NodeEthereumAddress = 'hello world';
  t.throws(() => validateConfiguration(invalidConfig));
});
