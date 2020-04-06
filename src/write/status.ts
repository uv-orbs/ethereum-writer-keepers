import { State } from '../state';
import { writeFileSync } from 'fs';
import { ensureFileDirectoryExists } from '../helpers';

export function writeStatus(filePath: string, state: State) {
  state.LastStatusTime = new Date();

  const status = {
    LastStatusTime: state.LastStatusTime.toISOString(),
    NumVirtualChains: state.NumVirtualChains,
  };

  ensureFileDirectoryExists(filePath);
  writeFileSync(filePath, JSON.stringify(status, null, 2));
}
