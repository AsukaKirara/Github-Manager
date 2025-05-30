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

const { processUploadedFiles, getFilesForCommit, flattenFileTree, deriveRepoNameFromUpload } = await import('../dist-test/utils/fileProcessor.js');

test('processUploadedFiles handles single file', async () => {
  const file = new File(['hello'], 'hello.txt', { type: 'text/plain' });
  const result = await processUploadedFiles([file]);
  assert.equal(result.length, 1);
  const entry = result[0];
  assert.equal(entry.path, 'hello.txt');
  assert.equal(entry.type, 'file');
  assert.equal(entry.content, 'hello');
});

test('processUploadedFiles preserves directory structure', async () => {
  const file = new File(['content'], 'file.txt', { type: 'text/plain' });
  Object.defineProperty(file, 'webkitRelativePath', { value: 'dir/sub/file.txt' });
  const result = await processUploadedFiles([file]);
  assert.equal(result.length, 1);
  assert.equal(result[0].path, 'sub');
  assert.equal(result[0].type, 'directory');
  assert.equal(result[0].children[0].path, 'file.txt');
});

test('processUploadedFiles unzips archives', async () => {
  const JSZip = (await import('jszip')).default;
  const zip = new JSZip();
  zip.file('a/b.txt', 'zipcontent');
  const buf = await zip.generateAsync({ type: 'nodebuffer' });
  const zipFile = new File([buf], 'archive.zip', { type: 'application/zip' });
  const result = await processUploadedFiles([zipFile]);
  const entry = result.find(e => e.path === 'b.txt');
  assert.ok(entry);
  assert.equal(entry.content, 'zipcontent');
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

test('flattenFileTree returns entries with full paths', () => {
  const tree = [
    { path: 'src', type: 'directory', children: [
      { path: 'index.js', type: 'file', content: 'x' }
    ] }
  ];
  const flat = flattenFileTree(tree);
  assert.deepEqual(flat.map(f => f.path), ['src/index.js']);
});


test('deriveRepoNameFromUpload detects folder name', () => {
  const f1 = new File(['x'], 'file.txt', { type: 'text/plain' });
  Object.defineProperty(f1, 'webkitRelativePath', { value: 'myfolder/file.txt' });
  const name = deriveRepoNameFromUpload([f1]);
  assert.equal(name, 'myfolder');
});

test('deriveRepoNameFromUpload uses zip name', () => {
  const zip = new File(['z'], 'archive.zip', { type: 'application/zip' });
  const name = deriveRepoNameFromUpload([zip]);
  assert.equal(name, 'archive');
});
