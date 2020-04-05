export const defaultConfiguration = {
  StatusJsonPath: './status/status.json',
};

export interface Configuration {
  NodeManagementConfigUrl: string;
  StatusJsonPath: string;
}

export function validateConfiguration(config: Configuration) {
  if (!config.NodeManagementConfigUrl) {
    throw new Error('NodeManagementConfigUrl is empty in config');
  }
}
