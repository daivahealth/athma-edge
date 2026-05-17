const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

test('auth controller uses secure cookie session and does not trust x-tenant-id', () => {
  const source = read('src/modules/auth/auth.controller.ts');
  assert.match(source, /res\.cookie\('bcp_session'/);
  assert.doesNotMatch(source, /x-tenant-id/);
});

test('audit controller no longer exposes manual POST creation', () => {
  const source = read('src/modules/audit/audit.controller.ts');
  assert.doesNotMatch(source, /@Post\(/);
});

test('document downloads enforce storage-root validation', () => {
  const source = read('src/modules/document/document.service.ts');
  assert.match(source, /relative\(resolvedRoot, resolvedCandidate\)/);
  assert.match(source, /Invalid document path/);
});

test('bootstrap enables rate limiting and secure middleware', () => {
  const source = read('src/main.ts');
  assert.match(source, /rateLimit\(/);
  assert.match(source, /helmet\(/);
  assert.match(source, /cookieParser\(/);
});
