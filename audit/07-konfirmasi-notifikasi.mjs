import { BASE, buka, laporkan } from './harness.mjs';

/* ================= Admin: konfirmasi + notifikasi ================= */
{
  const { page, catatan, tandai, bidik, tutup } = await buka({ role: 'admin' });
  const toast = () => page.locator('[role="status"], [role="alert"]');

  /* ---------- 29 Profil ---------- */
  tandai('29 profil');
  await page.goto(`${BASE}/profil`);
  await page.waitForTimeout(1600);
  await bidik('29-profil');
  const isiProfil = await page.locator('main').innerText();
  console.log('profil memuat "Terakhir masuk":', /Terakhir masuk/.test(isiProfil));
  console.log('masih Placeholder:', /prototype Figma/.test(isiProfil));

  /* ---------- 03 konfirmasi registrasi ---------- */
  tandai('03 konfirmasi registrasi');
  await page.goto(`${BASE}/surat-masuk/baru`);
  await page.waitForTimeout(1500);
  await page.getByLabel(/Nomor surat/).fill('999/UJI/IX/2026');
  await page.getByLabel(/Tanggal surat/).fill('2026-09-08');
  await page.getByLabel(/^PIC/).fill('Seno Prianto');
  await page.getByLabel(/Perihal/).fill('Uji dialog konfirmasi');
  await page.getByLabel(/Pengirim/).fill('Institut Teknologi Garut');
  await page.locator('input[type="file"]').setInputFiles({
    name: 'uji.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from('%PDF-1.4\n1 0 obj\n<< >>\nendobj\ntrailer\n<< >>\n%%EOF'),
  });
  await page.waitForTimeout(600);
  await page.getByRole('button', { name: 'Simpan Surat' }).click();
  await page.waitForTimeout(1000);
  await bidik('03-konfirmasi');

  const dialog = page.locator('[role="dialog"]');
  console.log('judul dialog:', await dialog.locator('h2, [id]').first().innerText());
  console.log('rincian:\n' + (await dialog.innerText()).split('\n').map((b) => '    ' + b).join('\n'));

  /* "Periksa Lagi" harus mengembalikan ke formulir tanpa menyimpan apa pun. */
  tandai('03 tekan Periksa Lagi');
  await page.getByRole('button', { name: 'Periksa Lagi' }).click();
  await page.waitForTimeout(800);
  console.log('kembali ke formulir:', page.url().replace(BASE, ''));
  console.log('dialog tertutup:', (await dialog.count()) === 0);

  tandai('03 simpan sungguhan');
  await page.getByRole('button', { name: 'Simpan Surat' }).click();
  await page.waitForTimeout(900);
  await page.getByRole('button', { name: /Ya, Simpan Surat/ }).click();
  await page.waitForTimeout(2200);
  await bidik('03-notifikasi-sukses');
  console.log('URL sesudah simpan:', page.url().replace(BASE, ''));
  console.log('notifikasi:', (await toast().first().innerText().catch(() => '(tidak ada)')).replace(/\n/g, ' | '));

  /* ---------- notifikasi gagal: nomor ganda ---------- */
  tandai('03 notifikasi gagal');
  await page.goto(`${BASE}/surat-masuk/baru`);
  await page.waitForTimeout(1500);
  /* Nomor yang sudah ada sejak data contoh dimuat — memuat ulang halaman
     mengembalikan keadaan mock, jadi surat yang baru dibuat tidak bisa
     dipakai sebagai pembanding di sini. */
  await page.getByLabel(/Nomor surat/).fill('782/ITG/A.5/B/VII/2026');
  await page.getByLabel(/Tanggal surat/).fill('2026-09-08');
  await page.getByLabel(/^PIC/).fill('Seno Prianto');
  await page.getByLabel(/Perihal/).fill('Uji nomor ganda');
  await page.getByLabel(/Pengirim/).fill('Institut Teknologi Garut');
  await page.locator('input[type="file"]').setInputFiles({
    name: 'uji.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from('%PDF-1.4\n%%EOF'),
  });
  await page.waitForTimeout(500);
  await page.getByRole('button', { name: 'Simpan Surat' }).click();
  await page.waitForTimeout(900);
  await page.getByRole('button', { name: /Ya, Simpan Surat/ }).click();
  await page.waitForTimeout(2000);
  await bidik('03-notifikasi-gagal');
  console.log('notifikasi gagal:', (await toast().first().innerText().catch(() => '(tidak ada)')).replace(/\n/g, ' | '));

  /* ---------- 05 konfirmasi disposisi ---------- */
  tandai('05 konfirmasi disposisi');
  await page.goto(`${BASE}/surat-masuk`);
  await page.waitForTimeout(1600);
  await page.locator('tbody tr').first().click();
  await page.waitForTimeout(1800);
  await page.getByRole('button', { name: /Disposisi/ }).first().click();
  await page.waitForTimeout(1500);
  await page.locator('[role="dialog"] button').filter({ hasText: /Budi Santoso/ }).first().click();
  await page.locator('[role="dialog"] textarea').first().fill('Mohon ditindaklanjuti minggu ini');
  await page.waitForTimeout(400);
  await page.getByRole('button', { name: 'Kirim Disposisi' }).click();
  await page.waitForTimeout(1200);
  await bidik('05-konfirmasi');
  const dlgDisposisi = page.locator('[role="dialog"]').filter({ hasText: 'Kirim disposisi ini?' });
  console.log('dialog disposisi tampil:', await dlgDisposisi.count());
  console.log('isi:\n' + (await dlgDisposisi.innerText().catch(() => '-')).split('\n').map((b) => '    ' + b).join('\n'));

  await page.getByRole('button', { name: /Ya, Kirim Disposisi/ }).click();
  await page.waitForTimeout(2200);
  await bidik('05-notifikasi');
  console.log('notifikasi disposisi:', (await toast().first().innerText().catch(() => '(tidak ada)')).replace(/\n/g, ' | '));

  /* ---------- 10 konfirmasi terbitkan surat keluar ---------- */
  tandai('10 konfirmasi terbit');
  await page.goto(`${BASE}/surat-keluar/baru`);
  await page.waitForTimeout(1600);
  await page.getByRole('button', { name: 'Keuangan' }).click();
  await page.waitForTimeout(800);
  await page.getByRole('button', { name: /^Invoice\b/ }).first().click();
  await page.waitForTimeout(700);
  await page.getByRole('button', { name: 'Invoice Standar' }).click();
  await page.waitForTimeout(500);
  await page.getByRole('button', { name: /Lanjut isi data/ }).click();
  await page.waitForTimeout(1500);
  await page.getByLabel(/Kepada/).fill('PT Fiber Media Indonesia');
  await page.getByLabel(/^Perihal/).fill('Invoice Termin V');
  await page.getByLabel(/Tanggal surat/).fill('2026-09-08');
  await page.getByLabel(/PIC/).fill('Riski Ramadhan');
  await page.getByLabel(/Nilai tagihan/).fill('21000000');
  await page.getByLabel(/Isi surat/).fill('Tagihan termin kelima.');
  await page.getByRole('button', { name: /Lanjut ke pratinjau/ }).click();
  await page.waitForTimeout(1400);
  await page.getByRole('button', { name: 'Buat Surat' }).click();
  await page.waitForTimeout(1200);
  await bidik('10-konfirmasi');
  const dlgKeluar = page.locator('[role="dialog"]').filter({ hasText: 'Terbitkan surat keluar ini?' });
  console.log('dialog terbit tampil:', await dlgKeluar.count());
  console.log('isi:\n' + (await dlgKeluar.innerText().catch(() => '-')).split('\n').map((b) => '    ' + b).join('\n'));

  await page.getByRole('button', { name: /Ya, Terbitkan Surat/ }).click();
  await page.waitForTimeout(2400);
  await bidik('10-notifikasi');
  console.log('notifikasi terbit:', (await toast().first().innerText().catch(() => '(tidak ada)')).replace(/\n/g, ' | '));

  laporkan('Konfirmasi & notifikasi — Admin', catatan);
  await tutup();
}

