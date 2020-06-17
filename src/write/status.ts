import * as Logger from '../logger';
import { State } from '../model/state';
import { writeFileSync } from 'fs';
import { ensureFileDirectoryExists } from '../helpers';

// runs every 10 seconds in prod, 1 second in tests
export function writeStatus(filePath: string, state: State) {

  const status = {
    Timestamp: new Date().toISOString(),
    Payload: {
      NumVirtualChains: state.numVirtualChains,
      EtherBalance: state.etherBalance,
      OrbsCounter: state.orbsCounter.toString(),
    },
  };

  ensureFileDirectoryExists(filePath);
  const content = JSON.stringify(status, null, 2);
  writeFileSync(filePath, content);
  Logger.log(`Wrote status JSON to ${filePath} (${content.length} bytes).`);
}
