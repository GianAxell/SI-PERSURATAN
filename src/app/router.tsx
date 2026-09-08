import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from './layouts/AppLayout';
import { ProtectedRoute } from './ProtectedRoute';
import { LoginPage } from '@/features/auth/LoginPage';
import { SuratMasukListPage } from '@/features/surat-masuk/SuratMasukListPage';
import { SuratMasukBaruPage } from '@/features/surat-masuk/SuratMasukBaruPage';
import { SuratMasukDetailPage } from '@/features/surat-masuk/SuratMasukDetailPage';
import { DisposisiSayaPage } from '@/features/disposisi/DisposisiSayaPage';
import { DisposisiDetailPage } from '@/features/disposisi/DisposisiDetailPage';
import { RiwayatSayaPage } from '@/features/disposisi/RiwayatSayaPage';
import { RiwayatAdminPage } from '@/features/disposisi/RiwayatAdminPage';
import { SuratKeluarListPage } from '@/features/surat-keluar/SuratKeluarListPage';
import { SuratKeluarBaruPage } from '@/features/surat-keluar/SuratKeluarBaruPage';
import { SuratKeluarDetailPage } from '@/features/surat-keluar/SuratKeluarDetailPage';
import { MasterLayout } from '@/features/master/MasterLayout';
import { PenggunaPage } from '@/features/master/PenggunaPage';
import { PegawaiPage } from '@/features/master/PegawaiPage';
import { BagianPage } from '@/features/master/BagianPage';
import { JenisSuratPage } from '@/features/master/JenisSuratPage';
import { TemplatePage } from '@/features/master/TemplatePage';
import { PenomoranPage } from '@/features/master/PenomoranPage';
import { ProfilPage } from '@/features/auth/ProfilPage';
import { UbahKataSandiPage } from '@/features/auth/UbahKataSandiPage';
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
        element: admin(<SuratKeluarListPage />),
      },
      {
        path: 'surat-keluar/baru',
        handle: { judul: 'Buat Surat Keluar' },
        element: admin(<SuratKeluarBaruPage />),
      },
      {
        path: 'surat-keluar/:id',
        handle: { judul: 'Detail Surat Keluar' },
        element: admin(<SuratKeluarDetailPage />),
      },
      {
        path: 'master',
        handle: { judul: 'Data Master' },
        element: <MasterLayout />,
        children: [
          { index: true, element: <Navigate to="/master/pengguna" replace /> },
          {
            path: 'pengguna',
            element: admin(<PenggunaPage />),
          },
          {
            path: 'pegawai',
            element: admin(<PegawaiPage />),
          },
          {
            path: 'bagian',
            element: admin(<BagianPage />),
          },
          {
            path: 'jenis-surat',
            element: admin(<JenisSuratPage />),
          },
          {
            path: 'template',
            element: admin(<TemplatePage />),
          },
          {
            path: 'penomoran',
            element: admin(<PenomoranPage />),
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
        element: <ProfilPage />,
      },
      {
        path: 'ubah-kata-sandi',
        handle: { judul: 'Ubah Kata Sandi' },
        element: <UbahKataSandiPage />,
      },
    ],
  },

  { path: '*', element: <Navigate to="/" replace /> },
]);
