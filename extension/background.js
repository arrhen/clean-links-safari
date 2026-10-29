if (typeof importScripts === 'function') importScripts('settings.js');

const ext = globalThis.browser || globalThis.chrome;
const KEYS = ['enabled', 'disabledHosts'];

async function applySettings() {
  const settings = await ext.storage.local.get(KEYS);
  const existing = await ext.declarativeNetRequest.getDynamicRules();
  await ext.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: existing.map((r) => r.id),
    addRules: globalThis.__cleanSettings.dynamicRules(settings),
  });
}

ext.runtime.onInstalled.addListener(applySettings);
ext.runtime.onStartup.addListener(applySettings);
ext.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && KEYS.some((k) => k in changes)) applySettings();
});
