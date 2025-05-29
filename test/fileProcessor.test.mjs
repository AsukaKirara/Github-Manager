import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const outputDir = path.join('dist-test','utils');
const outputFile = path.join(outputDir,'fileProcessor.js');
if (!existsSync(outputFile)) {
  execFileSync('npx', [
    'tsc', 'src/utils/fileProcessor.ts',
    '--target','ES2022',
    '--module','ES2022',
    '--lib','ES2022,DOM',
    '--outDir','dist-test',
    '--skipLibCheck','true',
    '--esModuleInterop',
    '--moduleResolution','node'
  ], { stdio: 'inherit' });
}

const { processUploadedFiles, getFilesForCommit } = await import('../dist-test/utils/fileProcessor.js');

test('processUploadedFiles handles single file', async () => {
  const file = new File(['hello'], 'hello.txt', { type: 'text/plain' });
  const result = await processUploadedFiles([file]);
  assert.equal(result.length, 1);
  const entry = result[0];
  assert.equal(entry.path, 'hello.txt');
  assert.equal(entry.type, 'file');
  assert.equal(entry.content, 'hello');
});

test('getFilesForCommit filters by ignore patterns', () => {
  const tree = [
    { path: 'file1.txt', type: 'file' },
    { path: 'node_modules', type: 'directory', children: [
      { path: 'module.js', type: 'file' }
    ] }
  ];
  const files = getFilesForCommit(tree, ['node_modules/*']);
  assert.deepEqual(files, ['file1.txt']);
});
