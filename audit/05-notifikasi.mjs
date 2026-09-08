import { BASE, buka, laporkan } from './harness.mjs';

/* Setiap notifikasi diklik satu per satu; semuanya harus mendarat di halaman
   yang benar-benar ada, bukan di "tidak ditemukan". */
for (const role of ['admin', 'pegawai']) {
  const { page, catatan, tandai, bidik, tutup } = await buka({ role });
  const awal = role === 'admin' ? `${BASE}/surat-masuk` : `${BASE}/disposisi-saya`;

  await page.goto(awal);
  await page.waitForTimeout(1600);

  const lonceng = page.getByRole('button', { name: /Pemberitahuan/ });
  await lonceng.click();
  await page.waitForTimeout(1000);
  await bidik(`notifikasi-${role}`);

  const panel = page.locator('[data-radix-popper-content-wrapper]');
  const baris = panel.locator('button').filter({ hasNotText: 'Tandai sudah dibaca' });
  const jumlah = await baris.count();
  console.log(`\n${role}: ${jumlah} notifikasi`);

  for (let i = 0; i < jumlah; i++) {
    tandai(`${role} notifikasi #${i + 1}`);
    await page.goto(awal);
    await page.waitForTimeout(1400);
    await lonceng.click();
    await page.waitForTimeout(800);

    const item = panel.locator('button').filter({ hasNotText: 'Tandai sudah dibaca' }).nth(i);
    const label = (await item.innerText()).split('\n').slice(0, 2).join(' — ');
    await item.click();
    await page.waitForTimeout(2000);

    const isi = await page.locator('main').innerText();
    const hilang = /tidak ditemukan|Tidak ditemukan/.test(isi);
    console.log(
      `  ${hilang ? 'RUSAK' : 'ok   '} → ${page.url().replace(BASE, '').padEnd(24)} ${label}`,
    );
    if (hilang) await bidik(`notifikasi-rusak-${role}-${i}`);
  }

  laporkan(`Notifikasi — ${role}`, catatan);
  await tutup();
}
