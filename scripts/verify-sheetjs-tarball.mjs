import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

const path = new URL('../vendor/xlsx-0.20.3.tgz', import.meta.url);
const expected =
  'sha512-oLDq3jw7AcLqKWH2AhCpVTZl8mf6X2YReP+Neh0SJUzV/BdZYjth94tG5toiMB1PPrYtxOCfaoUCkvtuH+3AJA==';
const actual = `sha512-${createHash('sha512')
  .update(await readFile(path))
  .digest('base64')}`;

if (actual !== expected) {
  console.error(`SheetJS tarball integrity mismatch: expected ${expected}, received ${actual}`);
  process.exitCode = 1;
} else {
  console.warn('SheetJS 0.20.3 tarball integrity verified.');
}
