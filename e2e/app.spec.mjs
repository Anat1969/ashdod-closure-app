import { test, expect } from '@playwright/test';
import fs from 'node:fs';

const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
const SHOTS = 'e2e/screenshots';
const STREETS = [
  { code: 856, name: 'הציונות', kind: 'street', osm_name: 'הציונות', center: [31.787, 34.6448], lines: [[[31.7855, 34.6430], [31.787, 34.6448], [31.7885, 34.6466]]] },
  { code: 128, name: 'רוגוזין', kind: 'street', osm_name: 'רוגוזין', center: [31.7912, 34.6365], lines: [[[31.7900, 34.6350], [31.7912, 34.6365], [31.7925, 34.6380]]] },
  { code: 189, name: 'שד הרצל', kind: 'street', osm_name: 'שדרות הרצל', center: [31.7973, 34.6335], lines: [[[31.7960, 34.6320], [31.7973, 34.6335]]] },
];
fs.mkdirSync(SHOTS, { recursive: true });

// Block everything external: tiles, fonts, OSM services.
async function mockExternal(page) {
  const external = [];
  await page.route(/^https?:\/\/(?!localhost)/, async route => {
    const url = route.request().url();
    // The A&I logo button comes from the portfolio app; AI_MENU_JS can point to a local copy.
    if (url === 'https://appofapp-gh.vercel.app/ai-menu.js') return process.env.AI_MENU_JS ? route.fulfill({ path: process.env.AI_MENU_JS, contentType: 'application/javascript' }) : route.continue();
    external.push(url);
    if (/overpass-api/.test(url)) {
      return route.fulfill({ json: { elements: [{ type: 'node', id: 1, lat: 31.79, lon: 34.64, tags: { name: 'בדיקה', amenity: 'cafe', outdoor_seating: 'yes' } }] } });
    }
    if (/supabase\.co\/rest\/v1\/cl_streets/.test(url)) return route.fulfill({ json: STREETS });
    if (/nominatim.*reverse/.test(url)) return route.fulfill({ json: { address: { road: 'הציונות', house_number: '7' } } });
    if (/nominatim/.test(url)) {
      const q = decodeURIComponent(url);
      if (/לא קיים|רוגוזין/.test(q)) return route.fulfill({ json: [] });
      return route.fulfill({ json: [{ lat: '31.787', lon: '34.645' }] });
    }
    if (/\.png|tile/.test(url)) return route.fulfill({ body: PNG, contentType: 'image/png' });
    return route.abort();
  });
  return external;
}

function trackErrors(page) {
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|ERR_FAILED/.test(m.text())) errors.push(m.text()); });
  return errors;
}

test.beforeEach(async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await mockExternal(page);
});

test('the A&I logo button holds every technical control', async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /סגירה טובה/ })).toBeVisible();
  await expect(page.locator('header > div button')).toHaveCount(1); // only the A&I logo button
  await expect(page.locator('ai-menu .logo')).toBeVisible();
  await expect(page.getByTestId('demo-banner')).toContainText('12');
  for (const name of ['הנחיות ויזואליות', 'מסמך המדיניות', 'מפת סגירות', 'בעל עסק', 'עירייה', 'תושב', 'בית']) {
    await page.getByRole('navigation').getByRole('link', { name, exact: true }).click();
    await expect(page.locator('main')).toBeVisible();
  }
  await page.getByTestId('home-link').click();
  await page.locator('ai-menu .logo').click();
  await expect(page.locator('ai-menu a.item', { hasText: 'שיחת הפיתוח' })).toHaveAttribute('href', /claude\.ai\/code/);
  await page.locator('ai-menu .item', { hasText: 'העתקת קישור' }).click();
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toContain('#/');
  await page.waitForTimeout(1000);
  await page.locator('ai-menu .logo').click();
  await page.locator('ai-menu .item', { hasText: 'הגדרות המערכת' }).click();
  const drawer = page.getByTestId('system-drawer');
  await expect(drawer).toBeVisible();
  for (const b of ['מפה בהירה', 'תצלום אוויר', 'מפת רחובות אשדוד']) await drawer.getByRole('button', { name: b }).click();
  await drawer.getByRole('button', { name: 'רענון מ-OSM' }).click();
  await expect(page.getByTestId('system-status')).toHaveText(/עודכנו 1/);
  const download = page.waitForEvent('download');
  await drawer.getByRole('button', { name: 'ייצוא גיבוי לקובץ' }).click();
  expect((await download).suggestedFilename()).toMatch(/ashdod-closure-backup/);
  await page.screenshot({ path: `${SHOTS}/system.png` });
  await drawer.getByRole('button', { name: 'הסרת נתוני הדגמה' }).click();
  await expect(page.getByTestId('system-status')).toHaveText(/הוסרו 12/);
  await drawer.getByRole('button', { name: 'טעינת נתוני הדגמה' }).click();
  await expect(page.getByTestId('system-status')).toHaveText(/נטענו 12/);
  await drawer.getByRole('button', { name: 'סגירה', exact: true }).click();
  await expect(drawer).toBeHidden();
  expect(errors).toEqual([]);
});

