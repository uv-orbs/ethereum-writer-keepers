export interface Configuration {
  ManagementServiceEndpoint: string;
  EthereumEndpoint: string;
  SignerEndpoint: string;
  EthereumElectionsContract: string;
  NodeOrbsAddress: string;
  VirtualChainEndpointSchema: string;
  StatusJsonPath: string;
  RunLoopPollTimeSeconds: number;
  VchainMetricsPollTimeSeconds: number; // multiple of RunLoopPollTimeSeconds
  VchainReputationsPollTimeSeconds: number; // multiple of RunLoopPollTimeSeconds
  EthereumBalancePollTimeSeconds: number; // multiple of RunLoopPollTimeSeconds
  EthereumPendingTxPollTimeSeconds: number; // multiple of RunLoopPollTimeSeconds
  OrbsReputationsContract: string;
  VchainUptimeRequiredSeconds: number;
  VchainSyncThresholdSeconds: number;
  VchainOutOfSyncThresholdSeconds: number;
  EthereumSyncRequirementSeconds: number;
  FailToSyncVcsTimeoutSeconds: number;
  ElectionsRefreshWindowSeconds: number;
  InvalidReputationGraceSeconds: number;
  VoteOutValiditySeconds: number;
  ElectionsAuditOnly: boolean;
}

export const defaultConfiguration = {
  StatusJsonPath: './status/status.json',
  VirtualChainEndpointSchema: 'http://vchain-{{ID}}:8080',
  RunLoopPollTimeSeconds: 20,
  VchainMetricsPollTimeSeconds: 5 * 60,
  VchainReputationsPollTimeSeconds: 20 * 60,
  OrbsReputationsContract: '_Committee',
  VchainUptimeRequiredSeconds: 5,
  VchainSyncThresholdSeconds: 5 * 60,
  EthereumBalancePollTimeSeconds: 4 * 60 * 60,
  EthereumPendingTxPollTimeSeconds: 2 * 60,
  VchainOutOfSyncThresholdSeconds: 60 * 60,
  EthereumSyncRequirementSeconds: 20 * 60,
  FailToSyncVcsTimeoutSeconds: 24 * 60 * 60,
  ElectionsRefreshWindowSeconds: 2 * 60 * 60,
  InvalidReputationGraceSeconds: 6 * 60 * 60,
  VoteOutValiditySeconds: 7 * 24 * 60 * 60,
  ElectionsAuditOnly: false,
};

export function validateConfiguration(config: Configuration) {
  if (!config.ManagementServiceEndpoint) {
    throw new Error(`ManagementServiceEndpoint is empty in config.`);
  }
  if (!config.EthereumEndpoint) {
    throw new Error(`EthereumEndpoint is empty in config.`);
  }
  if (!config.SignerEndpoint) {
    throw new Error(`SignerEndpoint is empty in config.`);
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
  if (!config.EthereumBalancePollTimeSeconds) {
    throw new Error(`EthereumBalancePollTimeSeconds is empty or zero.`);
  }
  if (typeof config.EthereumBalancePollTimeSeconds != 'number') {
    throw new Error(`EthereumBalancePollTimeSeconds is not a number.`);
  }
  if (!config.EthereumPendingTxPollTimeSeconds) {
    throw new Error(`EthereumPendingTxPollTimeSeconds is empty or zero.`);
  }
  if (typeof config.EthereumPendingTxPollTimeSeconds != 'number') {
    throw new Error(`EthereumPendingTxPollTimeSeconds is not a number.`);
  }
  if (!config.OrbsReputationsContract) {
    throw new Error(`OrbsReputationsContract is empty in config.`);
  }
  if (!config.VchainUptimeRequiredSeconds) {
    throw new Error(`VchainUptimeRequiredSeconds is empty or zero.`);
  }
  if (typeof config.VchainUptimeRequiredSeconds != 'number') {
    throw new Error(`VchainUptimeRequiredSeconds is not a number.`);
  }
  if (!config.VchainSyncThresholdSeconds) {
    throw new Error(`VchainSyncThresholdSeconds is empty or zero.`);
  }
  if (typeof config.VchainSyncThresholdSeconds != 'number') {
    throw new Error(`VchainSyncThresholdSeconds is not a number.`);
  }
  if (!config.VchainOutOfSyncThresholdSeconds) {
    throw new Error(`VchainOutOfSyncThresholdSeconds is empty or zero.`);
  }
  if (typeof config.VchainOutOfSyncThresholdSeconds != 'number') {
    throw new Error(`VchainOutOfSyncThresholdSeconds is not a number.`);
  }
  if (!config.EthereumSyncRequirementSeconds) {
    throw new Error(`EthereumSyncRequirementSeconds is empty or zero.`);
  }
  if (typeof config.EthereumSyncRequirementSeconds != 'number') {
    throw new Error(`EthereumSyncRequirementSeconds is not a number.`);
  }
  if (!config.FailToSyncVcsTimeoutSeconds) {
    throw new Error(`FailToSyncVcsTimeoutSeconds is empty or zero.`);
  }
  if (typeof config.FailToSyncVcsTimeoutSeconds != 'number') {
    throw new Error(`FailToSyncVcsTimeoutSeconds is not a number.`);
  }
  if (!config.ElectionsRefreshWindowSeconds) {
    throw new Error(`ElectionsRefreshWindowSeconds is empty or zero.`);
  }
  if (typeof config.ElectionsRefreshWindowSeconds != 'number') {
    throw new Error(`ElectionsRefreshWindowSeconds is not a number.`);
  }
  if (!config.InvalidReputationGraceSeconds) {
    throw new Error(`InvalidReputationGraceSeconds is empty or zero.`);
  }
  if (typeof config.InvalidReputationGraceSeconds != 'number') {
    throw new Error(`InvalidReputationGraceSeconds is not a number.`);
  }
  if (!config.VoteOutValiditySeconds) {
    throw new Error(`VoteOutValiditySeconds is empty or zero.`);
  }
  if (typeof config.VoteOutValiditySeconds != 'number') {
    throw new Error(`VoteOutValiditySeconds is not a number.`);
  }
  if (typeof config.ElectionsAuditOnly != 'boolean') {
    throw new Error(`ElectionsAuditOnly is not found or not a boolean.`);
  }
}
