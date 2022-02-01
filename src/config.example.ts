import { Configuration } from './config';

export const exampleConfig: Configuration = {
  ManagementServiceEndpoint: 'http://management-service:8080',
  EthereumEndpoint: 'http://ganache:7545',
  SignerEndpoint: 'http://signer:7777',
  EthereumElectionsContract: '0xf8B352100dE45D2668768290504DC89e85766E02',
  NodeOrbsAddress: '11f4d0a3c12e86b4b5f39b213f7e19d048276dae',
  VirtualChainEndpointSchema: 'http://chain-{{ID}}:8080',
  StatusJsonPath: './status/status.json',
  RunLoopPollTimeSeconds: 1,
  EthereumBalancePollTimeSeconds: 1,
  EthereumCanJoinCommitteePollTimeSeconds: 1,
  OrbsReputationsContract: 'MockCommittee',
  VchainUptimeRequiredSeconds: 2,
  VchainSyncThresholdSeconds: 5 * 60,
  VchainOutOfSyncThresholdSeconds: 60 * 60,
  VchainStuckThresholdSeconds: 2 * 60 * 60,
  EthereumSyncRequirementSeconds: 20 * 60,
  FailToSyncVcsTimeoutSeconds: 24 * 60 * 60,
  ElectionsRefreshWindowSeconds: 2 * 60 * 60,
  InvalidReputationGraceSeconds: 6 * 60 * 60,
  VoteUnreadyValiditySeconds: 7 * 24 * 60 * 60,
  ElectionsAuditOnly: false,
  SuspendVoteUnready: false,
  EthereumDiscountGasPriceFactor: 0.75,
  EthereumDiscountTxTimeoutSeconds: 60 * 60,
  EthereumNonDiscountTxTimeoutSeconds: 10 * 60,
  EthereumMaxGasPrice: 150000000000, // 150 gwei
  EthereumMaxCommittedDailyTx: 4,
  BIUrl: ''
};
