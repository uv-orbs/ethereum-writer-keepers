import test from 'ava';
import mockFs from 'mock-fs';
import { writeStatusToDisk } from './status';
import { State } from '../model/state';
import { readFileSync } from 'fs';

test.serial.afterEach.always(() => {
  mockFs.restore();
});

test.serial('updates and writes Timestamp', (t) => {
  const state = new State();
  mockFs({ ['./status/status.json']: '' });
  writeStatusToDisk('./status/status.json', state);

  const writtenContents = JSON.parse(readFileSync('./status/status.json').toString());
  t.log('result:', JSON.stringify(writtenContents, null, 2));

  t.assert(new Date().getTime() - new Date(writtenContents.Timestamp).getTime() < 1000);
});

test.serial('eth balance appears in status and error when too low', (t) => {
  const state = new State();
  state.EtherBalance = '123';
  mockFs({ ['./status/status.json']: '' });
  writeStatusToDisk('./status/status.json', state);

  const writtenContents = JSON.parse(readFileSync('./status/status.json').toString());
  t.log('result:', JSON.stringify(writtenContents, null, 2));

  t.assert(writtenContents.Status.includes(state.EtherBalance));
  t.assert(writtenContents.Error.includes(state.EtherBalance));
});
