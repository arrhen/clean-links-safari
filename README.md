# Clean Links for Safari

A Safari web extension that strips tracking parameters and share IDs from URLs:

- **Address bar:** removes parameters before the request is sent (declarativeNetRequest),
  with a content-script fallback for params added after load.
- **Share / Copy link buttons:** cleans what goes to the clipboard or the native share sheet.
- **Links on the page:** cleans hrefs on hover, focus, long-press and right-click.
- **Control:** a toolbar popup turns cleaning off everywhere, or pauses it for a single site.

Covers `utm_*`, `fbclid`, `gclid`, `msclkid` and friends everywhere, plus site-specific
parameters for X/Twitter (`s`, `t`, `a`, `ref_src`...), Amazon (`ref=`, `pd_rd_*`, `pf_rd_*`, `tag`...),
YouTube, Instagram, Facebook, Reddit, LinkedIn, TikTok and Google search. Parameters that change
what you see (search terms, YouTube `t=` timestamps, Amazon `th=` variants) are left alone.

Not covered: server-side short links (`t.co`, `amzn.to`) — the ID lives on their server.

## Install

Safari only runs extensions inside a signed Mac app, so you build it yourself with your own
certificate. Requires macOS, Xcode, and Node.js.

1. In Xcode > Settings > Accounts, sign in with an Apple ID. A free account ("Personal Team") works.
   Click Manage Certificates > **+** > **Apple Development**. Note your Team ID.
2. Run:

   ```sh
   TEAM_ID=ABCDE12345 BUNDLE_ID=com.yourname.cleanlinks ./scripts/install.sh
   ```

   `BUNDLE_ID` is any unique reverse-DNS id you choose.
3. Quit and reopen Safari. Enable it in Safari > Settings > Extensions and choose
   "Always Allow on Every Website".

Free-account certificates and profiles expire eventually; if the extension stops loading, run the
script again.

The Mac app (`app/`) is the container Safari requires: a window showing whether the extension is on, with
steps to enable it. `install.sh` overlays it onto the generated Xcode project, so nothing generated is committed.

## Other browsers

```sh
npm run build      # writes dist/ packages for Chrome, Edge, Firefox and Safari
npm test           # cleaning rules, settings, and build checks
```

Chrome and Edge: load `dist/chrome` as an unpacked extension (chrome://extensions, Developer mode).
Firefox: `dist/firefox` (about:debugging, Load Temporary Add-on), or `npx web-ext lint -s dist/firefox`.
Store listing copy lives in `docs/store-listings.md`.

Forking? Change `FIREFOX_ID` in `scripts/build.js` (Firefox requires a unique add-on ID) and the URLs in `extension/popup.html` and `extension/manifest.json`.

## Customize

Edit the `SITES` table in `extension/clean.js`, then rerun `install.sh` (it regenerates
`extension/rules.json` from the same table).

```sh
node test/clean.test.js
```

## Privacy

The extension makes no network requests and collects nothing. All processing happens locally.

## License

MIT
