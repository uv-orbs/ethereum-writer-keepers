export interface Configuration {
  NodeManagementConfigUrl: string;
}

export function validateConfiguration(config: Configuration) {
  if (!config.NodeManagementConfigUrl) {
    throw new Error('NodeManagementConfigUrl is empty in config');
  }
}
