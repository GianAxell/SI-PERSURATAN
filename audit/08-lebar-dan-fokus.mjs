import { BASE, buka, laporkan } from './harness.mjs';

/* ---------- dialog bertingkat: konfirmasi di atas modal disposisi ---------- */
{
  const { page, catatan, tandai, bidik, tutup } = await buka({ role: 'admin' });

  tandai('dialog bertingkat');
  await page.goto(`${BASE}/surat-masuk/134`);
  await page.waitForTimeout(1800);
  await page.getByRole('button', { name: /Disposisi/ }).first().click();
  await page.waitForTimeout(1400);
  await page.locator('[role="dialog"] button').filter({ hasText: /Budi Santoso/ }).first().click();
  await page.locator('[role="dialog"] textarea').first().fill('Uji dialog bertingkat');
  await page.getByRole('button', { name: 'Kirim Disposisi' }).click();
  await page.waitForTimeout(1000);
  console.log('jumlah dialog terbuka:', await page.locator('[role="dialog"]').count());

  /* Escape harus menutup konfirmasi saja, modal disposisi tetap terbuka
     dengan isian yang belum hilang. */
  await page.keyboard.press('Escape');
  await page.waitForTimeout(800);
  await bidik('dialog-sesudah-escape');
  const sisa = await page.locator('[role="dialog"]').count();
  const isiTextarea = await page.locator('[role="dialog"] textarea').first().inputValue().catch(() => '(tidak ada)');
  console.log('dialog tersisa:', sisa);
  console.log('instruksi masih terisi:', JSON.stringify(isiTextarea));
  console.log('penerima masih terpilih:', (await page.locator('[role="dialog"]').innerText()).includes('Dipilih'));

  laporkan('Dialog bertingkat', catatan);
  await tutup();
}

/* ---------- lebar layar 1280 dan 1024 ---------- */
for (const lebar of [1280, 1024]) {
  const { page, catatan, tandai, bidik, tutup } = await buka({ role: 'admin', lebar, tinggi: 800 });

  tandai(`lebar ${lebar}`);
  await page.goto(`${BASE}/surat-masuk`);
  await page.waitForTimeout(1800);
  await bidik(`lebar-${lebar}-daftar`);

  const geser = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  const lebarAside = await page
    .locator('aside')
    .first()
    .evaluate((e) => e.getBoundingClientRect().width);
  console.log(`${lebar}px · sidebar ${lebarAside}px · halaman menggeser mendatar: ${geser}`);

  tandai(`lebar ${lebar} detail`);
  await page.goto(`${BASE}/surat-masuk/134`);
  await page.waitForTimeout(1600);
  await bidik(`lebar-${lebar}-detail`);
  const geser2 = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  console.log(`${lebar}px · detail menggeser mendatar: ${geser2}`);

  laporkan(`Lebar ${lebar}`, catatan);
  await tutup();
}

/* ---------- panel pemberitahuan: tandai sudah dibaca ---------- */
{
  const { page, catatan, tandai, bidik, tutup } = await buka({ role: 'admin' });

  tandai('tandai sudah dibaca');
  await page.goto(`${BASE}/surat-masuk`);
  await page.waitForTimeout(1600);
  const lonceng = page.getByRole('button', { name: /Pemberitahuan/ });
  console.log('label lonceng sebelum:', await lonceng.getAttribute('aria-label'));
  await lonceng.click();
  await page.waitForTimeout(900);
  await page.getByRole('button', { name: /Tandai sudah dibaca/ }).click();
  await page.waitForTimeout(1500);
  await bidik('notifikasi-sesudah-dibaca');
  console.log('label lonceng sesudah:', await lonceng.getAttribute('aria-label'));

  laporkan('Panel pemberitahuan', catatan);
  await tutup();
}
