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

// Fallback for Chrome/Edge, where the manifest's MAIN-world script was not
// observed to run: inject the page-world hooks on request from content.js.
ext.runtime.onMessage.addListener((msg, sender, reply) => {
  if (!msg || msg.type !== 'inject-main' || !sender.tab || !ext.scripting) return;
  ext.scripting.executeScript({
    target: { tabId: sender.tab.id, frameIds: [sender.frameId || 0] },
    world: 'MAIN',
    injectImmediately: true,
    files: ['clean.js', 'inject.js'],
  }).then(() => reply(true), () => reply(false));
  return true;
});
