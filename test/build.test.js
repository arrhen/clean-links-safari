const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { build, PATCHES } = require('../scripts/build.js');

for (const target of Object.keys(PATCHES)) {
  const dir = build(target);
  const m = JSON.parse(fs.readFileSync(path.join(dir, 'manifest.json'), 'utf8'));
  const refs = new Set([
    ...Object.values(m.icons), ...Object.values(m.action.default_icon), m.action.default_popup,
    ...m.declarative_net_request.rule_resources.map((r) => r.path),
    ...m.content_scripts.flatMap((c) => c.js),
    ...(m.background.scripts || [m.background.service_worker]),
  ]);
  for (const f of refs) assert.ok(fs.existsSync(path.join(dir, f)), `${target}: missing ${f}`);
  // The popup's own script/style refs must exist too.
  const popup = fs.readFileSync(path.join(dir, m.action.default_popup), 'utf8');
  for (const [, f] of popup.matchAll(/(?:src|href)="([^"#:]+\.(?:js|css|png))"/g)) {
    assert.ok(fs.existsSync(path.join(dir, f)), `${target}: popup missing ${f}`);
  }
  assert.ok(m.description.length <= 132, 'Chrome limits description to 132 chars');
}
const ff = JSON.parse(fs.readFileSync('dist/firefox/manifest.json', 'utf8'));
assert.strictEqual(ff.browser_specific_settings.gecko.id, 'clean-links@arrhen.me');
assert.ok(!ff.background.service_worker);
assert.ok(fs.existsSync('dist/clean-links-chrome-1.0.0.zip'));
console.log('build checks passed for', Object.keys(PATCHES).join(', '));
