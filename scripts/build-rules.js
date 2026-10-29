// Generates extension/rules.json (declarativeNetRequest) from the table in clean.js.
//
// Uses plain urlFilter patterns, not regexFilter: Safari silently drops rules
// whose regex uses alternation or non-capturing groups. One rule per parameter
// and per separator ("?" or "&"), so a rule only fires when that exact parameter
// is present. Every rule in a group removes the whole group's parameter list, so
// one redirect cleans the lot.
const fs = require('fs');
const { GLOBAL, SITES } = require('../extension/clean.js');

const rules = [];
function addGroup(params, requestDomains) {
  for (const param of params) {
    for (const sep of ['?', '&']) {
      const condition = {
        urlFilter: `${sep}${param}=`,
        resourceTypes: ['main_frame'],
        isUrlFilterCaseSensitive: true,
      };
      if (requestDomains) condition.requestDomains = requestDomains;
      rules.push({
        id: rules.length + 1,
        priority: 1,
        action: { type: 'redirect', redirect: { transform: { queryTransform: { removeParams: params } } } },
        condition,
      });
    }
  }
}

addGroup(GLOBAL);
for (const s of SITES) addGroup(s.params, s.domains);

fs.writeFileSync(__dirname + '/../extension/rules.json', JSON.stringify(rules));
console.log(rules.length + ' rules');
