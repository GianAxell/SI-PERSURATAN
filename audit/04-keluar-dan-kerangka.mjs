import { BASE, buka, laporkan } from './harness.mjs';

const { page, catatan, tandai, bidik, tutup } = await buka({ role: 'admin' });
const teks = async (sel) => (await page.locator(sel).first().innerText().catch(() => '')).trim();

/* ---------- 07 daftar + filter bertingkat ---------- */
tandai('07 daftar surat keluar');
await page.goto(`${BASE}/surat-keluar`);
await page.waitForTimeout(1800);
console.log('total:', await teks('text=/Menampilkan/'));

tandai('07 filter bagian lalu jenis');
await page.getByRole('button', { name: /^Bagian/ }).click();
await page.waitForTimeout(400);
await page.getByRole('button', { name: /FIN — Keuangan/ }).click();
await page.waitForTimeout(1500);
console.log('setelah filter FIN:', await teks('text=/Menampilkan/'), '| URL', page.url().replace(BASE, ''));

await page.getByRole('button', { name: /^Jenis surat/ }).click();
await page.waitForTimeout(400);
const opsiJenis = page.locator('[role="dialog"], [data-radix-popper-content-wrapper]').getByRole('button');
const jumlahJenis = await opsiJenis.count();
console.log('opsi jenis surat setelah bagian FIN dipilih:', jumlahJenis);
await opsiJenis.nth(2).click();
await page.waitForTimeout(1500);
console.log('setelah filter jenis:', await teks('text=/Menampilkan/'), '| URL', page.url().replace(BASE, ''));
await bidik('07-filter-bertingkat');

/* Ganti bagian: filter jenis harus ikut lepas, bukan tertinggal. */
tandai('07 ganti bagian, jenis harus lepas');
await page.getByRole('button', { name: /FIN — Keuangan/ }).first().click();
await page.waitForTimeout(400);
await page.getByRole('button', { name: /HR — Personalia/ }).click();
await page.waitForTimeout(1500);
console.log('URL setelah ganti bagian:', page.url().replace(BASE, ''));
console.log('hasil:', await teks('text=/Menampilkan/'));

tandai('07 filter tanpa hasil');
await page.goto(`${BASE}/surat-keluar?q=tidakadasamasekali`);
await page.waitForTimeout(1600);
await bidik('07-kosong');
console.log('empty state:', (await teks('main')).slice(0, 90).replace(/\n/g, ' | '));

/* ---------- 08 wizard: template nonaktif tidak boleh muncul ---------- */
tandai('08 template nonaktif');
await page.goto(`${BASE}/surat-keluar/baru`);
await page.waitForTimeout(1600);
await page.getByRole('button', { name: 'Keuangan' }).click();
await page.waitForTimeout(900);
await page.getByRole('button', { name: /^Invoice\b/ }).first().click();
await page.waitForTimeout(900);
const isiKolom = await teks('main');
console.log(
  'template "Invoice Termin Proyek" (nonaktif) muncul:',
  isiKolom.includes('Invoice Termin Proyek'),
);
await bidik('08-template-aktif-saja');

/* ---------- 08 refresh di tengah wizard ---------- */
tandai('08 muat ulang di langkah 2');
await page.getByRole('button', { name: 'Invoice Standar' }).click();
await page.waitForTimeout(500);
await page.getByRole('button', { name: /Lanjut isi data/ }).click();
await page.waitForTimeout(1500);
const urlLangkah2 = page.url().replace(BASE, '');
await page.reload();
await page.waitForTimeout(2000);
console.log('URL sebelum reload:', urlLangkah2);
console.log('URL sesudah reload:', page.url().replace(BASE, ''));
console.log('masih di langkah 2:', (await teks('main')).includes('Isi data'));

/* ---------- 20 sidebar tertutup ---------- */
tandai('20 sidebar tertutup admin');
await page.goto(`${BASE}/surat-keluar`);
await page.waitForTimeout(1500);
const toggle = page.locator('button[aria-label*="idebar"], header button, aside button').first();
await toggle.click();
await page.waitForTimeout(900);
await bidik('20-sidebar-tertutup');
const lebarAside = await page.locator('aside').first().evaluate((e) => e.getBoundingClientRect().width);
console.log('lebar sidebar setelah ditutup:', lebarAside);
await toggle.click();
await page.waitForTimeout(700);

/* ---------- overlay pemberitahuan & menu akun ---------- */
tandai('overlay pemberitahuan');
const lonceng = page.locator('header button').first();
await lonceng.click();
await page.waitForTimeout(1200);
await bidik('overlay-notifikasi');
console.log('panel notifikasi:', (await teks('[data-radix-popper-content-wrapper]')).slice(0, 80).replace(/\n/g, ' | '));
await page.keyboard.press('Escape');
await page.waitForTimeout(600);

tandai('overlay menu akun');
await page.locator('header button').last().click();
await page.waitForTimeout(1000);
await bidik('overlay-menu-akun');
console.log('menu akun:', (await teks('[data-radix-popper-content-wrapper]')).replace(/\n/g, ' | '));

laporkan('Surat Keluar & kerangka', catatan);
await tutup();
