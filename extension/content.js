(() => {
  const { cleanUrl } = globalThis.__cleanLinks;
  const { isActive } = globalThis.__cleanSettings;
  const ext = globalThis.browser || globalThis.chrome;
  const KEYS = ['enabled', 'disabledHosts'];
  let active = true;

  // Tell the page-world hooks (inject.js) whether to run.
  const publish = () => window.dispatchEvent(
    new CustomEvent('__cleanlinks_state', { detail: active ? 'on' : 'off' }));

  // Tidy the address bar (covers params added after load by page scripts).
  const fixLocation = () => {
    if (!active) return;
    const cleaned = cleanUrl(location.href);
    if (cleaned !== location.href) history.replaceState(history.state, '', cleaned);
  };

  const apply = (settings) => {
    active = isActive(location.hostname, settings);
    publish();
    fixLocation();
  };
  const refresh = () => ext.storage.local.get(KEYS).then(apply, () => fixLocation());
  refresh();
  ext.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && KEYS.some((k) => k in changes)) refresh();
  });
  addEventListener('pageshow', () => { publish(); fixLocation(); });

  // Clean links before "Copy Link" / drag / long-press can pick them up.
  const scrub = (e) => {
    if (!active) return;
    const a = e.target instanceof Element ? e.target.closest('a[href]') : null;
    if (!a) return;
    const href = a.getAttribute('href');
    const cleaned = cleanUrl(href, location.href);
    if (cleaned !== href) a.setAttribute('href', cleaned);
  };
  for (const type of ['mouseover', 'focusin', 'contextmenu', 'touchstart']) {
    document.addEventListener(type, scrub, { capture: true, passive: true });
  }
})();
