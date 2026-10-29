const ext = globalThis.browser || globalThis.chrome;
const { normalize, hostMatches } = globalThis.__cleanSettings;
const KEYS = ['enabled', 'disabledHosts'];
const $ = (id) => document.getElementById(id);
let host = null;

async function currentHost() {
  try {
    const [tab] = await ext.tabs.query({ active: true, currentWindow: true });
    const url = new URL(tab.url);
    if (url.protocol === 'http:' || url.protocol === 'https:') return url.hostname.replace(/^www\./, '');
  } catch (e) { /* no access to this tab */ }
  return null;
}

async function render() {
  const s = normalize(await ext.storage.local.get(KEYS));
  $('enabled').checked = s.enabled;
  $('status').textContent = s.enabled ? 'Cleaning is on' : 'Cleaning is paused';
  $('site').hidden = !host;
  if (host) {
    $('host').textContent = host;
    $('siteOn').checked = !s.disabledHosts.some((d) => hostMatches(host, d));
    $('siteOn').disabled = !s.enabled;
  }
}

async function save(patch) {
  await ext.storage.local.set(patch);
  $('hint').hidden = false;
  render();
}

$('enabled').addEventListener('change', (e) => save({ enabled: e.target.checked }));
$('siteOn').addEventListener('change', async (e) => {
  const s = normalize(await ext.storage.local.get(KEYS));
  const rest = s.disabledHosts.filter((d) => !hostMatches(host, d));
  save({ disabledHosts: e.target.checked ? rest : rest.concat(host) });
});

currentHost().then((h) => { host = h; render(); });
