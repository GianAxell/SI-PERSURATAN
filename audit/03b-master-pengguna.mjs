import { BASE, buka, laporkan } from './harness.mjs';

const { page, catatan, tandai, bidik, tutup } = await buka({ role: 'admin' });
const galatTampil = () =>
  page.locator('p.text-note.text-st-merah-fg, [role="alert"]').allInnerTexts();

/* ---------- 23 username ganda (kali ini ulangan kata sandi ikut diisi) ---------- */
tandai('23 username ganda');
await page.goto(`${BASE}/master/pengguna`);
await page.waitForTimeout(1800);
await page.getByRole('button', { name: /Tambah Pengguna/ }).click();
await page.waitForTimeout(1200);

const modal = page.locator('[role="dialog"]');
await modal.getByLabel('Nama lengkap').fill('Uji Ganda');
await modal.getByLabel('Nama pengguna').fill('rina.marlina');
await modal.getByLabel(/Kata sandi awal/).fill('rahasia123');
await modal.getByLabel(/Ulangi kata sandi/).fill('rahasia123');
await page.getByRole('button', { name: /^Simpan/ }).last().click();
await page.waitForTimeout(1800);
await bidik('23-username-ganda');
console.log('pesan username ganda:', JSON.stringify(await galatTampil()));
await page.keyboard.press('Escape');
await page.waitForTimeout(800);

/* ---------- 24 konfirmasi nonaktifkan (tombolnya di dalam form ubah) ---------- */
tandai('24 nonaktifkan lewat form ubah');
const barisAktif = page
  .locator('tbody tr')
  .filter({ hasText: 'Aktif' })
  .filter({ hasNotText: 'Nonaktif' })
  .first();
const namaBaris = await barisAktif.locator('td').first().innerText();
console.log('mengubah pengguna:', namaBaris.trim());

await barisAktif.getByRole('button', { name: 'Ubah' }).click();
await page.waitForTimeout(1200);
await bidik('23-form-ubah');

const tombolNonaktif = page.getByRole('button', { name: /Nonaktifkan pengguna/ });
if (!(await tombolNonaktif.count())) {
  console.log('TOMBOL "Nonaktifkan pengguna" TIDAK ADA DI FORM UBAH');
} else {
  await tombolNonaktif.click();
  await page.waitForTimeout(1000);
  await bidik('24-konfirmasi');
  const dialog = page.locator('[role="dialog"]').filter({ hasText: /Nonaktifkan pengguna ini/ });
  console.log('dialog konfirmasi tampil:', await dialog.count());

  await page.getByRole('button', { name: 'Nonaktifkan', exact: true }).last().click();
  await page.waitForTimeout(2000);
  await bidik('24-sesudah');

  const isiTabel = await page.locator('tbody').innerText();
  const baris = isiTabel.split('\n').filter((b) => b.includes(namaBaris.trim().split('\n')[0]));
  console.log('baris setelah dinonaktifkan:', JSON.stringify(baris.slice(0, 2)));
}

/* ---------- login dengan akun nonaktif harus ditolak ---------- */
tandai('27 login akun nonaktif');
await page.goto(`${BASE}/master/pengguna`);
await page.waitForTimeout(1500);
const isiTabel = await page.locator('tbody').innerText();
console.log('ringkas tabel:\n' + isiTabel.split('\n').slice(0, 12).join('\n'));

laporkan('Data Master — Pengguna', catatan);
await tutup();
