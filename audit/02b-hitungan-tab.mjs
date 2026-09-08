import { BASE, buka, laporkan } from './harness.mjs';

const { page, catatan, tandai, bidik, tutup } = await buka({ role: 'pegawai' });

/** Membaca angka pada tab langsung dari teks halaman. */
async function hitungan() {
  const isi = await page.locator('main').innerText();
  const ambil = (nama) => {
    const m = isi.match(new RegExp(`${nama}\\s*\\((\\d+)\\)`));
    return m ? Number(m[1]) : null;
  };
  return {
    semua: ambil('Semua'),
    belum: ambil('Belum Dibaca'),
    proses: ambil('Diproses'),
    selesai: ambil('Selesai'),
  };
}

tandai('sebelum membaca');
await page.goto(`${BASE}/disposisi-saya`);
await page.waitForTimeout(2000);
const sebelum = await hitungan();
console.log('sebelum:', JSON.stringify(sebelum));

tandai('buka satu disposisi belum dibaca');
await page.goto(`${BASE}/disposisi-saya?status=belum_dibaca`);
await page.waitForTimeout(1800);
const tautan = page.locator('a[href*="disposisi-saya/"]').first();
const href = await tautan.getAttribute('href');
console.log('membuka:', href);
await tautan.click();
await page.waitForTimeout(2500);
await bidik('tab-18-sesudah-baca');

tandai('kembali lewat tautan sidebar (bukan reload)');
await page.goBack();
await page.waitForTimeout(2000);
const sesudahKembali = await hitungan();
console.log('sesudah kembali:', JSON.stringify(sesudahKembali));

tandai('muat ulang penuh');
await page.goto(`${BASE}/disposisi-saya`);
await page.reload();
await page.waitForTimeout(2200);
const sesudahReload = await hitungan();
console.log('sesudah muat ulang:', JSON.stringify(sesudahReload));
await bidik('tab-sesudah-reload');

const turun =
  sesudahReload.belum !== null &&
  sebelum.belum !== null &&
  sesudahReload.belum === sebelum.belum - 1;
console.log(turun ? 'OK — angka Belum Dibaca turun satu' : 'PERIKSA — angka Belum Dibaca tidak turun');
console.log(
  sesudahKembali.belum === sesudahReload.belum
    ? 'OK — cache ikut tersegarkan tanpa reload'
    : `PERIKSA — tanpa reload masih ${sesudahKembali.belum}, setelah reload ${sesudahReload.belum}`,
);

laporkan('Hitungan tab layar 17', catatan);
await tutup();
