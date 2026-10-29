// Generates rules.json (declarativeNetRequest) from the table in clean.js.
const fs = require('fs');
const { GLOBAL, SITES } = require('../extension/clean.js');
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const hasParam = (names) => '[?&](?:' + names.map(esc).join('|') + ')(?:[=&#]|$)';
const rules = [];
const add = (condition, redirect) => rules.push({
  id: rules.length + 1, priority: 1,
  action: { type: 'redirect', redirect },
  condition: Object.assign({ resourceTypes: ['main_frame'], isUrlFilterCaseSensitive: true }, condition),
});
const strip = (names) => ({ transform: { queryTransform: { removeParams: names } } });

add({ regexFilter: hasParam(GLOBAL) }, strip(GLOBAL));
for (const s of SITES) {
  add({ requestDomains: s.domains, regexFilter: hasParam(s.params) }, strip(s.params));
  if (s.pathStrip) add({ requestDomains: s.domains,
    regexFilter: '^(https://[^/]+(?:/[^?#]*)?)/ref=[^/?#]*(.*)$' },
    { regexSubstitution: '\\1\\2' });
}
fs.writeFileSync(__dirname + '/../extension/rules.json', JSON.stringify(rules, null, 2));
console.log(rules.length + ' rules');
