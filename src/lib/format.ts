import { format, formatDistanceToNowStrict, isValid, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';

/**
 * Pemformatan untuk mata manusia. Backend selalu mengirim ISO 8601 (§2.4
 * kontrak); semua perubahan bentuk terjadi di sini, bukan di server.
 */

function ke(tanggal: string | Date | null | undefined): Date | null {
  if (!tanggal) return null;
  const d = typeof tanggal === 'string' ? parseISO(tanggal) : tanggal;
  return isValid(d) ? d : null;
}

/** 2026-07-26 → "26 Juli 2026" */
export function tanggalPanjang(v: string | Date | null | undefined, kosong = '—') {
  const d = ke(v);
  return d ? format(d, 'd MMMM yyyy', { locale: id }) : kosong;
}

/** 2026-07-26 → "26 Jul 2026" */
export function tanggalPendek(v: string | Date | null | undefined, kosong = '—') {
  const d = ke(v);
  return d ? format(d, 'd MMM yyyy', { locale: id }) : kosong;
}

/** 2026-07-27T09:14:00+07:00 → "27 Juli 2026, 09.14" */
export function waktuPanjang(v: string | Date | null | undefined, kosong = '—') {
  const d = ke(v);
  return d ? format(d, "d MMMM yyyy, HH.mm", { locale: id }) : kosong;
}

/** "Baru saja", "2 jam lalu", "Kemarin" — untuk panel pemberitahuan */
export function waktuRelatif(v: string | Date | null | undefined, kosong = '—') {
  const d = ke(v);
  if (!d) return kosong;
  const selisihDetik = (Date.now() - d.getTime()) / 1000;
  if (selisihDetik < 60) return 'Baru saja';
  if (selisihDetik < 172_800 && selisihDetik >= 86_400) return 'Kemarin';
  return `${formatDistanceToNowStrict(d, { locale: id })} lalu`;
}

/** Untuk <input type="date">: Date → "2026-07-26" */
export function keInputDate(v: Date | null | undefined) {
  return v ? format(v, 'yyyy-MM-dd') : '';
}

/** 12500000 → "Rp 12.500.000" */
export function rupiah(v: number | null | undefined, kosong = '—') {
  if (v === null || v === undefined || Number.isNaN(v)) return kosong;
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(v);
}

/** 482113 → "471 KB" */
export function ukuranBerkas(bytes: number | null | undefined) {
  if (!bytes) return '—';
  const satuan = ['B', 'KB', 'MB', 'GB'];
  let n = bytes;
  let i = 0;
  while (n >= 1024 && i < satuan.length - 1) {
    n /= 1024;
    i += 1;
  }
  return `${n.toFixed(i === 0 ? 0 : n >= 10 ? 0 : 1)} ${satuan[i]}`;
}

const ROMAWI = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];

/**
 * Bulan romawi untuk nomor surat keluar.
 * Diambil dari tanggal surat, bukan tanggal sistem (K-6, B-12).
 */
export function bulanRomawi(v: string | Date | null | undefined) {
  const d = ke(v);
  return d ? ROMAWI[d.getMonth()] : '';
}

/** 468 → "468" dengan panjang minimal 3 digit */
export function nomorUrut(n: number, panjang = 3) {
  return String(n).padStart(panjang, '0');
}

/** 
 * Mendapatkan inisial dari nama (maksimal 2 huruf).
 * Mengatasi nama dengan satu kata atau kosong agar tidak menyebabkan crash. 
 */
export function dapatkanInisial(nama: string | null | undefined): string {
  if (!nama || nama.trim() === '') return '?';
  const kata = nama.trim().split(/\s+/);
  if (kata.length === 1) {
    return kata[0].substring(0, 2).toUpperCase();
  }
  return (kata[0][0] + kata[1][0]).toUpperCase();
}
