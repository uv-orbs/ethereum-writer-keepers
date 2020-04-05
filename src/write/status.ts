import { State } from '../state';
import { writeFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';

export function writeStatus(filePath: string, state: State) {
  state.LastStatusTime = new Date();
  const status = {
    LastStatusTime: state.LastStatusTime.toISOString(),
  };
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, JSON.stringify(status, null, 2));
}
