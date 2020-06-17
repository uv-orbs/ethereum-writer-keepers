import { Configuration } from './config';

export const exampleConfig: Configuration = {
  ManagementServiceEndpoint: 'http://management-server:8080',
  EthereumEndpoint: 'http://ganache:7545',
  EthereumElectionsContract: '0xf8B352100dE45D2668768290504DC89e85766E02',
  NodeOrbsAddress: '11f4d0a3c12e86b4b5f39b213f7e19d048276dae',
  VirtualChainEndpointSchema: 'http://vchain-{{ID}}:8080',
  StatusJsonPath: './status/status.json',
  RunLoopPollTimeSeconds: 1,
  VchainMetricsPollTimeSeconds: 1,
};
