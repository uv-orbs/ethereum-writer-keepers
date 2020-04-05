import * as Logger from './logger';
import { sleep } from './helpers';
import { Configuration } from './config';

export async function runLoop(config: Configuration) {
  // temp for ESLINT
  console.log(config.NodeManagementConfigUrl);

  for (;;) {
    await sleep(5000);
    Logger.log('Run loop waking up.');
  }
}
