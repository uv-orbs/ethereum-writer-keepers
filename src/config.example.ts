import { Configuration } from './config';

export const exampleConfig: Configuration = {
  NodeManagementConfigUrl: 'http://management-server:8080/node/management',
  EthereumEndpoint: 'http://ganache:7545',
  EthereumElectionsContract: '0xf8B352100dE45D2668768290504DC89e85766E02',
  NodeEthereumAddress: '0x11f4d0A3c12e86B4b5F39B213F7E19D048276DAe',
  VirtualChainUrlSchema: 'http://vchain-{{ID}}:8080',
  StatusJsonPath: './status/status.json',
  RunLoopPollTimeSeconds: 1,
};
