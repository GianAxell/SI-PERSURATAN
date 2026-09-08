import { USERS } from './master';
import { SURAT_MASUK } from './surat-masuk';
import { SURAT_KELUAR } from './surat-keluar';
import type { Notifikasi } from '@/types';

/*
 * Data contoh untuk mock MSW. Isinya sengaja meniru data pada prototype
 * Figma (nama, bagian, nomor surat) supaya tampilan yang muncul di layar
 * bisa dibandingkan langsung dengan desainnya.
 *
 * Berkas ini tidak ikut ke produksi — MSW hanya dijalankan saat development.
 */

/**
 * Akun pengguna berasal dari master data — satu sumber, supaya menonaktifkan
 * pengguna lewat Data Master benar-benar memblokir loginnya.
 */
export const PENGGUNA = USERS;

const menitLalu = (n: number) => new Date(Date.now() - n * 60_000).toISOString();

/*
 * Notifikasi diturunkan dari data yang benar-benar ada, bukan ditulis dengan
 * id tetap. Versi sebelumnya menunjuk surat keluar 468 dan disposisi 51-53
 * yang tidak pernah ada, sehingga setiap notifikasi yang diklik berakhir di
 * halaman "tidak ditemukan" — padahal panelnya muncul di hampir semua layar.
 */

const suratTerbaru = SURAT_MASUK[0];
const suratSelesai =
  SURAT_MASUK.find((s) => s.disposisi.some((d) => d.status === 'selesai')) ?? SURAT_MASUK[1];
const keluarTerbaru = SURAT_KELUAR[0];

export const NOTIFIKASI_ADMIN: Notifikasi[] = [
  {
    id: 1,
    jenis: 'surat_masuk_baru',
    judul: 'Surat masuk baru diregistrasi',
    keterangan: `${suratTerbaru.nomor_agenda} — ${suratTerbaru.perihal}`,
    waktu: menitLalu(0.5),
    dibaca: false,
    tautan: { tipe: 'surat_masuk', id: suratTerbaru.id },
  },
  {
    id: 2,
    jenis: 'disposisi_selesai',
    judul: `Disposisi diselesaikan ${
      suratSelesai.disposisi.find((d) => d.status === 'selesai')?.penerima.nama ?? 'pegawai'
    }`,
    keterangan: `${suratSelesai.nomor_agenda} — ${suratSelesai.perihal}`,
    waktu: menitLalu(120),
    dibaca: false,
    tautan: { tipe: 'surat_masuk', id: suratSelesai.id },
  },
  {
    id: 3,
    jenis: 'nomor_surat_keluar',
    judul: 'Nomor surat keluar terpakai',
    keterangan: keluarTerbaru.nomor_surat,
    waktu: menitLalu(60 * 30),
    dibaca: true,
    tautan: { tipe: 'surat_keluar', id: keluarTerbaru.id },
  },
];

/** Disposisi milik Budi Santoso (id 12) — akun pegawai contoh saat login. */
const disposisiBudi = SURAT_MASUK.flatMap((s) =>
  s.disposisi.filter((d) => d.penerima.id === 12).map((d) => ({ surat: s, disposisi: d })),
);

const belumDibaca = disposisiBudi.find((x) => x.disposisi.status === 'belum_dibaca');
const sedangProses = disposisiBudi.find((x) => x.disposisi.status === 'diproses');
const menjelangBatas =
  disposisiBudi.find((x) => x.disposisi.status !== 'selesai' && !x.disposisi.terlambat) ??
  disposisiBudi[0];

export const NOTIFIKASI_PEGAWAI: Notifikasi[] = [
  belumDibaca && {
    id: 11,
    jenis: 'disposisi_baru' as const,
    judul: 'Disposisi baru dari Rina (Admin)',
    keterangan: `${belumDibaca.surat.nomor_agenda} — ${belumDibaca.surat.perihal}`,
    waktu: menitLalu(0.5),
    dibaca: false,
    tautan: { tipe: 'disposisi' as const, id: belumDibaca.disposisi.id },
  },
  sedangProses && {
    id: 12,
    jenis: 'disposisi_baru' as const,
    judul: 'Disposisi baru dari Rina (Admin)',
    keterangan: `${sedangProses.surat.nomor_agenda} — ${sedangProses.surat.perihal}`,
    waktu: menitLalu(120),
    dibaca: false,
    tautan: { tipe: 'disposisi' as const, id: sedangProses.disposisi.id },
  },
  menjelangBatas && {
    id: 13,
    jenis: 'batas_waktu_dekat' as const,
    judul: 'Batas waktu sudah dekat',
    keterangan: `${menjelangBatas.surat.nomor_agenda} — ${menjelangBatas.surat.perihal}`,
    waktu: menitLalu(60 * 30),
    dibaca: true,
    tautan: { tipe: 'disposisi' as const, id: menjelangBatas.disposisi.id },
  },
].filter(Boolean) as Notifikasi[];
