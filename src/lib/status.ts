import type { StatusAktif, StatusDisposisi } from '@/types';

/**
 * Satu-satunya tempat status diterjemahkan menjadi label dan warna.
 * Semua layar memakai peta ini supaya "Diproses" tidak pernah berbeda
 * warnanya antara tabel surat masuk dan kartu disposisi.
 */

export type NadaBadge = 'abu' | 'amber' | 'hijau' | 'merah';

export const KELAS_BADGE: Record<NadaBadge, string> = {
  abu: 'bg-st-abu-bg border-st-abu-br text-st-abu-fg',
  amber: 'bg-st-amber-bg border-st-amber-br text-st-amber-fg',
  hijau: 'bg-st-hijau-bg border-st-hijau-br text-st-hijau-fg',
  merah: 'bg-st-merah-bg border-st-merah-br text-st-merah-fg',
};

export const STATUS_DISPOSISI: Record<
  StatusDisposisi,
  { label: string; nada: NadaBadge }
> = {
  belum_dibaca: { label: 'Belum Dibaca', nada: 'abu' },
  diproses: { label: 'Diproses', nada: 'amber' },
  selesai: { label: 'Selesai', nada: 'hijau' },
};

export const STATUS_AKTIF: Record<StatusAktif, { label: string; nada: NadaBadge }> = {
  aktif: { label: 'Aktif', nada: 'hijau' },
  nonaktif: { label: 'Nonaktif', nada: 'abu' },
};

/** Urutan tab pada layar 17 dan pilihan filter pada layar 02. */
export const URUTAN_STATUS: StatusDisposisi[] = ['belum_dibaca', 'diproses', 'selesai'];

/**
 * "Terlambat" bukan status keempat (K-4). Ia penanda turunan yang datang
 * dari server sebagai boolean `terlambat` (B-7) dan ditampilkan sebagai
 * badge terpisah di samping status.
 */
export const BADGE_TERLAMBAT = { label: 'Terlambat', nada: 'merah' as NadaBadge };

/** Label untuk surat yang belum pernah didisposisi (status_disposisi = null). */
export const BELUM_DIDISPOSISI = { label: 'Belum Didisposisi', nada: 'abu' as NadaBadge };

export function labelStatusDisposisi(status: StatusDisposisi | null) {
  return status ? STATUS_DISPOSISI[status] : BELUM_DIDISPOSISI;
}
