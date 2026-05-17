const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

test('frontend API client uses credentialed requests without localStorage token injection', () => {
  const source = read('src/lib/api/client.ts');
  assert.match(source, /withCredentials:\s*true/);
  assert.doesNotMatch(source, /localStorage\.getItem\('bcp_token'\)/);
  assert.doesNotMatch(source, /Authorization = `Bearer/);
});

test('auth store hydrates from /auth/me rather than decoding a browser token', () => {
  const source = read('src/lib/stores/auth-store.ts');
  assert.match(source, /apiClient\.get<\{ data: AuthUser \}>\('\/auth\/me'\)/);
  assert.doesNotMatch(source, /atob\(/);
  assert.doesNotMatch(source, /localStorage/);
});
