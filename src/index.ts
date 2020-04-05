import * as Logger from './logger';
import { sleep } from './helpers';

export async function runLoop() {
  for (;;) {
    await sleep(5000);
    Logger.log('Run loop waking up.');
  }
}
