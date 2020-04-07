export interface Configuration {
  NodeManagementConfigUrl: string;
  EthereumEndpoint: string;
  EthereumElectionsContract: string;
  NodeEthereumAddress: string;
  VirtualChainUrlSchema: string;
  StatusJsonPath: string;
}

export const defaultConfiguration = {
  StatusJsonPath: './status/status.json',
  VirtualChainUrlSchema: 'http://vchain-{{ID}}:8080',
};

export function validateConfiguration(config: Configuration) {
  if (!config.NodeManagementConfigUrl) {
    throw new Error('NodeManagementConfigUrl is empty in config.');
  }
  if (!config.EthereumEndpoint) {
    throw new Error('EthereumEndpoint is empty in config.');
  }
  if (!config.EthereumElectionsContract) {
    throw new Error('EthereumElectionsContract is empty in config.');
  }
  if (!config.EthereumElectionsContract.startsWith('0x')) {
    throw new Error('EthereumElectionsContract does not start with "0x".');
  }
  if (!config.NodeEthereumAddress) {
    throw new Error('NodeEthereumAddress is empty in config.');
  }
  if (!config.NodeEthereumAddress.startsWith('0x')) {
    throw new Error('NodeEthereumAddress does not start with "0x".');
  }
  if (!config.VirtualChainUrlSchema) {
    throw new Error('VirtualChainUrlSchema is empty in config.');
  }
  if (!config.StatusJsonPath) {
    throw new Error('StatusJsonPath is empty in config.');
  }
}
