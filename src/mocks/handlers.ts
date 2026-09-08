import { http } from 'msw';
import { NOTIFIKASI_ADMIN, NOTIFIKASI_PEGAWAI } from './data';
import { USERS } from './master';
import { buatToken, gagal, penggunaDari, sukses } from './util';
import { handlersSuratMasuk } from './handlers-surat-masuk';
import { handlersDisposisi } from './handlers-disposisi';
import { handlersSuratKeluar } from './handlers-surat-keluar';
import { handlersMaster } from './handlers-master';

/*
 * Handler MSW mengikuti amplop response, kode status, dan bentuk galat pada
 * kontrak. Tujuannya bukan meniru backend, melainkan memastikan frontend
 * sudah menangani bentuk yang nanti benar-benar datang.
 */

const handlersAuth = [
  http.post('/api/auth/login', async ({ request }) => {
    const { username, password } = (await request.json()) as {
      username: string;
      password: string;
    };

    const cocok = USERS.find((u) => u.username === username && u.password === password);
    if (!cocok) return gagal(401, 'Nama pengguna atau kata sandi tidak sesuai');
    if (cocok.status === 'nonaktif') return gagal(403, 'Akun ini sudah dinonaktifkan');

    /* Waktu masuk dicatat di sini, bukan di frontend — layar 29 menampilkannya
       apa adanya dari server, dan jam laptop yang meleset tidak ikut campur. */
    cocok.terakhir_masuk = new Date().toISOString();

    const { password: _abaikan, ...user } = cocok;
    return sukses({ token: buatToken(user), user }, undefined, 'Berhasil masuk');
  }),

  http.post('/api/auth/logout', () => sukses(null, undefined, 'Berhasil keluar')),

  http.get('/api/auth/me', ({ request }) => {
    const user = penggunaDari(request);
    return user ? sukses(user) : gagal(401, 'Sesi tidak valid');
  }),

  http.patch('/api/auth/password', async ({ request }) => {
    const user = penggunaDari(request);
    if (!user) return gagal(401, 'Sesi tidak valid');

    const { password_lama, password_baru } = (await request.json()) as Record<string, string>;
    const asli = USERS.find((u) => u.id === user.id);

    if (asli?.password !== password_lama) {
      return gagal(400, 'Validasi gagal', [
        { field: 'password_lama', message: 'Kata sandi lama tidak sesuai' },
      ]);
    }
    if (!password_baru || password_baru.length < 8) {
      return gagal(400, 'Validasi gagal', [
        { field: 'password_baru', message: 'Kata sandi baru minimal delapan karakter' },
      ]);
    }
    return sukses(null, undefined, 'Kata sandi berhasil diubah');
  }),
];

const handlersNotifikasi = [
  http.get('/api/notifikasi', ({ request }) => {
    const user = penggunaDari(request);
    if (!user) return gagal(401, 'Sesi tidak valid');

    const daftar = user.role === 'admin' ? NOTIFIKASI_ADMIN : NOTIFIKASI_PEGAWAI;
    return sukses(daftar, {
      page: 1,
      limit: daftar.length,
      total: daftar.length,
      total_page: 1,
      belum_dibaca: daftar.filter((n) => !n.dibaca).length,
    });
  }),

  http.patch('/api/notifikasi/baca-semua', ({ request }) => {
    const user = penggunaDari(request);
    if (!user) return gagal(401, 'Sesi tidak valid');
    const daftar = user.role === 'admin' ? NOTIFIKASI_ADMIN : NOTIFIKASI_PEGAWAI;
    daftar.forEach((n) => {
      n.dibaca = true;
    });
    return sukses(null);
  }),
];

export const handlers = [
  ...handlersAuth,
  ...handlersNotifikasi,
  ...handlersSuratMasuk,
  ...handlersSuratKeluar,
  ...handlersDisposisi,
  ...handlersMaster,
];
