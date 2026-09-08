import { chromium } from 'playwright';
import { BASE } from './harness.mjs';

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await (
  await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'id-ID' })
).newPage();
const galat = [];
page.on('pageerror', (e) => galat.push(e.message));

const coba = async (u, p, nama) => {
  await page.goto(`${BASE}/login`);
  await page.waitForTimeout(1000);
  await page.locator('input').first().fill(u);
  await page.fill('input[type="password"]', p);
  await page.click('button[type="submit"]');
  await page.waitForTimeout(1800);
  const pesan = await page.locator('[role="alert"]').allInnerTexts();
  console.log(
    `${nama.padEnd(28)} → ${page.url().replace(BASE, '').padEnd(18)} ${JSON.stringify(pesan)}`,
  );
  await page.screenshot({ path: `/tmp/audit/login-${nama.replace(/\W+/g, '-')}.png` });
};

/* 27 — sandi salah, akun nonaktif, dan kolom kosong. */
await coba('rina.marlina', 'salahsandi', 'sandi salah');
await coba('yuni.astuti', 'pegawai123', 'akun nonaktif');
await coba('', '', 'kolom kosong');
await coba('rina.marlina', 'admin123', 'benar');

/* Token dibuang: halaman terlindungi harus melempar ke login. */
await page.evaluate(() => localStorage.removeItem('sip.token'));
await page.goto(`${BASE}/surat-masuk`);
await page.waitForTimeout(1800);
console.log('tanpa token, /surat-masuk →', page.url().replace(BASE, ''));

console.log('\npengecualian:', galat.length === 0 ? 'tidak ada' : galat);
await browser.close();
