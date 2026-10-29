(function (root) {
  const GLOBAL = [
    'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'utm_id',
    'utm_name', 'utm_brand', 'utm_social', 'utm_social-type', 'utm_creative_format',
    'utm_marketing_tactic', 'fbclid', 'gclid', 'gclsrc', 'dclid', 'gbraid', 'wbraid',
    'msclkid', 'yclid', 'twclid', 'mc_cid', 'mc_eid', 'igshid', '_hsenc', '_hsmi',
    'mkt_tok', 'oly_enc_id', 'oly_anon_id', 'vero_id', 'ref_src', 'ref_url',
  ];

  const AMAZON_TLDS = ['com', 'co.uk', 'de', 'fr', 'it', 'es', 'ca', 'com.au', 'co.jp',
    'in', 'nl', 'com.br', 'com.mx', 'se', 'pl', 'sg', 'ae', 'sa', 'com.tr', 'eg', 'cn'];

  const SITES = [
    { name: 'x', domains: ['x.com', 'twitter.com'],
      params: ['s', 't', 'a', 'src', 'cn', 'refsrc', 'ref_src', 'ref_url'] },
    { name: 'amazon', domains: AMAZON_TLDS.map((t) => 'amazon.' + t),
      params: ['tag', 'ref', 'ref_', 'pd_rd_r', 'pd_rd_w', 'pd_rd_wg', 'pd_rd_i',
        'pf_rd_p', 'pf_rd_r', 'pf_rd_s', 'pf_rd_t', 'pf_rd_i', 'pf_rd_m', 'qid', 'sr',
        'crid', 'sprefix', 'linkCode', 'linkId', 'content-id', 'dib', 'dib_tag',
        'social_share', 'creative', 'creativeASIN', 'camp', 'ascsubtag'],
      pathStrip: true },
    { name: 'youtube', domains: ['youtube.com', 'youtu.be'], params: ['si', 'pp', 'feature'] },
    { name: 'instagram', domains: ['instagram.com'], params: ['igsh', 'igshid'] },
    { name: 'facebook', domains: ['facebook.com', 'fb.com'],
      params: ['mibextid', 'rdid', 'share_url', 'refsrc', '__tn__', '__cft__[0]', 'fref'] },
    { name: 'reddit', domains: ['reddit.com'],
      params: ['share_id', 'ref', 'ref_source', 'rdt'] },
    { name: 'linkedin', domains: ['linkedin.com'],
      params: ['trk', 'trackingId', 'originalSubdomain', 'rcm', 'lipi', 'midToken',
        'midSig', 'eid', 'otpToken', 'trkEmail', 'refId'] },
    { name: 'tiktok', domains: ['tiktok.com'],
      params: ['_t', '_r', 'is_from_webapp', 'sender_device', 'sender_web_id',
        'is_copy_url', 'share_app_id', 'share_link_id', 'u_code'] },
    { name: 'google', domains: ['google.com'],
      params: ['ved', 'ei', 'sxsrf', 'sca_esv', 'uact', 'gs_lcrp', 'gs_lp', 'sclient',
        'oq', 'bih', 'biw', 'dpr', 'iflsig'] },
  ];

  const PATH_STRIP = /\/ref=[^/?#]*/;

  function matchSites(host) {
    return SITES.filter((s) => s.domains.some((d) => host === d || host.endsWith('.' + d)));
  }

  function isTracking(key, sites) {
    if (key.startsWith('utm_') || GLOBAL.includes(key)) return true;
    return sites.some((s) => s.params.includes(key));
  }

  // Returns `input` untouched when nothing needs removing, so we never
  // re-encode a URL that was already clean.
  function cleanUrl(input, base) {
    let url;
    try { url = new URL(input, base); } catch (e) { return input; }
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return input;
    const sites = matchSites(url.hostname.toLowerCase());
    let changed = false;

    if (url.search.length > 1) {
      const kept = url.search.slice(1).split('&').filter((part) => {
        let key = part.split('=')[0];
        try { key = decodeURIComponent(key); } catch (e) { /* keep raw */ }
        const drop = isTracking(key, sites);
        if (drop) changed = true;
        return !drop;
      });
      url.search = kept.length ? '?' + kept.join('&') : '';
    }
    if (sites.some((s) => s.pathStrip) && PATH_STRIP.test(url.pathname)) {
      url.pathname = url.pathname.replace(PATH_STRIP, '') || '/';
      changed = true;
    }
    return changed ? url.href : input;
  }

  function cleanText(text) {
    return text.replace(/https?:\/\/[^\s<>"']+/g, (m) => {
      const tail = (m.match(/[.,;:!?)\]]+$/) || [''])[0];
      return cleanUrl(tail ? m.slice(0, -tail.length) : m) + tail;
    });
  }

  const api = { cleanUrl, cleanText, GLOBAL, SITES, PATH_STRIP };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.__cleanLinks = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
