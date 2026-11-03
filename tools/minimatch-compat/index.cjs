// Older ESLint plugins call require('minimatch') directly. Keep that entry point
// while using only the patched matching engine, including its preprocessing.
// CommonJS is required by ESLint 9 and its legacy plugins.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const modern = require('minimatch');
module.exports = Object.assign(modern.minimatch, modern, {
  // eslint-plugin-import uses makeRe only through .test(). Keep that narrow
  // contract on the patched engine; no vulnerable regex compiler is retained.
  makeRe: (pattern, options) => ({ test: (value) => modern.minimatch(value, pattern, options) }),
});
