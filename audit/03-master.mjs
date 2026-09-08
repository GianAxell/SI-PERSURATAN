import { BASE, buka, laporkan } from './harness.mjs';

const { page, catatan, tandai, bidik, tutup } = await buka({ role: 'admin' });
const isi = () => page.locator('main').innerText();
const galatTampil = () =>
  page.locator('p.text-note.text-st-merah-fg, [role="alert"]').allInnerTexts();

/* ---------- 13 Pengguna ---------- */
tandai('13 daftar pengguna');
await page.goto(`${BASE}/master/pengguna`);
await page.waitForTimeout(1800);
await bidik('13-pengguna');
console.log('baris pengguna:', await page.locator('tbody tr').count());

tandai('23 form tambah pengguna');
await page.getByRole('button', { name: /Tambah Pengguna/ }).click();
await page.waitForTimeout(1200);
await bidik('23-form-pengguna');

tandai('23 kirim kosong');
await page.getByRole('button', { name: /^Simpan/ }).last().click();
await page.waitForTimeout(1000);
console.log('validasi pengguna kosong:', JSON.stringify(await galatTampil()));

tandai('23 username ganda');
await page.getByLabel(/Nama/).first().fill('Uji Ganda');
await page.getByLabel(/Nama pengguna|Username/).fill('rina.marlina');
const sandi = page.getByLabel(/Kata sandi|Password/);
if (await sandi.count()) await sandi.fill('rahasia123');
await page.getByRole('button', { name: /^Simpan/ }).last().click();
await page.waitForTimeout(1600);
await bidik('23-username-ganda');
console.log('pesan username ganda:', JSON.stringify(await galatTampil()));
await page.keyboard.press('Escape');
await page.waitForTimeout(600);

/* ---------- 24 konfirmasi nonaktifkan ---------- */
tandai('24 nonaktifkan pengguna');
const tombolNonaktif = page.getByRole('button', { name: /Nonaktifkan/ }).first();
if (await tombolNonaktif.count()) {
  await tombolNonaktif.click();
  await page.waitForTimeout(1200);
  await bidik('24-konfirmasi-nonaktif');
  console.log('dialog konfirmasi:', await page.locator('[role="dialog"]').count());
  const konfirm = page.locator('[role="dialog"]').getByRole('button', { name: /Nonaktifkan/ });
  if (await konfirm.count()) {
    await konfirm.click();
    await page.waitForTimeout(1600);
    console.log('status setelah nonaktif tersimpan');
  }
} else {
  console.log('TOMBOL NONAKTIFKAN TIDAK DITEMUKAN');
}

/* ---------- 21 Pegawai ---------- */
tandai('21 daftar pegawai');
await page.goto(`${BASE}/master/pegawai`);
await page.waitForTimeout(1800);
await bidik('21-pegawai');
console.log('baris pegawai:', await page.locator('tbody tr').count());

tandai('34 form pegawai');
await page.getByRole('button', { name: /Tambah Pegawai/ }).click();
await page.waitForTimeout(1200);
await bidik('34-form-pegawai');
await page.keyboard.press('Escape');
await page.waitForTimeout(600);

/* ---------- 22 Bagian ---------- */
tandai('22 daftar bagian');
await page.goto(`${BASE}/master/bagian`);
await page.waitForTimeout(1800);
await bidik('22-bagian');

tandai('32 form bagian: kode ganda');
const tambahBagian = page.getByRole('button', { name: /Tambah Bagian/ }).first();
if (await tambahBagian.count()) {
  await tambahBagian.click();
  await page.waitForTimeout(1000);
  await page.getByLabel(/Kode/).fill('FIN');
  await page.getByLabel(/Nama/).fill('Duplikat Keuangan');
  await page.getByRole('button', { name: /^Simpan/ }).last().click();
  await page.waitForTimeout(1600);
  await bidik('32-kode-ganda');
  console.log('pesan kode bagian ganda:', JSON.stringify(await galatTampil()));
  await page.keyboard.press('Escape');
} else {
  console.log('TOMBOL TAMBAH BAGIAN TIDAK DITEMUKAN');
}

/* ---------- 14 Jenis surat ---------- */
tandai('14 jenis surat');
await page.goto(`${BASE}/master/jenis-surat`);
await page.waitForTimeout(2000);
await bidik('14-jenis-surat');
const t14 = await isi();
console.log('ada kolom template:', /[Tt]emplate/.test(t14));

tandai('14 pilih bagian lain');
const bagianHR = page.getByRole('button', { name: /Personalia|HR/ }).first();
if (await bagianHR.count()) {
  await bagianHR.click();
  await page.waitForTimeout(1500);
  await bidik('14-bagian-hr');
  console.log('setelah pilih HR, URL:', page.url().replace(BASE, ''));
}

/* ---------- 15 Template ---------- */
tandai('15 template');
await page.goto(`${BASE}/master/template`);
await page.waitForTimeout(2000);
await bidik('15-template');
console.log('jumlah template terdaftar:', await page.locator('button').filter({ hasText: /\d+ field/ }).count());

tandai('33 ubah field');
const ubahField = page.getByRole('button', { name: /^Ubah$/ }).first();
if (await ubahField.count()) {
  await ubahField.click();
  await page.waitForTimeout(1200);
  await bidik('33-form-field');
  console.log('dialog field:', await page.locator('[role="dialog"]').count());
  await page.keyboard.press('Escape');
} else {
  console.log('TOMBOL UBAH FIELD TIDAK DITEMUKAN');
}

/* ---------- 16 Penomoran ---------- */
tandai('16 penomoran');
await page.goto(`${BASE}/master/penomoran`);
await page.waitForTimeout(1800);
await bidik('16-penomoran');

tandai('16 pola tanpa {urut}');
const pola = page.getByLabel(/Pola/);
await pola.fill('{bagian}.{kode}/{perusahaan}/{tahun}');
await page.waitForTimeout(400);
await page.getByRole('button', { name: /^Simpan$/ }).click();
await page.waitForTimeout(1200);
await bidik('16-pola-salah');
console.log('pesan pola salah:', JSON.stringify(await galatTampil()));

laporkan('Data Master', catatan);
await tutup();
