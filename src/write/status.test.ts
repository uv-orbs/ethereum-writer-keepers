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
  mockFs({ ['./status/status.json']: '' });
  writeStatus('./status/status.json', state);

  const writtenContents = JSON.parse(readFileSync('./status/status.json').toString());
  t.log('result:', JSON.stringify(writtenContents, null, 2));

  t.assert(new Date().getTime() - new Date(writtenContents.Timestamp).getTime() < 1000);
});

test.serial('eth balance appears in status and error when too low', (t) => {
  const state = _.cloneDeep(exampleState);
  state.etherBalance = '123';
  mockFs({ ['./status/status.json']: '' });
  writeStatus('./status/status.json', state);

  const writtenContents = JSON.parse(readFileSync('./status/status.json').toString());
  t.log('result:', JSON.stringify(writtenContents, null, 2));
  
  t.assert(writtenContents.Status.includes(state.etherBalance));
  t.assert(writtenContents.Error.includes(state.etherBalance));
});
