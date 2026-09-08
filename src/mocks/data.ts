import type { Notifikasi, User } from '@/types';

/*
 * Data contoh untuk mock MSW. Isinya sengaja meniru data pada prototype
 * Figma (nama, bagian, nomor surat) supaya tampilan yang muncul di layar
 * bisa dibandingkan langsung dengan desainnya.
 *
 * Berkas ini tidak ikut ke produksi — MSW hanya dijalankan saat development.
 */

export const BAGIAN = [
  { id: 1, kode: 'DIR', nama: 'Direksi' },
  { id: 2, kode: 'HR', nama: 'Personalia' },
  { id: 3, kode: 'ADM', nama: 'Administrasi' },
  { id: 4, kode: 'FIN', nama: 'Keuangan' },
  { id: 5, kode: 'MKT', nama: 'Pengembangan' },
  { id: 6, kode: 'ENG', nama: 'Engineer' },
];

export const PENGGUNA: (User & { password: string })[] = [
  {
    id: 1,
    nama: 'Rina Marlina',
    username: 'rina.marlina',
    password: 'admin123',
    role: 'admin',
    jabatan: 'Staf Administrasi',
    bagian: BAGIAN[2],
    status: 'aktif',
    terakhir_masuk: '2026-09-01T08:12:00+07:00',
  },
  {
    id: 3,
    nama: 'Budi Santoso',
    username: 'budi.santoso',
    password: 'pegawai123',
    role: 'pegawai',
    jabatan: 'Staf Keuangan',
    bagian: BAGIAN[3],
    status: 'aktif',
    terakhir_masuk: '2026-09-05T09:40:00+07:00',
  },
];

const menitLalu = (n: number) => new Date(Date.now() - n * 60_000).toISOString();

export const NOTIFIKASI_ADMIN: Notifikasi[] = [
  {
    id: 1,
    jenis: 'surat_masuk_baru',
    judul: 'Surat masuk baru diregistrasi',
    keterangan: '0135/2026 — Permohonan Kerja Praktik',
    waktu: menitLalu(0.5),
    dibaca: false,
    tautan: { tipe: 'surat_masuk', id: 1 },
  },
  {
    id: 2,
    jenis: 'disposisi_selesai',
    judul: 'Disposisi diselesaikan Budi Santoso',
    keterangan: '0134/2026 — Undangan Sosialisasi Modul SPB',
    waktu: menitLalu(120),
    dibaca: false,
    tautan: { tipe: 'surat_masuk', id: 2 },
  },
  {
    id: 3,
    jenis: 'nomor_surat_keluar',
    judul: 'Nomor surat keluar terpakai',
    keterangan: '468/FIN.03/Digitak/VIII/2026',
    waktu: menitLalu(60 * 30),
    dibaca: true,
    tautan: { tipe: 'surat_keluar', id: 468 },
  },
];

export const NOTIFIKASI_PEGAWAI: Notifikasi[] = [
  {
    id: 11,
    jenis: 'disposisi_baru',
    judul: 'Disposisi baru dari Rina (Admin)',
    keterangan: 'Permohonan Kerja Praktik dari ITG',
    waktu: menitLalu(0.5),
    dibaca: false,
    tautan: { tipe: 'disposisi', id: 51 },
  },
  {
    id: 12,
    jenis: 'disposisi_baru',
    judul: 'Disposisi baru dari Rina (Admin)',
    keterangan: 'Undangan Sosialisasi Modul SPB',
    waktu: menitLalu(120),
    dibaca: false,
    tautan: { tipe: 'disposisi', id: 52 },
  },
  {
    id: 13,
    jenis: 'batas_waktu_dekat',
    judul: 'Batas waktu besok',
    keterangan: 'Pengajuan Praktek Kerja Lapangan',
    waktu: menitLalu(60 * 30),
    dibaca: true,
    tautan: { tipe: 'disposisi', id: 53 },
  },
];
