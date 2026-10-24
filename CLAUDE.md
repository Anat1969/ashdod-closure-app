# CLAUDE.md: מנהל סגירות אשדוד

Read before every build. Every correction from Anat is appended to the "Corrections log" at the bottom.

## What this is
Closure permits (winter screen type 1, seasonal closure type 2) for Ashdod food businesses: a landing home page (vision, goal, input / operation / output, 3D tour), visual guidelines in 3D, the policy as a searchable numbered document, a closures map where closures are added by address, and full owner / municipality / resident pages.

## Live
- Production: Vercel project `ashdod-closure-app`, deploys from `main` (URL in Delivery).
- Data: IndexedDB in each browser (`src/api/localDb.js`, `src/api/base44Client.js` keeps the old Base44 API shape). Applications stay local: they hold business owners' personal details and there is no login yet. Moving them to a shared DB needs a login decision first.
- Supabase ASHDODMAP (`cbhexpybdggwzyakgagd`, shared with other apps, this app owns only `cl_` objects): `cl_streets` = the 715 official Ashdod streets (data.gov.il street register, resource 9ad3862c-8391-4b2f-84a4-2d4c68625f4b, city code 70) matched to OSM geometry (539 with lines), public read via the publishable key. `cl_osm_ways` = raw OSM street segments (no public access). Refresh both with SQL `http()` (see Known pitfalls).

## Key files
- `src/lib/policy.js`: the policy as clauses with ids (א.1 ... ג.18), `citationOf`, search, and `CHECKLIST_CLAUSES` (reviewer checklist to clause). Single source for the policy page, game and checklist.
- `src/lib/guidelines.js`: the 12 visual guidelines (clause, rule, right vs wrong, 3D parameters). `src/components/ClosureScene3D.jsx`: three.js street model (lazy-loaded), animated between parameter sets, HTML labels projected onto the model, OrbitControls.
- `src/lib/quiz.js` + `src/components/Quiz.jsx`: true / false questions, each cites a clause.
- `src/lib/demoData.js`: 12 demo records ("(הדגמה)" in the name, `demo: true`), loaded once into an empty browser (`seedOnce` in Layout), removable in הגדרות המערכת (inside the A&I logo button).
- `src/lib/streets.js`: loads `cl_streets`, parses "street number", matches typed names to official streets (word order, שד/שדרות, quotes and a dropped leading ה ignored), distance to the street line.
- `locateAddress` in `src/lib/map.js`: Nominatim is queried with the official street name; the hit must lie within 250 m of that street, otherwise the closure is placed on the street (precision `street`). Records store `street_code`, `street_name`, `location_precision`.
- `src/components/VerdictMark.jsx`: large animated green check / red X for right vs wrong.
- `src/lib/map.js`: free base maps (default OSM street map of Ashdod with Hebrew names, CARTO Voyager, Esri imagery), map limited to `ASHDOD_BOUNDS`, link to the official municipal GIS, OSM food venues (`public/data/osm-venues.json` snapshot + live Overpass refresh), pins (circle = type 1, square = type 2).
- `src/lib/settings.js`: persisted settings, install prompt, dev-chat URL.
- `src/components/Layout.jsx` top bar: app name (home link) + the A&I logo button (`<ai-menu>`: copy link, dev chat, install, and "הגדרות המערכת"). `src/components/SettingsDrawer.jsx` is the system drawer opened from that item: backup, base map, OSM layer, demo data, wipe.
- Map (`src/pages/MapView.jsx`): add a closure by address (Nominatim, Ashdod viewbox), by clicking the map (reverse geocode fills the address), or a pasted list ("address" or "business | address", one per second). Status `mapped` = "סגירה קיימת" (surveyed closure, not an application); hidden from the owner's "my requests".

