// Builds per-browser packages from extension/ into dist/.
//   node scripts/build.js            # all targets
//   node scripts/build.js safari     # one target
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'extension');
const DIST = path.join(ROOT, 'dist');
const FIREFOX_ID = 'clean-links@arrhen.me';

// Chrome and Edge: service-worker background, plus the scripting permission
// used to inject the page-world hooks (see background.js).
const withScripting = (m) => Object.assign(m, { permissions: [...m.permissions, 'scripting'] });
const PATCHES = {
  chrome: withScripting,
  edge: withScripting,
  firefox: (m) => Object.assign(m, {
    background: { scripts: ['settings.js', 'background.js'] },
    browser_specific_settings: {
      gecko: {
        id: FIREFOX_ID,
        strict_min_version: '140.0',
        data_collection_permissions: { required: ['none'] },
      },
      gecko_android: { strict_min_version: '142.0' },
    },
  }),
  safari: (m) => Object.assign(m, {
    background: { scripts: ['settings.js', 'background.js'], persistent: false },
  }),
};
const ZIPPED = ['chrome', 'edge', 'firefox'];

// Keep dist/ tidy: zips from other versions move to dist/archive/.
function archiveOldZips(version) {
  if (!fs.existsSync(DIST)) return;
  const archive = path.join(DIST, 'archive');
  for (const f of fs.readdirSync(DIST)) {
    if (/^clean-links-.*\.zip$/.test(f) && !f.endsWith(`-${version}.zip`)) {
      fs.mkdirSync(archive, { recursive: true });
      fs.renameSync(path.join(DIST, f), path.join(archive, f));
    }
  }
}

function build(target) {
  const out = path.join(DIST, target);
  fs.rmSync(out, { recursive: true, force: true });
  fs.cpSync(SRC, out, { recursive: true });
  const file = path.join(out, 'manifest.json');
  const manifest = PATCHES[target](JSON.parse(fs.readFileSync(file, 'utf8')));
  fs.writeFileSync(file, JSON.stringify(manifest, null, 2) + '\n');
  if (ZIPPED.includes(target)) {
    const zip = path.join(DIST, `clean-links-${target}-${manifest.version}.zip`);
    fs.rmSync(zip, { force: true });
    execFileSync('zip', ['-qr', '-X', zip, '.', '-x', '*.DS_Store'], { cwd: out });
  }
  return out;
}

if (require.main === module) {
  execFileSync(process.execPath, [path.join(__dirname, 'build-rules.js')], { stdio: 'inherit' });
  const wanted = process.argv.slice(2);
  const targets = wanted.length ? wanted : Object.keys(PATCHES);
  archiveOldZips(JSON.parse(fs.readFileSync(path.join(SRC, 'manifest.json'), 'utf8')).version);
  for (const t of targets) {
    if (!PATCHES[t]) throw new Error(`Unknown target: ${t}`);
    console.log('built', path.relative(ROOT, build(t)));
  }
}
module.exports = { build, PATCHES };
