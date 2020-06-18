export interface Configuration {
  ManagementServiceEndpoint: string;
  EthereumEndpoint: string;
  EthereumElectionsContract: string;
  NodeOrbsAddress: string;
  VirtualChainEndpointSchema: string;
  StatusJsonPath: string;
  RunLoopPollTimeSeconds: number;
  VchainMetricsPollTimeSeconds: number; // multiple of RunLoopPollTimeSeconds
  VchainReputationsPollTimeSeconds: number; // multiple of RunLoopPollTimeSeconds
}

export const defaultConfiguration = {
  StatusJsonPath: './status/status.json',
  VirtualChainEndpointSchema: 'http://vchain-{{ID}}:8080',
  RunLoopPollTimeSeconds: 10,
  VchainMetricsPollTimeSeconds: 5 * 60,
  VchainReputationsPollTimeSeconds: 20 * 60,
};

export function validateConfiguration(config: Configuration) {
  if (!config.ManagementServiceEndpoint) {
    throw new Error(`ManagementServiceEndpoint is empty in config.`);
  }
  if (!config.EthereumEndpoint) {
    throw new Error(`EthereumEndpoint is empty in config.`);
  }
  if (!config.EthereumElectionsContract) {
    throw new Error(`EthereumElectionsContract is empty in config.`);
  }
  if (!config.EthereumElectionsContract.startsWith('0x')) {
    throw new Error(`EthereumElectionsContract does not start with "0x".`);
  }
  if (!config.NodeOrbsAddress) {
    throw new Error(`NodeOrbsAddress is empty in config.`);
  }
  if (config.NodeOrbsAddress.startsWith('0x')) {
    throw new Error(`NodeOrbsAddress must not start with "0x".`);
  }
  if (config.NodeOrbsAddress.length != '11f4d0a3c12e86b4b5f39b213f7e19d048276dae'.length) {
    throw new Error(`NodeOrbsAddress has incorrect length: ${config.NodeOrbsAddress.length}.`);
  }
  if (!config.VirtualChainEndpointSchema) {
    throw new Error(`VirtualChainEndpointSchema is empty in config.`);
  }
  if (!config.StatusJsonPath) {
    throw new Error(`StatusJsonPath is empty in config.`);
  }
  if (!config.RunLoopPollTimeSeconds) {
    throw new Error(`RunLoopPollTimeSeconds is empty or zero.`);
  }
  if (typeof config.RunLoopPollTimeSeconds != 'number') {
    throw new Error(`RunLoopPollTimeSeconds is not a number.`);
  }
  if (!config.VchainMetricsPollTimeSeconds) {
    throw new Error(`VchainMetricsPollTimeSeconds is empty or zero.`);
  }
  if (typeof config.VchainMetricsPollTimeSeconds != 'number') {
    throw new Error(`VchainMetricsPollTimeSeconds is not a number.`);
  }
  if (!config.VchainReputationsPollTimeSeconds) {
    throw new Error(`VchainReputationsPollTimeSeconds is empty or zero.`);
  }
  if (typeof config.VchainReputationsPollTimeSeconds != 'number') {
    throw new Error(`VchainReputationsPollTimeSeconds is not a number.`);
  }
}
