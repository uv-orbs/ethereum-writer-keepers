import _ from 'lodash';
import { mkdirSync } from 'fs';
import { dirname } from 'path';

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

export function jsonStringifyBigint(obj: unknown): string {
  return JSON.stringify(
    obj,
    (_key, value) => (typeof value === 'bigint' ? value.toString() : value), // return everything else unchanged
    2
  );
}