test('home is a landing page with the 3D closure tour', async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto('/');
  await expect(page.getByTestId('scene3d').locator('canvas')).toBeVisible();
  for (const t of ['חזון', 'מטרה', 'קלט', 'אופרציה', 'פלט']) await expect(page.getByText(t, { exact: true }).first()).toBeAttached();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${SHOTS}/home.png` });
  for (let y = 0; y < 2600; y += 400) { await page.mouse.wheel(0, 400); await page.waitForTimeout(100); }
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${SHOTS}/home-full.png`, fullPage: true });
  expect(errors).toEqual([]);
});

test('policy document: keyword search without copy buttons', async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto('/#/policy');
  await expect(page.getByTestId('clause')).toHaveCount(27);
  await expect(page.getByRole('button', { name: /העתקת/ })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'קישור לסעיף' })).toHaveCount(0);
  await page.getByRole('button', { name: 'שיפוע', exact: true }).click();
  await expect(page.getByTestId('search-count')).toContainText('ג.11');
  await page.getByLabel('חיפוש מילות מפתח במסמך').fill('מרווח מדרכה');
  await expect(page.getByTestId('search-count')).toContainText('ג.5');
  await page.getByRole('button', { name: 'הבא' }).click();
  await expect(page).toHaveURL(/c=/);
  await page.getByLabel('חיפוש מילות מפתח במסמך').fill('(+[');
  await expect(page.getByTestId('search-count')).toContainText('לא נמצאו');
  await page.getByRole('button', { name: 'ניקוי' }).click();
  await page.goto('/#/policy?c=ג.13');
  await expect(page.locator('#clause-ג\\.13')).toBeInViewport();
  await page.screenshot({ path: `${SHOTS}/policy.png` });
  expect(errors).toEqual([]);
});

test('visual guidelines: list, 3D model, right vs wrong, tour and quiz', async ({ page }) => {
  test.setTimeout(120000); // software WebGL in headless Chromium is slow
  const errors = trackErrors(page);
  await page.goto('/#/learn');
  await expect(page).toHaveURL(/guidelines/);
  const list = page.getByTestId('guideline-list');
  await expect(list.getByRole('button')).toHaveCount(12);
  await expect(page.getByTestId('scene3d').locator('canvas')).toBeVisible();
  await list.getByRole('button', { name: /פתח לחזית בלבד/ }).click();
  await expect(page.getByTestId('verdict').getByTestId('mark-ok')).toBeVisible();
  await page.getByRole('button', { name: 'כך לא' }).click();
  await expect(page.getByTestId('guideline-caption')).toContainText('לא תקין');
  await expect(page.getByTestId('verdict').getByTestId('mark-no')).toBeVisible();
  await expect(page.getByTestId('verdict')).toContainText('כך לא');
  await page.waitForTimeout(1600);
  await page.screenshot({ path: `${SHOTS}/guidelines-bad.png` });
  await page.getByRole('button', { name: 'כך נכון' }).click();
  await expect(page.getByTestId('guideline-caption')).toContainText('תקין');
  for (const item of await list.getByRole('button').all()) await item.click();
  await page.getByRole('button', { name: 'הבא' }).click();
  await page.getByRole('button', { name: 'הקודם' }).click();
  await page.getByRole('button', { name: 'סיור אוטומטי' }).click();
  await expect(page.getByRole('button', { name: 'עצירת הסיור' })).toBeVisible();
  await page.getByRole('button', { name: 'עצירת הסיור' }).click();
  for (let i = 0; i < 12; i++) {
    await page.getByTestId('quiz-card').getByRole('button', { name: 'נכון', exact: true }).click();
    await expect(page.getByTestId('quiz-feedback')).toBeVisible();
    await page.getByRole('button', { name: /לשאלה הבאה|לסיכום/ }).click();
  }
  await expect(page.getByText('התוצאה שלכם')).toBeVisible();
  await page.getByRole('button', { name: 'משחק חוזר' }).click();
  await expect(page.getByTestId('quiz-score')).toHaveText('0/12');
  expect(errors).toEqual([]);
});

