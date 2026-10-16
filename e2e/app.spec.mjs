import { test, expect } from '@playwright/test';
import fs from 'node:fs';

const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
const SHOTS = 'e2e/screenshots';
fs.mkdirSync(SHOTS, { recursive: true });

// Block everything external: tiles, fonts, OSM services.
async function mockExternal(page) {
  const external = [];
  await page.route(/^https?:\/\/(?!localhost)/, async route => {
    const url = route.request().url();
    external.push(url);
    if (/overpass-api/.test(url)) {
      return route.fulfill({ json: { elements: [{ type: 'node', id: 1, lat: 31.79, lon: 34.64, tags: { name: 'בדיקה', amenity: 'cafe', outdoor_seating: 'yes' } }] } });
    }
    if (/nominatim/.test(url)) return route.fulfill({ json: [{ lat: '31.787', lon: '34.645' }] });
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

test('top bar, navigation and settings drawer', async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /סגירה טובה/ })).toBeVisible();
  for (const name of ['מסמך המדיניות', 'משחק המדיניות', 'מפת סגירות', 'בעל עסק', 'עירייה', 'תושב', 'בית']) {
    await page.getByRole('navigation').getByRole('link', { name, exact: true }).click();
    await expect(page.locator('main')).toBeVisible();
  }
  await page.getByTestId('home-link').click();
  await expect(page).toHaveURL(/#\/$/);
  await page.getByRole('button', { name: 'העתקת קישור' }).click();
  await expect(page.getByRole('button', { name: 'הקישור הועתק' })).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain('#/');
  await expect(page.getByRole('link', { name: 'שיחת הפיתוח' }).first()).toHaveAttribute('href', /claude\.ai\/code/);

  await page.getByRole('button', { name: 'הגדרות' }).click();
  const drawer = page.getByTestId('settings-drawer');
  await expect(drawer).toBeVisible();
  for (const b of ['מפת רחובות', 'תצלום אוויר', 'מפה אפורה']) await drawer.getByRole('button', { name: b }).click();
  await drawer.getByRole('button', { name: 'טעינת נתוני הדגמה' }).click();
  await expect(drawer.getByRole('status')).toHaveText(/נטענו 6/);
  await drawer.getByRole('button', { name: 'רענון מ-OSM' }).click();
  await expect(drawer.getByRole('status')).toHaveText(/עודכנו 1/);
  const download = page.waitForEvent('download');
  await drawer.getByRole('button', { name: 'ייצוא גיבוי לקובץ' }).click();
  expect((await download).suggestedFilename()).toMatch(/ashdod-closure-backup/);
  await page.screenshot({ path: `${SHOTS}/settings.png` });
  await drawer.getByRole('button', { name: 'הסרת נתוני הדגמה' }).click();
  await expect(drawer.getByRole('status')).toHaveText(/הוסרו 6/);
  await drawer.getByRole('button', { name: 'סגירת ההגדרות' }).click();
  await expect(drawer).toBeHidden();
  expect(errors).toEqual([]);
});

test('policy document: keyword search, navigation and citation', async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto('/#/policy');
  await expect(page.getByTestId('clause')).toHaveCount(27);
  await page.getByRole('button', { name: 'שיפוע', exact: true }).click();
  await expect(page.getByTestId('search-count')).toContainText('ג.11');
  await page.getByLabel('חיפוש מילות מפתח במסמך').fill('מרווח מדרכה');
  await expect(page.getByTestId('search-count')).toContainText('ג.5');
  await page.getByRole('button', { name: 'הבא' }).click();
  await expect(page).toHaveURL(/c=%D7%92\.5|c=ג\.5/);
  await page.getByTestId('clause').first().getByRole('button', { name: 'העתקת ציטוט' }).click();
  await expect(page.getByRole('status')).toContainText('הועתק');
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain('ועדה מס\' 202411');
  await page.getByLabel('חיפוש מילות מפתח במסמך').fill('(+[');
  await expect(page.getByTestId('search-count')).toContainText('לא נמצאו');
  await page.getByRole('button', { name: 'ניקוי' }).click();
  await page.goto('/#/policy?c=ג.13');
  await expect(page.locator('#clause-ג\\.13')).toBeInViewport();
  await page.screenshot({ path: `${SHOTS}/policy.png`, fullPage: false });
  expect(errors).toEqual([]);
});

