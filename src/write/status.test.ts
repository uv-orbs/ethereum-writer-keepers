import test from 'ava';
import mockFs from 'mock-fs';
import { writeStatus } from './status';
import { State } from '../state';
import _ from 'lodash';
import { readFileSync } from 'fs';

const exampleState: State = {
  LastStatusTime: new Date('2000-01-01T00:00:00.000Z'),
  NumVirtualChains: 0,
};

test.serial.afterEach.always(() => {
  mockFs.restore();
});

test.serial('updates and writes LastStatusTime', (t) => {
  const state = _.cloneDeep(exampleState);
  mockFs({
    ['./status/status.json']: '',
  });
  writeStatus('./status/status.json', state);
  t.assert(new Date().getTime() - state.LastStatusTime.getTime() < 1000);
  const writtenContents = JSON.parse(readFileSync('./status/status.json').toString());
  t.is(writtenContents.LastStatusTime, state.LastStatusTime.toISOString());
});