test('closures map: shows closures and adds them by address, list and click', async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto('/#/map');
  const map = page.getByTestId('closure-map');
  await expect(map.locator('.leaflet-marker-icon')).toHaveCount(12);
  await expect(page.getByTestId('legend')).toContainText('סגירה קיימת');
  await expect(map.locator('path.leaflet-interactive')).toHaveCount(3);
  await expect(page.getByRole('link', { name: 'המפה העירונית הרשמית' })).toHaveAttribute('href', /ashdod\.muni\.il/);
  await page.screenshot({ path: `${SHOTS}/map.png` });
  await page.getByLabel('רחוב').fill('הציונות');
  await expect(map.locator('.street-label')).toHaveText('הציונות');
  await expect(page.locator('aside button').filter({ hasText: 'בית קפה הציונות' })).toHaveCount(1);
  await page.getByRole('button', { name: 'כל העיר' }).click();
  await page.getByRole('tab', { name: 'הוספת סגירות' }).click();
  await page.getByLabel('כתובת').fill('ציונות 30');
  await expect(page.getByTestId('street-match')).toContainText('רחוב רשמי: הציונות (סמל 856)');
  await page.getByLabel('שם העסק').fill('קפה בדיקה');
  await page.getByRole('button', { name: 'איתור והוספה למפה' }).click();
  await expect(page.getByRole('status')).toContainText('נוספה סגירה בהציונות 30');
  await expect(map.locator('.leaflet-marker-icon')).toHaveCount(13);
  await page.getByLabel('כתובת').fill('רוגוזין 4');
  await page.getByRole('button', { name: 'איתור והוספה למפה' }).click();
  await expect(page.getByRole('status')).toContainText('מוקמה על הרחוב');
  await page.getByLabel('רשימת כתובות').fill('הציונות 2\nקפה ים | לא קיים 1');
  await page.getByRole('button', { name: 'הוספת כל הכתובות' }).click();
  await expect(page.getByRole('status')).toContainText('נוספו 2', { timeout: 10000 });
  await expect(page.getByText('לא אותרו. לחצו על כתובת ואז על המפה:')).toBeVisible();
  await page.getByRole('button', { name: 'לא קיים 1, אשדוד' }).click();
  await map.click({ position: { x: 200, y: 200 } });
  await expect(page.getByRole('status')).toContainText('המיקום נשמר');
  await page.getByRole('button', { name: 'סימון במפה' }).click();
  await map.click({ position: { x: 260, y: 240 } });
  await expect(page.getByLabel('כתובת')).toHaveValue('הציונות 7');
  await page.getByRole('button', { name: 'הוספה למפה' }).click();
  await expect(page.getByRole('status')).toContainText('במיקום שסימנת');
  await expect(map.locator('.leaflet-marker-icon')).toHaveCount(17);
  await page.getByRole('button', { name: 'עסקי מזון מ-OSM' }).click();
  await expect(map.locator('.osm-dot').first()).toBeVisible();
  await page.getByRole('tab', { name: /סגירות במפה/ }).click();
  for (const f of ['סגירה קיימת', 'מאושר', 'עונתית', 'פרגוד חורף', 'כל הסוגים', 'הכל']) await page.getByRole('button', { name: f, exact: true }).first().click();
  await page.screenshot({ path: `${SHOTS}/map-added.png` });
  expect(errors).toEqual([]);
});

test('street matching still works on a repeat visit (cached streets)', async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto('/#/map');
  await expect(page.getByTestId('closure-map').locator('path.leaflet-interactive')).toHaveCount(3);
  await page.reload();
  await page.getByRole('tab', { name: 'הוספת סגירות' }).click();
  await page.getByLabel('כתובת').fill('שדרות הרצל 3');
  await expect(page.getByTestId('street-match')).toContainText('שד הרצל');
  expect(errors).toEqual([]);
});

test('owner, municipality and resident pages are full', async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto('/#/owner');
  await expect(page.getByTestId('eligibility-result')).toContainText('אפשר להגיש');
  await page.getByRole('button', { name: 'עסק אחר' }).click();
  await expect(page.getByTestId('eligibility-result')).toContainText('ג.3');
  await expect(page.getByText('מה להכין')).toBeVisible();
  await page.screenshot({ path: `${SHOTS}/owner.png`, fullPage: true });
  await page.getByRole('button', { name: 'בקשה חדשה' }).click();
  await expect(page.getByRole('button', { name: 'הבא' })).toBeVisible();

  await page.goto('/#/architect');
  await expect(page.getByTestId('work-queue').getByRole('button')).toHaveCount(2);
  await page.screenshot({ path: `${SHOTS}/architect.png`, fullPage: true });
  await page.getByTestId('work-queue').getByRole('button').first().click();
  await expect(page).toHaveURL(/#\/architect\/.+/);
  await expect(page.getByText('סעיף ג.5').first()).toBeVisible();

  await page.goto('/#/residents');
  await expect(page.getByText('המדרכה שייכת לכולם')).toBeVisible();
  await expect(page.getByText('בית קפה הציונות (הדגמה)').first()).toBeVisible();
  await page.screenshot({ path: `${SHOTS}/residents.png`, fullPage: true });
  expect(errors).toEqual([]);
});

test('no icons rendered as svg in app chrome', async ({ page }) => {
  await page.goto('/#/policy');
  expect(await page.locator('header svg, main button svg').count()).toBe(0);
});

test.describe('mobile', () => {
  test.use({ viewport: { width: 375, height: 760 } });
  test('no horizontal scroll on any page', async ({ page }) => {
    for (const path of ['/', '/#/guidelines', '/#/policy', '/#/map', '/#/owner', '/#/architect', '/#/residents']) {
      await page.goto(path);
      await page.waitForTimeout(700);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, path).toBeLessThanOrEqual(0);
    }
    await page.goto('/#/guidelines');
    await page.waitForTimeout(1200);
    await page.screenshot({ path: `${SHOTS}/mobile-guidelines.png` });
  });
});

test('installable as a Chrome app', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(1500);
  const cdp = await page.context().newCDPSession(page);
  const { installabilityErrors } = await cdp.send('Page.getInstallabilityErrors');
  expect(installabilityErrors).toEqual([]);
});
