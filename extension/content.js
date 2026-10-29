(() => {
  const { cleanUrl } = globalThis.__cleanLinks;

  // Tidy the address bar (covers params added after load by page scripts).
  const fixLocation = () => {
    const cleaned = cleanUrl(location.href);
    if (cleaned !== location.href) history.replaceState(history.state, '', cleaned);
  };
  fixLocation();
  addEventListener('pageshow', fixLocation);

  // Clean links before "Copy Link" / drag / long-press can pick them up.
  const scrub = (e) => {
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
