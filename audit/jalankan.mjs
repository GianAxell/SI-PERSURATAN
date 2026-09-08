import { spawnSync } from 'node:child_process';

/*
 * Penelusuran otomatis seluruh layar di atas MSW. Bukan pengganti unit test —
 * tujuannya menangkap yang paling mahal kalau lolos: halaman yang melempar
 * pengecualian, tautan yang mendarat di "tidak ditemukan", dan aturan yang
 * dijaga di satu endpoint tetapi bocor di endpoint lain.
 *
 * Jalankan `npm run dev` lebih dulu, lalu `npm run audit`.
 */

const BERKAS = [
  '01-surat-masuk.mjs',
  '01b-surat-masuk-berkas.mjs',
  '02-disposisi.mjs',
  '02b-hitungan-tab.mjs',
  '03-master.mjs',
  '03b-master-pengguna.mjs',
  '04-keluar-dan-kerangka.mjs',
  '05-notifikasi.mjs',
  '06-login.mjs',
  '07-konfirmasi-notifikasi.mjs',
  '08-lebar-dan-fokus.mjs',
];

let gagal = 0;
for (const berkas of BERKAS) {
  process.stdout.write(`\n=== ${berkas} ===\n`);
  const hasil = spawnSync('node', [`audit/${berkas}`], { stdio: 'inherit' });
  if (hasil.status !== 0) gagal += 1;
}

process.stdout.write(
  gagal === 0 ? '\nSeluruh berkas audit selesai.\n' : `\n${gagal} berkas audit berhenti.\n`,
);
process.exit(gagal === 0 ? 0 : 1);
