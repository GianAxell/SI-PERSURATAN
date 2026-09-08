import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from './layouts/AppLayout';
import { ProtectedRoute } from './ProtectedRoute';
import { LoginPage } from '@/features/auth/LoginPage';
import { Placeholder } from '@/components/Placeholder';
import { SuratMasukListPage } from '@/features/surat-masuk/SuratMasukListPage';
import { SuratMasukBaruPage } from '@/features/surat-masuk/SuratMasukBaruPage';
import { SuratMasukDetailPage } from '@/features/surat-masuk/SuratMasukDetailPage';
import { DisposisiSayaPage } from '@/features/disposisi/DisposisiSayaPage';
import { DisposisiDetailPage } from '@/features/disposisi/DisposisiDetailPage';
import { RiwayatSayaPage } from '@/features/disposisi/RiwayatSayaPage';
import { RiwayatAdminPage } from '@/features/disposisi/RiwayatAdminPage';
import { BerandaRedirect } from './BerandaRedirect';

/*
 * Peta route mengikuti §5 Rencana Frontend. `handle.judul` mengisi judul
 * pada topbar, sehingga judul halaman tinggal satu tempat, bukan diulang
 * di tiap komponen.
 */

const admin = (elemen: React.ReactNode) => (
  <ProtectedRoute roles={['admin']}>{elemen}</ProtectedRoute>
);
const pegawai = (elemen: React.ReactNode) => (
  <ProtectedRoute roles={['pegawai']}>{elemen}</ProtectedRoute>
);

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },

  {
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <BerandaRedirect /> },

      /* ---------- Admin ---------- */
      {
        path: 'surat-masuk',
        handle: { judul: 'Surat Masuk' },
        element: admin(<SuratMasukListPage />),
      },
      {
        path: 'surat-masuk/baru',
        handle: { judul: 'Registrasi Surat Masuk' },
        element: admin(<SuratMasukBaruPage />),
      },
      {
        path: 'surat-masuk/:id',
        handle: { judul: 'Detail Surat Masuk' },
        element: admin(<SuratMasukDetailPage />),
      },
      {
        path: 'disposisi',
        handle: { judul: 'Riwayat Disposisi' },
        element: admin(<RiwayatAdminPage />),
      },
      {
        path: 'surat-keluar',
        handle: { judul: 'Surat Keluar' },
        element: admin(<Placeholder layar="07" nama="Daftar Surat Keluar" />),
      },
      {
        path: 'surat-keluar/baru',
        handle: { judul: 'Buat Surat Keluar' },
        element: admin(<Placeholder layar="08–10" nama="Buat Surat Keluar" />),
      },
      {
        path: 'surat-keluar/:id',
        handle: { judul: 'Detail Surat Keluar' },
        element: admin(<Placeholder layar="11" nama="Detail Surat Keluar" />),
      },
      {
        path: 'master',
        handle: { judul: 'Data Master' },
        children: [
          { index: true, element: <Navigate to="/master/pengguna" replace /> },
          {
            path: 'pengguna',
            element: admin(<Placeholder layar="13" nama="Data Master Pengguna" />),
          },
          {
            path: 'pegawai',
            element: admin(<Placeholder layar="21" nama="Data Master Pegawai" />),
          },
          {
            path: 'bagian',
            element: admin(<Placeholder layar="22" nama="Data Master Bagian" />),
          },
          {
            path: 'jenis-surat',
            element: admin(<Placeholder layar="14" nama="Data Master Jenis Surat" />),
          },
          {
            path: 'template',
            element: admin(<Placeholder layar="15" nama="Data Master Template" />),
          },
          {
            path: 'penomoran',
            element: admin(<Placeholder layar="16" nama="Aturan Penomoran" />),
          },
        ],
      },

      /* ---------- Pegawai ---------- */
      {
        path: 'disposisi-saya',
        handle: { judul: 'Disposisi Saya' },
        element: pegawai(<DisposisiSayaPage />),
      },
      {
        path: 'disposisi-saya/:id',
        handle: { judul: 'Detail Disposisi' },
        element: pegawai(<DisposisiDetailPage />),
      },
      {
        path: 'riwayat',
        handle: { judul: 'Riwayat Disposisi' },
        element: pegawai(<RiwayatSayaPage />),
      },

      /* ---------- Kedua role ---------- */
      {
        path: 'profil',
        handle: { judul: 'Profil Saya' },
        element: <Placeholder layar="29" nama="Profil Saya" />,
      },
      {
        path: 'ubah-kata-sandi',
        handle: { judul: 'Ubah Kata Sandi' },
        element: <Placeholder layar="30" nama="Ubah Kata Sandi" />,
      },
    ],
  },

  { path: '*', element: <Navigate to="/" replace /> },
]);
