import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

export const BASE = 'http://localhost:5199';
export const AKUN = {
  admin: { u: 'rina.marlina', p: 'admin123' },
  pegawai: { u: 'budi.santoso', p: 'pegawai123' },
};

mkdirSync('/tmp/audit', { recursive: true });

/**
 * Membuka browser dan mencatat setiap galat yang lewat: galat konsol,
 * pengecualian yang tidak tertangkap, dan response 4xx/5xx. Konteks langkah
 * ikut dicatat supaya jelas galat itu muncul saat mengerjakan apa.
 */
export async function buka({ role = 'admin', lebar = 1440, tinggi = 900 } = {}) {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const ctx = await browser.newContext({
    viewport: { width: lebar, height: tinggi },
    deviceScaleFactor: 1,
    locale: 'id-ID',
  });
  const page = await ctx.newPage();

  const catatan = [];
  let langkah = 'mulai';
  const catat = (jenis, teks) => catatan.push({ langkah, jenis, teks });

  page.on('console', (m) => {
    if (m.type() === 'error') catat('konsol', m.text());
  });
  page.on('pageerror', (e) => catat('pengecualian', e.message));
  page.on('requestfailed', (r) => {
    const err = r.failure()?.errorText ?? '';
    /* Permintaan ke luar (font, telemetry Chrome) diblokir proxy — bukan bug aplikasi. */
    if (!r.url().startsWith(BASE)) return;
    catat('jaringan-gagal', `${r.method()} ${r.url().replace(BASE, '')} — ${err}`);
  });
  page.on('response', (r) => {
    if (r.status() >= 400 && r.url().startsWith(BASE)) {
      catat('http', `${r.status()} ${r.request().method()} ${r.url().replace(BASE, '')}`);
    }
  });

  const akun = AKUN[role];
  await page.goto(`${BASE}/login`);
  await page.waitForTimeout(1200);
  await page.locator('input').first().fill(akun.u);
  await page.fill('input[type="password"]', akun.p);
  await page.click('button[type="submit"]');
  await page.waitForTimeout(1800);

  return {
    page,
    catatan,
    /** Menandai langkah berikutnya, supaya galat punya konteks. */
    tandai: (nama) => {
      langkah = nama;
    },
    bidik: async (nama) => {
      await page.screenshot({ path: `/tmp/audit/${nama}.png`, fullPage: true });
    },
    tutup: () => browser.close(),
  };
}

/** Menampilkan catatan yang terkumpul, dikelompokkan menurut langkah. */
export function laporkan(judul, catatan) {
  console.log(`\n===== ${judul} =====`);
  if (catatan.length === 0) {
    console.log('bersih — tidak ada galat konsol, pengecualian, atau response 4xx/5xx');
    return;
  }
  const perLangkah = new Map();
  for (const c of catatan) {
    if (!perLangkah.has(c.langkah)) perLangkah.set(c.langkah, []);
    perLangkah.get(c.langkah).push(c);
  }
  for (const [langkah, daftar] of perLangkah) {
    console.log(`\n[${langkah}]`);
    for (const d of daftar) console.log(`  ${d.jenis}: ${d.teks}`);
  }
}
