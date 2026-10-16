# CLAUDE.md: מנהל סגירות אשדוד

Read before every build. Every correction from Anat is appended to the "Corrections log" at the bottom.

## What this is
Closure permits (winter screen type 1, seasonal closure type 2) for Ashdod food businesses: a landing home page (vision, goal, input / operation / output, 3D tour), visual guidelines in 3D, the policy as a searchable numbered document, a closures map where closures are added by address, and full owner / municipality / resident pages.

## Live
- Production: Vercel project `ashdod-closure-app`, deploys from `main` (URL in Delivery).
- Data: IndexedDB in each browser (`src/api/localDb.js`, `src/api/base44Client.js` keeps the old Base44 API shape). No Supabase: the records hold business owners' personal details and there is no login yet. Moving to a shared DB needs a login decision first.

## Key files
- `src/lib/policy.js`: the policy as clauses with ids (א.1 ... ג.18), `citationOf`, search, and `CHECKLIST_CLAUSES` (reviewer checklist to clause). Single source for the policy page, game and checklist.
- `src/lib/guidelines.js`: the 12 visual guidelines (clause, rule, right vs wrong, 3D parameters). `src/components/ClosureScene3D.jsx`: three.js street model (lazy-loaded), animated between parameter sets, HTML labels projected onto the model, OrbitControls.
- `src/lib/quiz.js` + `src/components/Quiz.jsx`: true / false questions, each cites a clause.
- `src/lib/demoData.js`: 12 demo records ("(הדגמה)" in the name, `demo: true`), loaded once into an empty browser (`seedOnce` in Layout), removable in "מערכת".
- `src/lib/map.js`: free base maps (CARTO grey, OSM, Esri imagery), OSM food venues (`public/data/osm-venues.json` snapshot + live Overpass refresh), pins (circle = type 1, square = type 2).
- `src/lib/settings.js`: persisted settings, install prompt, dev-chat URL.
- `src/components/Layout.jsx` top bar: app name (home link) + one "מערכת" button. `src/components/SettingsDrawer.jsx` is the system drawer: copy link, dev chat, install, backup, base map, OSM layer, demo data, wipe.
- Map (`src/pages/MapView.jsx`): add a closure by address (Nominatim, Ashdod viewbox), by clicking the map (reverse geocode fills the address), or a pasted list ("address" or "business | address", one per second). Status `mapped` = "סגירה קיימת" (surveyed closure, not an application); hidden from the owner's "my requests".

## Non-negotiables
- Hebrew, RTL, no icons or emoji. `lucide-react` imports in app code go to `src/lib/noIcons.jsx` (renders nothing). Icon-only buttons must get text.
- All buttons in the top bar live inside the single "מערכת" button (overrides the skill's top-bar buttons, per Anat 2026-10-16).
- Policy outputs always show the clause id and link to `/policy?c=<id>`. Never invent policy content. The policy page itself has no copy / link buttons per clause.
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
