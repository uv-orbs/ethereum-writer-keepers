import test from 'ava';
import mockFs from 'mock-fs';
import { writeStatus } from './status';
import { State } from '../model/state';
import _ from 'lodash';
import { readFileSync } from 'fs';

const exampleState = new State();

test.serial.afterEach.always(() => {
  mockFs.restore();
});

test.serial('updates and writes Timestamp', (t) => {
  const state = _.cloneDeep(exampleState);
  mockFs({
    ['./status/status.json']: '',
  });
  writeStatus('./status/status.json', state);
  const writtenContents = JSON.parse(readFileSync('./status/status.json').toString());
  t.assert(new Date().getTime() - new Date(writtenContents.Timestamp).getTime() < 1000);
});
