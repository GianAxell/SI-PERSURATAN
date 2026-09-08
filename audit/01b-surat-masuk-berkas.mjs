import { BASE, buka, laporkan } from './harness.mjs';

const { page, catatan, tandai, bidik, tutup } = await buka({ role: 'admin' });

/* Semua kolom teks diisi, berkas sengaja tidak diunggah. Kontrak K-13
   mewajibkan satu PDF, jadi form harus menahan atau menampilkan galatnya. */
tandai('03 semua terisi tanpa berkas');
await page.goto(`${BASE}/surat-masuk/baru`);
await page.waitForTimeout(1500);

await page.getByLabel(/Nomor surat/).fill('999/UJI/IX/2026');
await page.getByLabel(/Tanggal surat/).fill('2026-09-08');
await page.getByLabel(/^PIC/).fill('Seno Prianto');
await page.getByLabel(/Perihal/).fill('Uji berkas wajib');
await page.getByLabel(/Pengirim/).fill('Institut Teknologi Garut');
await page.waitForTimeout(300);

await page.getByRole('button', { name: 'Simpan Surat' }).click();
await page.waitForTimeout(2000);
await bidik('03-tanpa-berkas');

console.log('URL setelah kirim:', page.url().replace(BASE, ''));
const pesan = await page
  .locator('p.text-note.text-st-merah-fg, [role="alert"]')
  .allInnerTexts();
console.log('pesan yang tampil:', JSON.stringify(pesan));

/* ---------- nomor surat ganda (409 dari server) ---------- */
tandai('03 nomor surat ganda');
await page.goto(`${BASE}/surat-masuk`);
await page.waitForTimeout(1500);
const nomorAda = await page.locator('tbody tr').first().locator('td').nth(1).innerText();
console.log('nomor yang sudah terdaftar:', nomorAda.trim());

await page.goto(`${BASE}/surat-masuk/baru`);
await page.waitForTimeout(1500);
await page.getByLabel(/Nomor surat/).fill(nomorAda.trim());
await page.getByLabel(/Tanggal surat/).fill('2026-09-08');
await page.getByLabel(/^PIC/).fill('Seno Prianto');
await page.getByLabel(/Perihal/).fill('Uji nomor ganda');
await page.getByLabel(/Pengirim/).fill('Institut Teknologi Garut');

/* Unggah PDF sungguhan supaya yang diuji benar-benar penolakan nomor ganda. */
await page.locator('input[type="file"]').setInputFiles({
  name: 'uji.pdf',
  mimeType: 'application/pdf',
  buffer: Buffer.from('%PDF-1.4\n1 0 obj\n<< >>\nendobj\ntrailer\n<< >>\n%%EOF'),
});
await page.waitForTimeout(800);
await bidik('03-berkas-terunggah');

await page.getByRole('button', { name: 'Simpan Surat' }).click();
await page.waitForTimeout(900);
/* Sejak konfirmasi dipasang, Simpan membuka dialog dulu — permintaan baru
   terkirim setelah tombol di dalamnya ditekan. */
await page.getByRole('button', { name: /Ya, Simpan Surat/ }).click();
await page.waitForTimeout(2200);
await bidik('03-nomor-ganda');
const pesan2 = await page
  .locator('p.text-note.text-st-merah-fg, [role="alert"]')
  .allInnerTexts();
console.log('pesan nomor ganda:', JSON.stringify(pesan2));
console.log('URL:', page.url().replace(BASE, ''));

laporkan('Surat Masuk — berkas & nomor ganda', catatan);
await tutup();
