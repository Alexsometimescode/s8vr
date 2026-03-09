import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';

const ROOT = path.resolve(__dirname, '../..');

const CORRECT_REPO = 'https://github.com/Alexsometimescode/s8vr';

const WRONG_PATTERNS = [
  'github.com/s8vr/s8vr',
  'github.com/Alexsometimescode/s8vr-App',
  'YOUR_USERNAME',
  'your-demo-url.com',
];

// All source files that should reference the repo URL
const SOURCE_FILES = [
  'components/LandingPage.tsx',
  'components/ui/Shared.tsx',
  'components/setup/CompleteStep.tsx',
  'README.md',
  'CHANGELOG.md',
  'MIGRATIONS.md',
  'public/install.sh',
  'public/docker-install.sh',
  'create-s8vr/bin/create-s8vr.js',
  'create-s8vr/package.json',
  '.github/workflows/docker.yml',
];

// URLs that must appear at least once in specific files
const REQUIRED_URLS: Record<string, string[]> = {
  'components/LandingPage.tsx':        [CORRECT_REPO],
  'components/ui/Shared.tsx':          [CORRECT_REPO],
  'components/setup/CompleteStep.tsx': [CORRECT_REPO, `${CORRECT_REPO}/issues`],
  'README.md':                         [`${CORRECT_REPO}.git`],
  'CHANGELOG.md':                      [CORRECT_REPO],
  'public/install.sh':                 [CORRECT_REPO],
  'public/docker-install.sh':          [CORRECT_REPO],
  'create-s8vr/bin/create-s8vr.js':   [CORRECT_REPO],
  'create-s8vr/package.json':          [`${CORRECT_REPO}.git`],
};

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel), 'utf-8');
}

function head(url: string): Promise<number | null> {
  return new Promise((resolve) => {
    const req = https.request(url, { method: 'HEAD', timeout: 8000 }, (res) => {
      resolve(res.statusCode ?? null);
    });
    req.on('error', () => resolve(null));
    req.on('timeout', () => { req.destroy(); resolve(null); });
    req.end();
  });
}

// ─── Static file checks ───────────────────────────────────────────────────────

describe('GitHub URL consistency', () => {
  it('all source files exist', () => {
    for (const file of SOURCE_FILES) {
      const full = path.join(ROOT, file);
      expect(fs.existsSync(full), `Missing: ${file}`).toBe(true);
    }
  });

  for (const file of SOURCE_FILES) {
    it(`no wrong URLs in ${file}`, () => {
      const content = read(file);
      for (const bad of WRONG_PATTERNS) {
        expect(content, `Found "${bad}" in ${file}`).not.toContain(bad);
      }
    });
  }

  for (const [file, urls] of Object.entries(REQUIRED_URLS)) {
    for (const url of urls) {
      it(`${file} contains ${url}`, () => {
        const content = read(file);
        expect(content, `Missing "${url}" in ${file}`).toContain(url);
      });
    }
  }
});

describe('Docker image registry URLs', () => {
  it('docker-install.sh uses correct ghcr.io namespace', () => {
    const content = read('public/docker-install.sh');
    expect(content).toContain('ghcr.io/alexsometimescode/s8vr-frontend');
    expect(content).toContain('ghcr.io/alexsometimescode/s8vr-backend');
    expect(content).not.toContain('ghcr.io/s8vr/');
  });

  it('docker workflow uses correct ghcr.io namespace', () => {
    const content = read('.github/workflows/docker.yml');
    expect(content).toContain('ghcr.io/alexsometimescode/s8vr-frontend');
    expect(content).toContain('ghcr.io/alexsometimescode/s8vr-backend');
    expect(content).not.toContain('ghcr.io/s8vr/');
  });
});

describe('Package metadata', () => {
  it('root package.json has correct version (not 0.0.0)', () => {
    const pkg = JSON.parse(read('package.json'));
    expect(pkg.version).not.toBe('0.0.0');
    expect(pkg.version).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it('create-s8vr package.json has correct repo URL', () => {
    const pkg = JSON.parse(read('create-s8vr/package.json'));
    expect(pkg.repository.url).toContain('Alexsometimescode/s8vr');
  });

  it('CHANGELOG.md exists and mentions v0.1.0', () => {
    const content = read('CHANGELOG.md');
    expect(content).toContain('0.1.0');
  });

  it('MIGRATIONS.md exists and lists all migration files', () => {
    const content = read('MIGRATIONS.md');
    expect(content).toContain('001_initial_schema');
    expect(content).toContain('012_add_email_notifications');
  });
});

// ─── Live HTTP checks ─────────────────────────────────────────────────────────

describe('Live URL reachability', () => {
  // GitHub URLs are excluded — repo is private (unauthenticated HEAD returns 404)
  const URLS_TO_CHECK = [
    { label: 's8vr.app',            url: 'https://s8vr.app' },
    { label: 's8vr install script', url: 'https://s8vr.app/install.sh' },
  ];

  for (const { label, url } of URLS_TO_CHECK) {
    it(`${label} (${url}) returns 2xx or 3xx`, async () => {
      const status = await head(url);
      expect(status, `${label} returned ${status}`).not.toBeNull();
      expect(status!, `${label} returned ${status}`).toBeLessThan(400);
    }, 12000);
  }
});
