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

test('investigation results module fetches via the shared api client and does not hardcode result data', () => {
  const service = read('src/modules/investigation-results/services.ts');
  assert.match(service, /apiClient\s*\.get<\{ data: InvestigationResult \| null \}>\(`\/bcp\/patients\/\$\{mrn\}\/investigation-results`/);
  assert.doesNotMatch(service, /"CBC"|"LFT"|"Lipid Profile"/);

  const merge = read('src/modules/investigation-results/merge.ts');
  assert.doesNotMatch(merge, /"CBC"|"LFT"|"Lipid Profile"/);
});

