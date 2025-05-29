import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';

const outputDir = path.join('dist-test', 'utils');
const outputFile = path.join(outputDir, 'github.js');
if (!fs.existsSync(outputFile)) {
  const source = fs.readFileSync('src/utils/github.ts', 'utf8');
  const result = ts.transpileModule(source, {
    compilerOptions: {
      target: 'ES2022',
      module: 'ES2022',
      lib: ['ES2022', 'DOM'],
    },
  });
  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(outputFile, result.outputText);
}

const { fetchUserOrganizations, deleteRepository, transferRepository } = await import('../dist-test/utils/github.js');

test('fetchUserOrganizations sends auth header and returns data', async () => {
  let calledUrl, calledInit;
  global.fetch = async (url, init) => {
    calledUrl = url; calledInit = init;
    return { ok: true, json: async () => ([{ login: 'my-org' }]) };
  };
  const result = await fetchUserOrganizations('abc');
  assert.equal(calledUrl, 'https://api.github.com/user/orgs');
  assert.equal(calledInit.headers.Authorization, 'token abc');
  assert.deepEqual(result, [{ login: 'my-org' }]);
});

test('deleteRepository calls DELETE and resolves true', async () => {
  let method;
  global.fetch = async (url, init) => {
    method = init.method;
    return { ok: true, json: async () => ({}) };
  };
  const account = { username: 'user', token: 'tok' };
  const res = await deleteRepository(account, 'repo');
  assert.equal(method, 'DELETE');
  assert.ok(res);
});

test('deleteRepository throws on failure', async () => {
  global.fetch = async () => ({ ok: false, json: async () => ({ message: 'nope' }) });
  const account = { username: 'u', token: 't' };
  await assert.rejects(() => deleteRepository(account, 'r'), /nope/);
});

test('transferRepository posts body with new_owner', async () => {
  let calledUrl, body;
  global.fetch = async (url, init) => {
    calledUrl = url; body = init.body;
    return { ok: true, json: async () => ({ done: true }) };
  };
  const account = { username: 'u', token: 't' };
  const res = await transferRepository(account, 'repo', 'neworg');
  assert.equal(calledUrl, `https://api.github.com/repos/${account.username}/repo/transfer`);
  assert.equal(JSON.parse(body).new_owner, 'neworg');
  assert.deepEqual(res, { done: true });
});

test('transferRepository throws on error', async () => {
  global.fetch = async () => ({ ok: false, json: async () => ({ message: 'bad' }) });
  const account = { username: 'u', token: 't' };
  await assert.rejects(() => transferRepository(account, 'repo', 'org'), /bad/);
});

