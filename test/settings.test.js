const assert = require('assert');
const { normalize, isActive, dynamicRules } = require('../extension/settings.js');

// Defaults: on everywhere.
assert.deepStrictEqual(normalize(undefined), { enabled: true, disabledHosts: [] });
assert.strictEqual(isActive('x.com', {}), true);

// Global pause.
assert.strictEqual(isActive('x.com', { enabled: false }), false);

// Per-site pause covers subdomains but not lookalikes.
const s = { disabledHosts: ['amazon.com'] };
assert.strictEqual(isActive('www.amazon.com', s), false);
assert.strictEqual(isActive('amazon.com', s), false);
assert.strictEqual(isActive('notamazon.com', s), true);
assert.strictEqual(isActive('x.com', s), true);

// Garbage in storage is ignored.
assert.deepStrictEqual(normalize({ enabled: true, disabledHosts: [1, '', null, 'a.com'] }),
  { enabled: true, disabledHosts: ['a.com'] });

// DNR dynamic rules.
assert.deepStrictEqual(dynamicRules({}), []);
const paused = dynamicRules({ enabled: false });
assert.strictEqual(paused.length, 1);
assert.strictEqual(paused[0].action.type, 'allow');
assert.strictEqual(paused[0].condition.requestDomains, undefined);
const site = dynamicRules({ disabledHosts: ['amazon.com', 'x.com'] });
assert.deepStrictEqual(site[0].condition.requestDomains, ['amazon.com', 'x.com']);
assert.ok(site[0].priority > 1, 'allow rule must outrank the static redirect rules');

// background.js wiring against a mock extension API.
const vm = require('vm');
const fs = require('fs');
(async () => {
  let rules = [{ id: 1 }];
  const listeners = {};
  const store = { enabled: false };
  const ext = {
    storage: { local: { get: async () => store }, onChanged: { addListener: (f) => { listeners.changed = f; } } },
    declarativeNetRequest: {
      getDynamicRules: async () => rules,
      updateDynamicRules: async ({ removeRuleIds, addRules }) => {
        rules = rules.filter((r) => !removeRuleIds.includes(r.id)).concat(addRules);
      },
    },
    runtime: { onInstalled: { addListener: (f) => { listeners.installed = f; } }, onStartup: { addListener: () => {} }, onMessage: { addListener: () => {} } },
  };
  vm.runInNewContext(fs.readFileSync(__dirname + '/../extension/background.js', 'utf8'),
    { chrome: ext, __cleanSettings: require('../extension/settings.js'), console });
  await listeners.installed();
  assert.strictEqual(rules.length, 1);
  assert.strictEqual(rules[0].action.type, 'allow');
  store.enabled = true;
  await listeners.changed({ enabled: {} }, 'local');
  await new Promise((r) => setTimeout(r, 10));
  assert.strictEqual(rules.length, 0);
  console.log('settings and background checks passed');
})();
