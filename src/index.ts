import * as Logger from './logger';
import { sleep } from './helpers';
import { Configuration } from './config';
import { State } from './state';
import { writeStatus } from './write/status';

export async function runLoop(config: Configuration) {
  const state: State = {
    LastStatusTime: new Date(),
  };

  for (;;) {
    await sleep(5000);
    Logger.log('Run loop waking up.');

    // do business logic

    writeStatus(config.StatusJsonPath, state);
    continue;
  }
}