## Non-negotiables
- Hebrew, RTL, no icons or emoji. `lucide-react` imports in app code go to `src/lib/noIcons.jsx` (renders nothing). Icon-only buttons must get text. Exception by Anat: right / wrong is always marked with the large designed green check / red X (`VerdictMark`), next to a text label.
- Every map is a real map of Ashdod with readable Hebrew street names, and every address is correlated with the official Ashdod street list. This is the default, never something Anat has to ask for.
- All buttons in the top bar live inside the single A&I logo button (replaced the "מערכת" button on 2026-10-24).
- Policy outputs always show the clause id and link to `/policy?c=<id>`. Never invent policy content. The policy page itself has no copy / link buttons per clause.
- Demo data is labeled "הדגמה" and removable.
- Design: graphite palette (tailwind `blue` is remapped to graphite in `tailwind.config.js`), IBM Plex Sans Hebrew / Mono, depth via `.paper`, `.ink`, `.lift`. Status colors keep meaning and always carry a text label.

## Testing (before merge)
- `npm run build && npm run lint`
- Playwright is not in package.json (xlsx comes from cdn.sheetjs.com, which this container cannot reach). Install ad hoc: swap xlsx to `0.18.5` in package.json, `npm install --no-save @playwright/test@1.56.1`, restore package.json and the lock.
- `PW_CHROMIUM=/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell npx playwright test` (mocks all external hosts, checks every page, mobile overflow, installability). Look at `e2e/screenshots/`.

## Known pitfalls
- Leaflet in RTL: map containers use class `map-ltr`.
- Container cannot reach OSM / Overpass / data.gov.il; Supabase SQL `http()` can (overpass-api.de, retry on 502, set `CURLOPT_TIMEOUT_MS`; data.gov.il needs a browser User-Agent).
- The municipal GIS (GIS-net, `v5.gis-net.co.il/v5-iframe/ashdod`) has no open API; the app links to it instead of embedding.
- Cached data in localStorage must go through the same preparation as fresh data (the streets cache once skipped token preparation).
- framer-motion SVG attributes need `initial={false}` or an explicit initial, or the console logs "Expected length, undefined". Animate shapes as `path d`, not `polygon points`.
- HashRouter: deep links look like `/#/policy?c=ג.5`, `/#/guidelines?g=door&v=bad`.
- Grids on mobile: always `grid-cols-[minmax(0,1fr)]` as the base, or long content overflows the page.
- three.js in headless Chromium renders with software WebGL: slow, tests that drive the 3D page need a longer timeout.

## Delivery
Final URL + one line. Update this file.
- Production: https://ashdod-closure-app.vercel.app (Vercel project `ashdod-closure-app`, alias also ashdod-closures.vercel.app). The old GitHub Pages workflow still runs on main.

## Corrections log
- 2026-10-16: All top-bar buttons go into one "מערכת" button.
- 2026-10-16: Home page = landing page: what the app is, input / output, vision, goal, operation, with an animated visual of how a closure should look. Friendly but clear.
- 2026-10-16: Policy document: no copy or link buttons on clauses.
- 2026-10-16: The "game" page was unclear. It is now "הנחיות ויזואליות": the guidelines as a text list plus a 3D model.
- 2026-10-16: The map must show where closures are, and let Anat add closures by address.
- 2026-10-16: Owner, municipality and resident pages must not be empty: real content plus demo data.
- 2026-10-16: The Ashdod map was missing. Always connect a real Ashdod map with streets correlated to the official street list, without being asked.
- 2026-10-16: Mark "כך נכון" / "כך לא" with a large designed green check and red X.

## A&I logo button
The top bar holds only the app name (links home), content navigation, and ONE logo button "אד' ענת שטיבלמן A&I" (`<ai-menu>` from https://appofapp-gh.vercel.app/ai-menu.js). Every editing and development action (העתקת קישור, שיחת הפיתוח, פרויקט המחקר, התקנת האפליקציה, edit mode, add, delete) lives only inside it, never as loose buttons. Standard: https://github.com/Anat1969/AppOfApp-GH/blob/main/docs/ai-menu-standard.md
