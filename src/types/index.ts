/*
 * Bentuk data yang diterima frontend.
 * Terjemahan langsung dari Kontrak_API_SI_Persuratan.md v1.0 §3.
 *
 * Kalau backend mengubah salah satu bentuk di sini, kontraknya yang
 * dinaikkan versinya lebih dulu — berkas ini mengikuti, bukan memimpin.
 */

/* ---------- amplop response (§2.2) ---------- */

export interface Meta {
  page: number;
  limit: number;
  total: number;
  total_page: number;
}

export interface ApiSuccess<T> {
  success: true;
  message: string;
  data: T;
  meta?: Meta;
}

export interface ApiFieldError {
  field: string;
  message: string;
}

export interface ApiError {
  success: false;
  message: string;
  errors?: ApiFieldError[];
}

/** Daftar berhalaman: data + meta yang pasti ada. */
export interface Halaman<T> {
  data: T[];
  meta: Meta;
}

/* ---------- enum (§2.5) ---------- */

export type Role = 'admin' | 'pegawai';
export type StatusDisposisi = 'belum_dibaca' | 'diproses' | 'selesai';
export type StatusAktif = 'aktif' | 'nonaktif';
export type TipeField = 'text' | 'textarea' | 'date' | 'number' | 'select';
export type JenisNotifikasi =
  | 'surat_masuk_baru'
  | 'disposisi_baru'
  | 'disposisi_selesai'
  | 'batas_waktu_dekat'
  | 'nomor_surat_keluar';

/* ---------- rujukan ringkas ---------- */

export interface BagianRef {
  id: number;
  kode: string;
  nama: string;
}

export interface JenisSuratRef {
  id: number;
  kode: string;
  nama: string;
}

export interface UserRef {
  id: number;
  nama: string;
  role?: Role;
}

export interface PegawaiRef {
  id: number;
  nama: string;
}

export interface Berkas {
  nama: string;
  ukuran?: number;
}

/* ---------- entitas (§3) ---------- */

export interface User {
  id: number;
  nama: string;
  username: string;
  role: Role;
  jabatan: string | null;
  bagian: BagianRef | null;
  status: StatusAktif;
  terakhir_masuk: string | null;
}

export interface Pegawai {
  id: number;
  nama: string;
  nip: string | null;
  jabatan: string | null;
  bagian: BagianRef | null;
  user: { id: number; username: string } | null;
  status: StatusAktif;
}

export interface Bagian {
  id: number;
  kode: string;
  nama: string;
  jumlah_kode_surat: number;
  jumlah_surat_tahun_ini: number;
  urutan_tampil: number;
  status: StatusAktif;
}

export interface JenisSurat {
  id: number;
  kode: string;
  nama: string;
  bagian: BagianRef;
  jumlah_template: number;
  status: StatusAktif;
}

export interface SuratMasukRingkas {
  id: number;
  nomor_agenda: string;
  nomor_surat: string;
  tanggal_surat: string;
  perihal: string;
  pengirim: string;
  pic: string | null;
  status_disposisi: StatusDisposisi | null;
  terlambat: boolean;
}

export interface DisposisiPadaSurat {
  id: number;
  penerima: PegawaiRef;
  instruksi: string;
  batas_waktu: string | null;
  status: StatusDisposisi;
  terlambat: boolean;
}

export interface SuratMasukDetail {
  id: number;
  nomor_agenda: string;
  nomor_surat: string;
  tanggal_surat: string;
  perihal: string;
  pengirim: string;
  pic: string | null;
  keterangan: string | null;
  status_disposisi: StatusDisposisi | null;
  berkas: Berkas | null;
  surat_balasan: { id: number; nomor_surat: string } | null;
  disposisi: DisposisiPadaSurat[];
  dibuat_oleh: UserRef;
  dibuat_pada: string;
}

export interface DisposisiSaya {
  id: number;
  status: StatusDisposisi;
  terlambat: boolean;
  instruksi: string;
  batas_waktu: string | null;
  /* Ditambahkan pada kontrak v1.1 — dibutuhkan tabel layar 19. */
  dibuat_pada: string;
  selesai_pada: string | null;
  surat: {
    id: number;
    nomor_agenda: string;
    perihal: string;
    pengirim: string;
  };
}

export interface DisposisiDetail {
  id: number;
  status: StatusDisposisi;
  terlambat: boolean;
  instruksi: string;
  batas_waktu: string | null;
  hasil_tindak_lanjut: string | null;
  pemberi: UserRef;
  penerima: PegawaiRef;
  dibuat_pada: string;
  dibaca_pada: string | null;
  selesai_pada: string | null;
  surat: {
    id: number;
    nomor_agenda: string;
    perihal: string;
    pengirim: string;
    berkas: Berkas | null;
  };
}

export interface RiwayatDisposisi {
  id: number;
  status_lama: StatusDisposisi | null;
  status_baru: StatusDisposisi;
  catatan: string | null;
  aktor: UserRef;
  waktu: string;
}

export interface TemplateField {
  id: number;
  field_key: string;
  label: string;
  tipe: TipeField;
  is_required: boolean;
  nilai_bawaan: string | null;
  urutan: number;
  opsi: string[] | null;
}

export interface Template {
  id: number;
  nama: string;
  jenis_surat: JenisSuratRef;
  konten_html: string;
  format_nomor: string;
  is_active: boolean;
  fields: TemplateField[];
}

export interface SuratKeluar {
  id: number;
  nomor_urut: number;
  nomor_surat: string;
  tahun: number;
  tanggal_surat: string;
  kepada: string;
  perihal: string;
  pic: string | null;
  bagian: BagianRef;
  jenis_surat: JenisSuratRef;
  template: { id: number; nama: string };
  membalas_surat_masuk: {
    id: number;
    nomor_agenda: string;
    perihal: string;
  } | null;
  data_dinamis: Record<string, unknown>;
  dibuat_pada: string;
}

export interface Notifikasi {
  id: number;
  jenis: JenisNotifikasi;
  judul: string;
  keterangan: string;
  waktu: string;
  dibaca: boolean;
  tautan: { tipe: 'surat_masuk' | 'surat_keluar' | 'disposisi'; id: number } | null;
}

export interface AturanPenomoran {
  format_nomor: string;
  kode_perusahaan: string;
  panjang_nomor_urut: number;
  cakupan: 'global_per_tahun';
  contoh: string;
  counter: { tahun: number; nomor_terakhir: number }[];
  riwayat_perubahan: { waktu: string; aktor: string; ringkasan: string }[];
}

/* ---------- meta tambahan ---------- */

/** GET /disposisi/saya mengirim hitungan untuk tab (§5.4). */
export interface MetaDisposisiSaya extends Meta {
  hitungan: {
    semua: number;
    belum_dibaca: number;
    diproses: number;
    selesai: number;
  };
}
