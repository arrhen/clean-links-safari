# Clean Links for Safari

A Safari web extension that strips tracking parameters and share IDs from URLs:

- **Address bar:** removes parameters from the address as soon as the page opens, and, in browsers that apply redirect rules to the navigation (declarativeNetRequest), before the request is sent,
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

## iPhone and iPad

```sh
BUNDLE_ID=com.yourname.cleanlinks ./scripts/ios.sh simulator   # build, install and launch on a booted simulator
BUNDLE_ID=com.yourname.cleanlinks ./scripts/ios.sh project     # open the Xcode project to sign and archive
```

Needs Xcode with the iOS SDK. After installing, enable the extension in Safari (aA menu, then Manage Extensions).
`test/manual/index.html` is a page that shows whether tracking parameters were removed and whether the
Copy link and Share hooks loaded; serve it with `python3 -m http.server -d test/manual 8777`.

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

The extension makes no network requests of its own and collects nothing. All processing happens locally.

## Good to know

- Clean Links is not affiliated with X, Amazon, YouTube, Apple, Google, Microsoft or Mozilla; those names are used only to say where it works.
- It removes Amazon's `tag` parameter, which is an affiliate ID, so links you share won't credit anyone's affiliate account.
- It is provided as is, with no warranty. It can't remove every tracker, and on rare occasions removing a parameter can change how a link behaves; use the toolbar button to pause it for a site.

## License

MIT
