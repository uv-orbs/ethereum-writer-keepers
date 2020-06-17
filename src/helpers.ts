import _ from 'lodash';
import { mkdirSync } from 'fs';
import { dirname } from 'path';
import { State } from './model/state';

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function ensureFileDirectoryExists(filePath: string) {
  mkdirSync(dirname(filePath), { recursive: true });
}

// returns UTC clock time in seconds (similar to unix timestamp / Ethereum block time / RefTime)
export function getCurrentClockTime() {
  return Math.round(new Date().getTime() / 1000);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type JsonResponse = any;

export function jsonStringifyState(state: State): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const stateCopy = _.cloneDeep(state) as any;
  stateCopy.orbsCounter = stateCopy.orbsCounter.toString();
  return JSON.stringify(stateCopy, null, 2);
}