test('game: build a closure and quiz', async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto('/#/learn');
  await expect(page.getByTestId('sim-score')).toHaveText('100');
  await page.getByRole('button', { name: 'לצד' }).click();
  await expect(page.getByTestId('sim-results')).toContainText('הפתח פונה לצד');
  await page.getByRole('button', { name: /דק על המדרכה/ }).click();
  await page.getByRole('button', { name: 'עונתית' }).click();
  await expect(page.getByTestId('sim-results')).toContainText('זכוכית');
  await page.getByRole('button', { name: 'אתגר: תקנו סגירה שגויה' }).click();
  await expect(page.getByTestId('challenge-status')).toContainText('נותרו');
  await page.screenshot({ path: `${SHOTS}/game.png` });
  await page.getByRole('button', { name: 'התחלה מחדש' }).click();
  await expect(page.getByTestId('sim-score')).toHaveText('100');
  await page.getByTestId('sim-results').getByRole('link').first().click();
  await expect(page).toHaveURL(/policy\?c=/);

  await page.goto('/#/learn?mode=quiz');
  for (let i = 0; i < 12; i++) {
    await page.getByTestId('quiz-card').getByRole('button', { name: 'נכון', exact: true }).click();
    await expect(page.getByTestId('quiz-feedback')).toBeVisible();
    await page.getByRole('button', { name: /לשאלה הבאה|לסיכום/ }).click();
  }
  await expect(page.getByText('התוצאה שלכם')).toBeVisible();
  await page.getByRole('button', { name: 'משחק חוזר' }).click();
  await expect(page.getByTestId('quiz-score')).toHaveText('0/12');
  await page.goto('/#/learn?mode=quiz&clause=ג.5');
  await expect(page.getByTestId('quiz-score')).toHaveText('0/1');
  expect(errors).toEqual([]);
});

test('closures map: layers, OSM venues and opening a file', async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto('/#/map');
  await expect(page.getByTestId('legend')).toBeVisible();
  await expect(page.locator('.osm-dot').first()).toBeVisible();
  const osmCount = await page.locator('.leaflet-marker-icon .osm-dot').count();
  expect(osmCount).toBeGreaterThan(50);
  await page.getByRole('button', { name: 'שכבת עסקי מזון' }).click();
  await expect(page.locator('.leaflet-marker-icon .osm-dot')).toHaveCount(0);
  await page.getByRole('button', { name: 'שכבת עסקי מזון' }).click();
  for (const f of ['מאושר', 'ממתין לבדיקה', 'עונתית', 'פרגוד חורף', 'כל הסוגים', 'הכל']) await page.getByRole('button', { name: f, exact: true }).first().click();
  await page.screenshot({ path: `${SHOTS}/map.png` });
  await page.locator('.leaflet-marker-icon .osm-dot').first().click({ force: true });
  await page.getByRole('button', { name: 'פתיחת תיק בקשה' }).click();
  await expect(page).toHaveURL(/#\/architect\/.+/);
  await page.goto('/#/map');
  await expect(page.locator('aside button').filter({ hasText: 'ממתין לבעל עסק' })).toHaveCount(1);
  expect(errors).toEqual([]);
});

test('owner, municipality and resident tracks render', async ({ page }) => {
  const errors = trackErrors(page);
  for (const [path, text] of [['/#/owner', 'בקשה חדשה'], ['/#/architect', 'בקשות'], ['/#/residents', 'סגירות מאושרות']]) {
    await page.goto(path);
    await expect(page.getByText(text).first()).toBeVisible();
  }
  await page.goto('/#/owner');
  await page.getByRole('button', { name: 'בקשה חדשה' }).click();
  await expect(page.getByRole('button', { name: 'הבא' })).toBeVisible();
  await page.screenshot({ path: `${SHOTS}/owner.png` });
  expect(errors).toEqual([]);
});

test('no icons rendered as svg in app chrome', async ({ page }) => {
  await page.goto('/#/policy');
  expect(await page.locator('header svg, main button svg').count()).toBe(0);
});

test.describe('mobile', () => {
  test.use({ viewport: { width: 375, height: 760 } });
  test('no horizontal scroll on any page', async ({ page }) => {
    for (const path of ['/', '/#/policy', '/#/learn', '/#/learn?mode=quiz', '/#/map', '/#/owner', '/#/architect', '/#/residents']) {
      await page.goto(path);
      await page.waitForTimeout(500);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, path).toBeLessThanOrEqual(0);
    }
    await page.goto('/');
    for (let y = 0; y < 3000; y += 400) { await page.mouse.wheel(0, 400); await page.waitForTimeout(120); }
    await page.waitForTimeout(800);
    await page.screenshot({ path: `${SHOTS}/mobile-home.png`, fullPage: true });
    await page.goto('/#/learn');
    await page.screenshot({ path: `${SHOTS}/mobile-game.png`, fullPage: true });
  });
});

test('installable as a Chrome app', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(1500);
  const cdp = await page.context().newCDPSession(page);
  const { installabilityErrors } = await cdp.send('Page.getInstallabilityErrors');
  expect(installabilityErrors).toEqual([]);
  const manifest = await (await page.request.get('/manifest.webmanifest')).json();
  expect(manifest.icons.length).toBeGreaterThan(1);
});
