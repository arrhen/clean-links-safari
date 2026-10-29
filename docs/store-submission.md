# Store submission cheat sheet

Files: `dist/clean-links-{chrome,edge,firefox}-1.0.2.zip` (also on the v1.0.2 GitHub release), `dist/clean-links-source-1.0.2.zip` (Firefox source), screenshots and promo tile in `assets/screenshots/`. Listing text: `store-listings.md`.

## Permission justifications (paste as asked)

- **Single purpose:** Remove tracking parameters and share IDs from links, in the address bar and when copying or sharing.
- **Host access (all websites):** Tracking parameters can appear on any site, so the extension reads and rewrites page addresses and the links a user copies or shares everywhere. It uses this only to remove the parameters in its public source.
- **declarativeNetRequest:** Static redirect rules that remove tracking query parameters from a page's address; dynamic rules that pause cleaning for sites the user turns off.
- **storage:** Saves the user's on/off switch and list of paused sites, locally.
- **scripting (Chrome, Edge):** Injects the extension's own packaged page script (hooks for Copy link and Share) into pages. No remote code.
- **Remote code:** None. Everything is packaged.
- **Data use:** Collects nothing; no data sold, shared or transferred; nothing used for unrelated purposes or credit decisions.
