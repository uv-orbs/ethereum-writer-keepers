import { State } from '../state';
import { writeFileSync } from 'fs';
import { ensureFileDirectoryExists } from '../helpers';

export function writeStatus(filePath: string, state: State) {
  state.lastStatusTime = new Date();

  const status = {
    LastStatusTime: state.lastStatusTime.toISOString(),
    NumVirtualChains: state.numVirtualChains,
    EtherBalance: state.etherBalance,
  };

  ensureFileDirectoryExists(filePath);
  writeFileSync(filePath, JSON.stringify(status, null, 2));
}
