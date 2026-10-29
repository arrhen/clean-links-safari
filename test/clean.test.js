const assert = require('assert');
const { cleanUrl, cleanText } = require('../extension/clean.js');

const cases = [
  ['https://x.com/user/status/20?s=20&t=abc&a=xyz', 'https://x.com/user/status/20'],
  ['https://twitter.com/user/status/20?ref_src=twsrc%5Etfw', 'https://twitter.com/user/status/20'],
  ['https://www.amazon.com/Name/dp/B08N5WRWNW/ref=sr_1_3?crid=X&qid=1&sr=8-3&th=1',
    'https://www.amazon.com/Name/dp/B08N5WRWNW?th=1'],
  ['https://www.amazon.com/s?k=usb+cable&crid=1&sprefix=usb', 'https://www.amazon.com/s?k=usb+cable'],
  ['https://www.youtube.com/watch?v=abc&t=42s&si=XYZ', 'https://www.youtube.com/watch?v=abc&t=42s'],
  ['https://example.com/page?id=5&utm_source=a&fbclid=x#frag', 'https://example.com/page?id=5#frag'],
  ['https://example.com/clean?q=a%20b+c', 'https://example.com/clean?q=a%20b+c'],
  ['mailto:a@b.c?utm_source=x', 'mailto:a@b.c?utm_source=x'],
];
for (const [input, expected] of cases) assert.strictEqual(cleanUrl(input), expected, input);

assert.strictEqual(
  cleanText('See https://x.com/a/status/1?s=20, and (https://example.com/?utm_medium=x).'),
  'See https://x.com/a/status/1, and (https://example.com/).');
console.log(`${cases.length + 1} checks passed`);