/* ================= Pegawai: ubah kata sandi ================= */
{
  const { page, catatan, tandai, bidik, tutup } = await buka({ role: 'pegawai' });
  const toast = () => page.locator('[role="status"], [role="alert"]');

  tandai('30 kata sandi lama salah');
  await page.goto(`${BASE}/ubah-kata-sandi`);
  await page.waitForTimeout(1600);
  await bidik('30-form');
  await page.getByLabel(/Kata sandi saat ini/).fill('salahsekali');
  await page.getByLabel(/^Kata sandi baru/).fill('rahasiabaru1');
  await page.getByLabel(/Ulangi kata sandi baru/).fill('rahasiabaru1');
  await page.getByRole('button', { name: 'Simpan Kata Sandi' }).click();
  await page.waitForTimeout(900);
  await page.getByRole('button', { name: /Ya, Ubah Kata Sandi/ }).click();
  await page.waitForTimeout(2000);
  await bidik('30-gagal');
  console.log('notifikasi gagal:', (await toast().first().innerText().catch(() => '(tidak ada)')).replace(/\n/g, ' | '));
  const galatKolom = await page.locator('p.text-note.text-st-merah-fg').allInnerTexts();
  console.log('galat per kolom:', JSON.stringify(galatKolom));

  tandai('30 validasi klien');
  await page.getByLabel(/Kata sandi saat ini/).fill('pegawai123');
  await page.getByLabel(/^Kata sandi baru/).fill('pendek');
  await page.getByLabel(/Ulangi kata sandi baru/).fill('beda');
  await page.getByRole('button', { name: 'Simpan Kata Sandi' }).click();
  await page.waitForTimeout(800);
  console.log('validasi klien:', JSON.stringify(await page.locator('p.text-note.text-st-merah-fg').allInnerTexts()));
  console.log('dialog tidak muncul:', (await page.locator('[role="dialog"]').count()) === 0);

  tandai('30 berhasil');
  await page.getByLabel(/^Kata sandi baru/).fill('rahasiabaru1');
  await page.getByLabel(/Ulangi kata sandi baru/).fill('rahasiabaru1');
  await page.getByRole('button', { name: 'Simpan Kata Sandi' }).click();
  await page.waitForTimeout(900);
  await bidik('30-konfirmasi');
  await page.getByRole('button', { name: /Ya, Ubah Kata Sandi/ }).click();
  await page.waitForTimeout(2000);
  await bidik('30-sukses');
  console.log('notifikasi sukses:', (await toast().first().innerText().catch(() => '(tidak ada)')).replace(/\n/g, ' | '));

  laporkan('Ubah kata sandi — Pegawai', catatan);
  await tutup();
}
