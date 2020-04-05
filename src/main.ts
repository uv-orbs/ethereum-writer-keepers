import * as Logger from './logger';
import { runLoop } from '.';

process.on('uncaughtException', function (e) {
  Logger.log('Uncaught exception on process, shutting down.');
  Logger.error(e.stack);
  process.exit(1);
});

process.on('SIGINT', function () {
  Logger.log('Received SIGINT, shutting down.');
  process.exit();
});

Logger.log('Ethereum-writer started.');
runLoop().catch((err) => {
  Logger.log('Exception thrown from runLoop, shutting down.');
  Logger.error(err?.message);
  process.exit(128);
});
