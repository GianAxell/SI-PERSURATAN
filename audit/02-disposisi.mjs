import { BASE, buka, laporkan } from './harness.mjs';

/* ================= sisi Admin: layar 06 ================= */
{
  const { page, catatan, tandai, bidik, tutup } = await buka({ role: 'admin' });

  tandai('06 riwayat disposisi admin');
  await page.goto(`${BASE}/disposisi`);
  await page.waitForTimeout(2000);
  await bidik('06-riwayat-admin');
  console.log('judul:', await page.locator('h1, h2').first().innerText().catch(() => '-'));

  tandai('06 pilih satu disposisi');
  const item = page.locator('button, li').filter({ hasText: /\d{4}\/2026/ }).first();
  if (await item.count()) {
    await item.click();
    await page.waitForTimeout(1800);
    await bidik('06-jejak-terpilih');
    const jejak = await page.locator('text=/Belum Dibaca|Diproses|Selesai/').count();
    console.log('penanda status pada jejak:', jejak);
  } else {
    console.log('TIDAK ADA ITEM DISPOSISI YANG BISA DIPILIH');
  }

  laporkan('Disposisi — Admin (06)', catatan);
  await tutup();
}

/* ================= sisi Pegawai: 17, 36-38, 18, 19 ================= */
{
  const { page, catatan, tandai, bidik, tutup } = await buka({ role: 'pegawai' });
  const teks = async (sel) =>
    (await page.locator(sel).first().innerText().catch(() => '')).trim();

  tandai('17 disposisi saya');
  await page.goto(`${BASE}/disposisi-saya`);
  await page.waitForTimeout(2000);
  await bidik('17-disposisi-saya');

  const tab = await page.locator('nav button, [role="tab"], a').allInnerTexts();
  console.log('tab:', JSON.stringify(tab.filter((t) => /\(\d+\)/.test(t))));

  /* Angka pada tab harus dihitung terhadap seluruh data pegawai, bukan
     halaman yang sedang tampil (§5.4 kontrak). */
  for (const nama of ['Belum Dibaca', 'Diproses', 'Selesai']) {
    tandai(`3x tab ${nama}`);
    const tombol = page.getByRole('button', { name: new RegExp(nama) }).first();
    if (!(await tombol.count())) {
      console.log(`TAB ${nama} TIDAK DITEMUKAN`);
      continue;
    }
    await tombol.click();
    await page.waitForTimeout(1600);
    const kartu = await page.locator('article, [data-kartu], a[href*="disposisi-saya/"]').count();
    console.log(`tab ${nama}: URL=${page.url().replace(BASE, '')} kartu=${kartu}`);
    await bidik(`tab-${nama.toLowerCase().replace(' ', '-')}`);
  }

  /* ---------- 18 detail + transisi baca ---------- */
  tandai('18 detail disposisi');
  await page.goto(`${BASE}/disposisi-saya?status=belum_dibaca`);
  await page.waitForTimeout(1800);
  const kartuPertama = page.locator('a[href*="disposisi-saya/"]').first();
  if (await kartuPertama.count()) {
    await kartuPertama.click();
    await page.waitForTimeout(2200);
    await bidik('18-detail');
    console.log('URL detail:', page.url().replace(BASE, ''));
    const status = await teks('text=/Belum Dibaca|Diproses|Selesai/');
    console.log('status setelah dibuka (harus sudah Diproses):', status);

    tandai('18 kembali ke daftar, angka tab harus turun');
    await page.goto(`${BASE}/disposisi-saya`);
    await page.waitForTimeout(1800);
    const tab2 = await page.locator('nav button, [role="tab"], a').allInnerTexts();
    console.log('tab sesudah dibaca:', JSON.stringify(tab2.filter((t) => /\(\d+\)/.test(t))));
  } else {
    console.log('TIDAK ADA DISPOSISI BELUM DIBACA');
  }

  /* ---------- 19 riwayat ---------- */
  tandai('19 riwayat pegawai');
  await page.goto(`${BASE}/riwayat`);
  await page.waitForTimeout(2000);
  await bidik('19-riwayat');
  console.log('info baris riwayat:', await teks('text=/Menampilkan/'));

  tandai('19 cari');
  const cari = page.getByPlaceholder(/Cari/).first();
  if (await cari.count()) {
    await cari.fill('permohonan');
    await page.waitForTimeout(1600);
    console.log('hasil cari riwayat:', await teks('text=/Menampilkan/'));
  }

  /* ---------- guard role ---------- */
  tandai('guard: pegawai membuka /surat-masuk');
  await page.goto(`${BASE}/surat-masuk`);
  await page.waitForTimeout(1600);
  await bidik('guard-pegawai');
  console.log('URL akhir:', page.url().replace(BASE, ''));
  console.log('isi:', (await teks('main')).slice(0, 120));

  laporkan('Disposisi — Pegawai (17, 18, 19, 36-38)', catatan);
  await tutup();
}
