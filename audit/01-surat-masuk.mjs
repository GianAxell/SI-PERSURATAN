import { BASE, buka, laporkan } from './harness.mjs';

const { page, catatan, tandai, bidik, tutup } = await buka({ role: 'admin' });
const teks = async (sel) => (await page.locator(sel).first().innerText().catch(() => '')).trim();

/* ---------- 02 daftar ---------- */
tandai('02 daftar');
await page.goto(`${BASE}/surat-masuk`);
await page.waitForTimeout(1500);
await bidik('02-daftar');
console.log('info baris:', await teks('text=/Menampilkan/'));

/* ---------- 02 pencarian ---------- */
tandai('02 cari "kerja praktik"');
await page.getByPlaceholder(/Cari nomor surat/).fill('kerja praktik');
await page.waitForTimeout(1500);
console.log('hasil cari:', await teks('text=/Menampilkan/'));

/* ---------- 26 tidak ada hasil ---------- */
tandai('26 filter tanpa hasil');
await page.getByPlaceholder(/Cari nomor surat/).fill('zzzqqq tidak ada');
await page.waitForTimeout(1500);
await bidik('26-tanpa-hasil');
console.log('empty state:', await teks('h3, [role="heading"]'));

tandai('26 hapus filter');
await page.getByRole('button', { name: 'Hapus filter' }).click();
await page.waitForTimeout(1500);
console.log('setelah hapus filter, URL:', page.url().replace(BASE, ''));

/* ---------- filter status ---------- */
tandai('02 filter status Selesai');
await page.getByRole('button', { name: /Status disposisi/ }).click();
await page.waitForTimeout(400);
await page.getByRole('button', { name: 'Selesai', exact: true }).click();
await page.waitForTimeout(1500);
console.log('URL filter status:', page.url().replace(BASE, ''));
console.log('hasil:', await teks('text=/Menampilkan/'));

tandai('02 filter belum didisposisi');
await page.getByRole('button', { name: /Selesai/ }).first().click();
await page.waitForTimeout(400);
await page.getByRole('button', { name: 'Belum Didisposisi' }).click();
await page.waitForTimeout(1500);
console.log('hasil belum didisposisi:', await teks('text=/Menampilkan/'));

/* ---------- 39 halaman 2 ---------- */
tandai('39 halaman 2');
await page.goto(`${BASE}/surat-masuk`);
await page.waitForTimeout(1500);
await page.getByRole('button', { name: '2', exact: true }).click();
await page.waitForTimeout(1500);
await bidik('39-halaman-2');
console.log('URL halaman 2:', page.url().replace(BASE, ''));
console.log('hasil:', await teks('text=/Menampilkan/'));

/* ---------- muat ulang di halaman 2: filter harus bertahan ---------- */
tandai('39 muat ulang di halaman 2');
await page.reload();
await page.waitForTimeout(1800);
console.log('setelah reload:', await teks('text=/Menampilkan/'));

/* ---------- 03 registrasi: validasi kosong ---------- */
tandai('03 kirim form kosong');
await page.goto(`${BASE}/surat-masuk/baru`);
await page.waitForTimeout(1500);
await bidik('03-form-kosong');
await page.getByRole('button', { name: /Simpan|Registrasi/ }).last().click();
await page.waitForTimeout(1200);
await bidik('03-validasi');
const galat = await page.locator('p.text-note.text-st-merah-fg, [role="alert"]').allInnerTexts();
console.log('pesan validasi:', JSON.stringify(galat));

/* ---------- 04 detail ---------- */
tandai('04 detail');
await page.goto(`${BASE}/surat-masuk`);
await page.waitForTimeout(1500);
await page.locator('tbody tr').first().click();
await page.waitForTimeout(1800);
await bidik('04-detail');
console.log('URL detail:', page.url().replace(BASE, ''));

/* ---------- 35 pratinjau PDF ---------- */
tandai('35 pratinjau PDF');
await page.getByRole('button', { name: /Pratinjau/ }).first().click();
await page.waitForTimeout(2500);
await bidik('35-pratinjau');
const adaIframe = await page.locator('iframe').count();
console.log('iframe pratinjau:', adaIframe);
await page.keyboard.press('Escape');
await page.waitForTimeout(800);

/* ---------- 05 modal buat disposisi ---------- */
tandai('05 modal disposisi');
const tombolDisposisi = page.getByRole('button', { name: /Disposisi|Buat Disposisi/ }).first();
if (await tombolDisposisi.count()) {
  await tombolDisposisi.click();
  await page.waitForTimeout(1500);
  await bidik('05-modal-disposisi');
  const opsi = await page.locator('[role="dialog"] button, [role="dialog"] [role="option"]').count();
  console.log('elemen dalam modal disposisi:', opsi);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(600);
} else {
  console.log('TOMBOL DISPOSISI TIDAK DITEMUKAN');
}

/* ---------- 12 modal tandai balasan ---------- */
tandai('12 modal tandai balasan');
const tombolTautkan = page.getByRole('button', { name: /Tandai|Tautkan|Balasan/ }).first();
if (await tombolTautkan.count()) {
  await tombolTautkan.click();
  await page.waitForTimeout(1800);
  await bidik('12-modal-balasan');
  console.log('isi modal balasan ada:', await page.locator('[role="dialog"]').count());
  await page.keyboard.press('Escape');
} else {
  console.log('TOMBOL TANDAI BALASAN TIDAK DITEMUKAN');
}

laporkan('Surat Masuk', catatan);
await tutup();
