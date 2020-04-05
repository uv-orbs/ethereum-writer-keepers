import { mkdirSync } from 'fs';
import { dirname } from 'path';

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function ensureFilePathExists(filePath: string) {
  mkdirSync(dirname(filePath), { recursive: true });
}
