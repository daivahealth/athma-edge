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

test('login audit records who logged in, not an empty username', () => {
  const source = read('src/common/interceptors/audit.interceptor.ts');
  // The login route is @Public(), so request.user is undefined while it runs.
  // The username has to come from the response or the submitted body.
  assert.match(source, /tap\(\(response\)/);
  assert.match(source, /LOGIN_SUCCESS' \? response\?\.data\?\.user/);
  assert.match(source, /request\.body\?\.username/);
});

test('runtime image ships tsconfig.json so the documented seed command works', () => {
  const dockerfile = read('Dockerfile');
  // `npx prisma db seed` runs ts-node against prisma/seed.ts. Without
  // tsconfig.json present ts-node takes Node's ESM path and dies with
  // ERR_UNKNOWN_FILE_EXTENSION.
  assert.match(dockerfile, /COPY --from=builder \/app\/tsconfig\.json/);
});

