(() => {
  const lib = globalThis.__cleanLinks;
  delete globalThis.__cleanLinks;
  if (!lib) return;
  const { cleanUrl, cleanText } = lib;

  // content.js (extension world) turns cleaning off for paused sites.
  let enabled = true;
  addEventListener('__cleanlinks_state', (e) => { enabled = e.detail !== 'off'; });
  const urlIfOn = (u, base) => (enabled ? cleanUrl(u, base) : u);
  const textIfOn = (t) => (enabled ? cleanText(t) : t);

  // Single-page apps (x.com) re-add params through the History API.
  for (const name of ['pushState', 'replaceState']) {
    const orig = History.prototype[name];
    History.prototype[name] = function (state, title, url) {
      if (url != null) url = urlIfOn(String(url), location.href);
      return orig.call(this, state, title, url);
    };
  }

  // "Copy link" buttons.
  if (globalThis.Clipboard && Clipboard.prototype.writeText) {
    const orig = Clipboard.prototype.writeText;
    Clipboard.prototype.writeText = function (text) {
      return orig.call(this, textIfOn(String(text)));
    };
  }
  if (globalThis.DataTransfer) {
    const orig = DataTransfer.prototype.setData;
    DataTransfer.prototype.setData = function (type, data) {
      if (type === 'text/plain' || type === 'text/uri-list' || type === 'text') {
        data = textIfOn(String(data));
      }
      return orig.call(this, type, data);
    };
  }

  // Sites that copy via a hidden textarea + execCommand('copy').
  document.addEventListener('copy', (e) => {
    const el = document.activeElement;
    const text = el && typeof el.value === 'string' && el.selectionStart != null
      ? el.value.slice(el.selectionStart, el.selectionEnd)
      : String(getSelection());
    if (!/^\s*https?:\/\/\S+\s*$/.test(text)) return;
    const cleaned = textIfOn(text);
    if (cleaned !== text && e.clipboardData) {
      e.clipboardData.setData('text/plain', cleaned);
      e.preventDefault();
    }
  }, true);

  // Native share sheet.
  if (navigator.share) {
    const orig = Navigator.prototype.share;
    Navigator.prototype.share = function (data) {
      if (data) {
        data = Object.assign({}, data);
        if (data.url) data.url = urlIfOn(String(data.url), location.href);
        if (data.text) data.text = textIfOn(String(data.text));
      }
      return orig.call(this, data);
    };
  }
})();
