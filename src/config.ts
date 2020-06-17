export interface Configuration {
  ManagementServiceEndpoint: string;
  EthereumEndpoint: string;
  EthereumElectionsContract: string;
  NodeOrbsAddress: string;
  VirtualChainUrlSchema: string;
  StatusJsonPath: string;
  RunLoopPollTimeSeconds: number;
}

export const defaultConfiguration = {
  StatusJsonPath: './status/status.json',
  VirtualChainUrlSchema: 'http://vchain-{{ID}}:8080',
  RunLoopPollTimeSeconds: 10,
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
  if (!config.VirtualChainUrlSchema) {
    throw new Error(`VirtualChainUrlSchema is empty in config.`);
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
}
