import * as Logger from '../logger';
import { State } from '../state';
import { writeFileSync } from 'fs';
import { ensureFileDirectoryExists } from '../helpers';

export function writeStatus(filePath: string, state: State) {
  state.lastStatusTime = new Date();

  const status = {
    LastStatusTime: state.lastStatusTime.toISOString(),
    NumVirtualChains: state.numVirtualChains,
    EtherBalance: state.etherBalance,
    OrbsCounter: state.orbsCounter.toString(),
  };

  ensureFileDirectoryExists(filePath);
  const content = JSON.stringify(status, null, 2);
  writeFileSync(filePath, content);
  Logger.log(`Wrote status JSON to ${filePath} (${content.length} bytes).`);
}
