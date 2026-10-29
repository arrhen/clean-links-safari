(function (root) {
  // Settings live in storage.local as { enabled, disabledHosts }.
  function normalize(s) {
    s = s || {};
    return {
      enabled: s.enabled !== false,
      disabledHosts: Array.isArray(s.disabledHosts)
        ? s.disabledHosts.filter((h) => typeof h === 'string' && h) : [],
    };
  }

  function hostMatches(host, domain) {
    host = host.toLowerCase();
    return host === domain || host.endsWith('.' + domain);
  }

  function isActive(host, settings) {
    const s = normalize(settings);
    return s.enabled && !s.disabledHosts.some((d) => hostMatches(host, d));
  }

  // A high-priority "allow" rule stops the static redirect rules (priority 1).
  function dynamicRules(settings) {
    const s = normalize(settings);
    const rule = { id: 1, priority: 100, action: { type: 'allow' } };
    if (!s.enabled) return [Object.assign(rule, { condition: { resourceTypes: ['main_frame'] } })];
    if (!s.disabledHosts.length) return [];
    return [Object.assign(rule, {
      condition: { requestDomains: s.disabledHosts, resourceTypes: ['main_frame'] },
    })];
  }

  const api = { normalize, hostMatches, isActive, dynamicRules };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.__cleanSettings = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
