import test from 'ava';
import _ from 'lodash';
import { validateConfiguration, Configuration } from './config';
import { exampleConfig } from './config.example';

test.serial('validateConfiguration works on valid config', (t) => {
  t.notThrows(() => validateConfiguration(exampleConfig));
});

for (const configKeyName in exampleConfig) {
  test.serial(`validateConfiguration fails on missing ${configKeyName}`, (t) => {
    const partialConfig = _.cloneDeep(exampleConfig);
    delete partialConfig[configKeyName as keyof Configuration];
    t.throws(() => validateConfiguration(partialConfig));
  });
}

test.serial('validateConfiguration fails on invalid EthereumElectionsContract', (t) => {
  const invalidConfig = _.cloneDeep(exampleConfig);
  invalidConfig.EthereumElectionsContract = 'hello world';
  t.throws(() => validateConfiguration(invalidConfig));
});

test.serial('validateConfiguration fails on invalid NodeEthereumAddress', (t) => {
  const invalidConfig = _.cloneDeep(exampleConfig);
  invalidConfig.NodeEthereumAddress = 'hello world';
  t.throws(() => validateConfiguration(invalidConfig));
});
