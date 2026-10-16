# CLAUDE.md: מנהל סגירות אשדוד

Read before every build. Every correction from Anat is appended to the "Corrections log" at the bottom.

## What this is
Closure permits (winter screen type 1, seasonal closure type 2) for Ashdod food businesses: the policy as a cited, searchable document, a learning game, a closures map, and the owner / municipality / resident tracks.

## Live
- Production: Vercel project `ashdod-closure-app`, deploys from `main` (URL in Delivery).
- Data: IndexedDB in each browser (`src/api/localDb.js`, `src/api/base44Client.js` keeps the old Base44 API shape). No Supabase: the records hold business owners' personal details and there is no login yet. Moving to a shared DB needs a login decision first.

## Key files
- `src/lib/policy.js`: the policy as clauses with ids (א.1 ... ג.18), `citationOf`, search, and `CHECKLIST_CLAUSES` (reviewer checklist to clause). Single source for the policy page, game and checklist.
- `src/lib/simulator.js`: pure rule checks for the game + quiz questions. Every result cites a clause.
- `src/lib/map.js`: free base maps (CARTO grey, OSM, Esri imagery), OSM food venues (`public/data/osm-venues.json` snapshot + live Overpass refresh), pins (circle = type 1, square = type 2).
- `src/lib/settings.js`: persisted settings, install prompt, dev-chat URL.
- `src/components/Layout.jsx` top bar; `src/components/SettingsDrawer.jsx` holds all technical controls (backup, base map, OSM layer, demo data, wipe).

## Non-negotiables
- Hebrew, RTL, no icons or emoji. `lucide-react` imports in app code go to `src/lib/noIcons.jsx` (renders nothing). Icon-only buttons must get text.
- Technical buttons only inside "הגדרות". Top bar: app name -> home, העתקת קישור, שיחת הפיתוח, התקנת האפליקציה, הגדרות.
- Policy outputs always show the clause id and link to `/policy?c=<id>`. Never invent policy content.
- Demo data is labeled "הדגמה" and removable.
- Design: graphite palette (tailwind `blue` is remapped to graphite in `tailwind.config.js`), IBM Plex Sans Hebrew / Mono, depth via `.paper`, `.ink`, `.lift`. Status colors keep meaning and always carry a text label.

## Testing (before merge)
- `npm run build && npm run lint`
- Playwright is not in package.json (xlsx comes from cdn.sheetjs.com, which this container cannot reach). Install ad hoc: swap xlsx to `0.18.5` in package.json, `npm install --no-save @playwright/test@1.56.1`, restore package.json and the lock.
- `PW_CHROMIUM=/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell npx playwright test` (mocks all external hosts, checks every page, mobile overflow, installability). Look at `e2e/screenshots/`.

## Known pitfalls
- Leaflet in RTL: map containers use class `map-ltr`.
- Container cannot reach OSM / Overpass; Supabase SQL `http()` can (overpass-api.de, retry on 502, set `CURLOPT_TIMEOUT_MS`).
- framer-motion SVG attributes need `initial={false}` or an explicit initial, or the console logs "Expected length, undefined". Animate shapes as `path d`, not `polygon points`.
- HashRouter: deep links look like `/#/policy?c=ג.5`.

## Delivery
Final URL + one line. Update this file.

## Corrections log
(empty)
