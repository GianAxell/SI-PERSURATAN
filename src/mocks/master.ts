import type {
  AturanPenomoran,
  Bagian,
  JenisSurat,
  Pegawai,
  StatusAktif,
  Template,
  TemplateField,
  User,
} from '@/types';

/*
 * Master data contoh. Isinya mengikuti data yang tampil di prototype Figma
 * (enam bagian, kode perihal per bagian, template FIN.03) supaya tampilan
 * bisa dibandingkan langsung dengan desainnya.
 */

export const BAGIAN: Bagian[] = [
  { id: 1, kode: 'DIR', nama: 'Direksi', jumlah_kode_surat: 7, jumlah_surat_tahun_ini: 96, urutan_tampil: 1, status: 'aktif' },
  { id: 2, kode: 'HR', nama: 'Personalia', jumlah_kode_surat: 10, jumlah_surat_tahun_ini: 74, urutan_tampil: 2, status: 'aktif' },
  { id: 3, kode: 'ADM', nama: 'Administrasi', jumlah_kode_surat: 10, jumlah_surat_tahun_ini: 118, urutan_tampil: 3, status: 'aktif' },
  { id: 4, kode: 'FIN', nama: 'Keuangan', jumlah_kode_surat: 6, jumlah_surat_tahun_ini: 132, urutan_tampil: 4, status: 'aktif' },
  { id: 5, kode: 'MKT', nama: 'Pengembangan', jumlah_kode_surat: 5, jumlah_surat_tahun_ini: 28, urutan_tampil: 5, status: 'aktif' },
  { id: 6, kode: 'ENG', nama: 'Engineer', jumlah_kode_surat: 6, jumlah_surat_tahun_ini: 19, urutan_tampil: 6, status: 'aktif' },
];

const PERIHAL_UMUM = [
  'Pemberitahuan',
  'Permohonan',
  'Undangan',
  'Surat Tugas',
  'Surat Keterangan',
  'Laporan',
  'Perjanjian Kerja Sama',
  'Nota Dinas',
  'Berita Acara',
  'Surat Peringatan',
];

/** FIN dirinci sesuai Figma; bagian lain diisi kode umum sebanyak yang tercatat. */
export const JENIS_SURAT: JenisSurat[] = (() => {
  const hasil: JenisSurat[] = [];
  let id = 1;

  const FIN = [
    'Pemberitahuan',
    'Pembayaran',
    'Invoice',
    'Kuitansi',
    'Permintaan Pembayaran',
    'Laporan Penerimaan',
  ];

  for (const b of BAGIAN) {
    const nama = b.kode === 'FIN' ? FIN : PERIHAL_UMUM.slice(0, b.jumlah_kode_surat);
    nama.forEach((n, i) => {
      hasil.push({
        id: id++,
        kode: `${b.kode}.${String(i + 1).padStart(2, '0')}`,
        nama: n,
        bagian: { id: b.id, kode: b.kode, nama: b.nama },
        jumlah_template: 0,
        status: 'aktif',
      });
    });
  }
  return hasil;
})();

function jenis(kode: string) {
  const j = JENIS_SURAT.find((x) => x.kode === kode)!;
  return { id: j.id, kode: j.kode, nama: j.nama };
}

const FIELD_INVOICE: Omit<TemplateField, 'id'>[] = [
  { field_key: 'kepada', label: 'Kepada', tipe: 'text', is_required: true, nilai_bawaan: null, urutan: 1, opsi: null },
  { field_key: 'perihal', label: 'Perihal', tipe: 'text', is_required: true, nilai_bawaan: null, urutan: 2, opsi: null },
  { field_key: 'tanggal', label: 'Tanggal surat', tipe: 'date', is_required: true, nilai_bawaan: null, urutan: 3, opsi: null },
  { field_key: 'pic', label: 'PIC', tipe: 'text', is_required: false, nilai_bawaan: null, urutan: 4, opsi: null },
  { field_key: 'nilai', label: 'Nilai tagihan', tipe: 'number', is_required: true, nilai_bawaan: null, urutan: 5, opsi: null },
  { field_key: 'isi', label: 'Isi surat', tipe: 'textarea', is_required: false, nilai_bawaan: null, urutan: 6, opsi: null },
];

const KONTEN_CONTOH = `<div class="kop">
  <h1>PT METANOUVA INFORMATIKA</h1>
  <p>Jl. Contoh Alamat No. 1, Garut</p>
</div>

<p>Nomor: {nomor_surat}</p>
<p>Kepada Yth. {kepada}</p>
<p>Perihal: {perihal}</p>

<p>{isi}</p>

<p>Nilai tagihan: {nilai}</p>

<div class="penutup">
  <p>Garut, {tanggal}</p>
  <p>{pic}</p>
</div>`;

let idField = 1;
const buatField = (dasar: Omit<TemplateField, 'id'>[]): TemplateField[] =>
  dasar.map((f) => ({ ...f, id: idField++ }));

export const TEMPLATE: Template[] = [
  {
    id: 1,
    nama: 'Invoice Standar',
    jenis_surat: jenis('FIN.03'),
    konten_html: KONTEN_CONTOH,
    format_nomor: '{urut}/{bagian}.{kode}/{perusahaan}/{bulan_romawi}/{tahun}',
    is_active: true,
    fields: buatField(FIELD_INVOICE),
  },
  {
    id: 2,
    nama: 'Invoice Termin Proyek',
    jenis_surat: jenis('FIN.03'),
    konten_html: KONTEN_CONTOH,
    format_nomor: '{urut}/{bagian}.{kode}/{perusahaan}/{bulan_romawi}/{tahun}',
    is_active: false,
    fields: buatField([
      ...FIELD_INVOICE.slice(0, 5),
      { field_key: 'termin', label: 'Termin ke', tipe: 'number', is_required: true, nilai_bawaan: null, urutan: 6, opsi: null },
    ]),
  },
  {
    id: 3,
    nama: 'Kuitansi Standar',
    jenis_surat: jenis('FIN.04'),
    konten_html: KONTEN_CONTOH,
    format_nomor: '{urut}/{bagian}.{kode}/{perusahaan}/{bulan_romawi}/{tahun}',
    is_active: true,
    fields: buatField(FIELD_INVOICE.slice(0, 5)),
  },
  {
    id: 4,
    nama: 'Permintaan Pembayaran',
    jenis_surat: jenis('FIN.05'),
    konten_html: KONTEN_CONTOH,
    format_nomor: '{urut}/{bagian}.{kode}/{perusahaan}/{bulan_romawi}/{tahun}',
    is_active: true,
    fields: buatField(FIELD_INVOICE.slice(0, 4)),
  },
  {
    id: 5,
    nama: 'Pembayaran Standar',
    jenis_surat: jenis('FIN.02'),
    konten_html: KONTEN_CONTOH,
    format_nomor: '{urut}/{bagian}.{kode}/{perusahaan}/{bulan_romawi}/{tahun}',
    is_active: true,
    fields: buatField(FIELD_INVOICE.slice(0, 4)),
  },
];

/*
 * Bagian selain Keuangan memakai template umum. Tanpa ini, surat keluar
 * contoh untuk HR/ADM/DIR terpaksa menunjuk template milik Keuangan dan
 * layar detailnya menampilkan kolom yang tidak ada hubungannya.
 */
const FIELD_UMUM: Omit<TemplateField, 'id'>[] = [
  { field_key: 'kepada', label: 'Kepada', tipe: 'text', is_required: true, nilai_bawaan: null, urutan: 1, opsi: null },
  { field_key: 'perihal', label: 'Perihal', tipe: 'text', is_required: true, nilai_bawaan: null, urutan: 2, opsi: null },
  { field_key: 'tanggal', label: 'Tanggal surat', tipe: 'date', is_required: true, nilai_bawaan: null, urutan: 3, opsi: null },
  { field_key: 'pic', label: 'PIC', tipe: 'text', is_required: false, nilai_bawaan: null, urutan: 4, opsi: null },
  { field_key: 'isi', label: 'Isi surat', tipe: 'textarea', is_required: true, nilai_bawaan: null, urutan: 5, opsi: null },
  { field_key: 'tembusan', label: 'Tembusan', tipe: 'text', is_required: false, nilai_bawaan: null, urutan: 6, opsi: null },
];

(() => {
  let id = TEMPLATE.length + 1;
  for (const b of BAGIAN) {
    if (b.kode === 'FIN') continue;
    const jenisBagian = JENIS_SURAT.filter((j) => j.bagian.id === b.id);
    /* Dua template per bagian: cukup untuk menguji pilihan, tidak berlebihan. */
    for (const indeks of [0, 2]) {
      const j = jenisBagian[indeks];
      if (!j) continue;
      TEMPLATE.push({
        id: id++,
        nama: `${j.nama} ${b.nama}`,
        jenis_surat: { id: j.id, kode: j.kode, nama: j.nama },
        konten_html: KONTEN_CONTOH.replace('<p>Nilai tagihan: {nilai}</p>\n\n', ''),
        format_nomor: '{urut}/{bagian}.{kode}/{perusahaan}/{bulan_romawi}/{tahun}',
        is_active: true,
        fields: buatField(FIELD_UMUM),
      });
    }
  }
})();

/** Jumlah template pada daftar jenis surat dihitung, bukan disimpan ganda. */
export function segarkanJumlahTemplate() {
  for (const j of JENIS_SURAT) {
    j.jumlah_template = TEMPLATE.filter((t) => t.jenis_surat.id === j.id).length;
  }
}
segarkanJumlahTemplate();

const ref = (kode: string) => {
  const b = BAGIAN.find((x) => x.kode === kode)!;
  return { id: b.id, kode: b.kode, nama: b.nama };
};

export const USERS: (User & { password: string })[] = [
  { id: 1, nama: 'Rina Marlina', username: 'rina.marlina', password: 'admin123', role: 'admin', jabatan: 'Staf Administrasi', bagian: ref('ADM'), status: 'aktif', terakhir_masuk: '2026-09-01T08:12:00+07:00' },
  { id: 2, nama: 'Hendra Wijaya', username: 'hendra.wijaya', password: 'admin123', role: 'admin', jabatan: 'Kepala Bagian Administrasi', bagian: ref('ADM'), status: 'aktif', terakhir_masuk: '2026-08-28T09:03:00+07:00' },
  { id: 3, nama: 'Budi Santoso', username: 'budi.santoso', password: 'pegawai123', role: 'pegawai', jabatan: 'Staf Keuangan', bagian: ref('FIN'), status: 'aktif', terakhir_masuk: '2026-09-05T09:40:00+07:00' },
  { id: 4, nama: 'Sari Wulandari', username: 'sari.wulandari', password: 'pegawai123', role: 'pegawai', jabatan: 'Staf Administrasi', bagian: ref('ADM'), status: 'aktif', terakhir_masuk: null },
  { id: 5, nama: 'Agus Prasetyo', username: 'agus.prasetyo', password: 'pegawai123', role: 'pegawai', jabatan: 'Staf Personalia', bagian: ref('HR'), status: 'aktif', terakhir_masuk: null },
  { id: 6, nama: 'Dewi Lestari', username: 'dewi.lestari', password: 'pegawai123', role: 'pegawai', jabatan: 'Staf Pengembangan', bagian: ref('MKT'), status: 'aktif', terakhir_masuk: null },
  { id: 7, nama: 'Rizky Ramadhan', username: 'rizky.ramadhan', password: 'pegawai123', role: 'pegawai', jabatan: 'Staf Engineer', bagian: ref('ENG'), status: 'aktif', terakhir_masuk: null },
  { id: 8, nama: 'Yuni Astuti', username: 'yuni.astuti', password: 'pegawai123', role: 'pegawai', jabatan: 'Staf Keuangan', bagian: ref('FIN'), status: 'nonaktif', terakhir_masuk: '2026-03-11T10:20:00+07:00' },
];

export const PEGAWAI: Pegawai[] = [
  { id: 10, nama: 'Hendra Wijaya', nip: '20150102', jabatan: 'Direktur', bagian: ref('DIR'), user: { id: 2, username: 'hendra.wijaya' }, status: 'aktif' },
  { id: 12, nama: 'Budi Santoso', nip: '20190114', jabatan: 'Staf Keuangan', bagian: ref('FIN'), user: { id: 3, username: 'budi.santoso' }, status: 'aktif' },
  { id: 13, nama: 'Sari Wulandari', nip: '20200207', jabatan: 'Staf Administrasi', bagian: ref('ADM'), user: { id: 4, username: 'sari.wulandari' }, status: 'aktif' },
  { id: 14, nama: 'Agus Prasetyo', nip: '20170321', jabatan: 'Staf Personalia', bagian: ref('HR'), user: { id: 5, username: 'agus.prasetyo' }, status: 'aktif' },
  { id: 15, nama: 'Dewi Lestari', nip: '20210419', jabatan: 'Staf Pengembangan', bagian: ref('MKT'), user: { id: 6, username: 'dewi.lestari' }, status: 'aktif' },
  { id: 16, nama: 'Rizky Ramadhan', nip: '20220530', jabatan: 'Staf Engineer', bagian: ref('ENG'), user: { id: 7, username: 'rizky.ramadhan' }, status: 'aktif' },
  { id: 17, nama: 'Nurul Hidayah', nip: '20230612', jabatan: 'Kepala Bagian Keuangan', bagian: ref('FIN'), user: null, status: 'aktif' },
  { id: 18, nama: 'Yuni Astuti', nip: '20180825', jabatan: 'Staf Keuangan', bagian: ref('FIN'), user: { id: 8, username: 'yuni.astuti' }, status: 'nonaktif' },
];

export const PENOMORAN: AturanPenomoran = {
  format_nomor: '{urut}/{bagian}.{kode}/{perusahaan}/{bulan_romawi}/{tahun}',
  kode_perusahaan: 'Digitak',
  panjang_nomor_urut: 3,
  cakupan: 'global_per_tahun',
  contoh: '468/FIN.03/Digitak/VIII/2026',
  counter: [
    { tahun: 2026, nomor_terakhir: 467 },
    { tahun: 2025, nomor_terakhir: 144 },
    { tahun: 2024, nomor_terakhir: 175 },
  ],
  riwayat_perubahan: [
    { waktu: '2026-01-06T09:00:00+07:00', aktor: 'Rina Marlina', ringkasan: 'Kode perusahaan MI menjadi Digitak' },
    { waktu: '2023-02-14T10:30:00+07:00', aktor: 'Hendra Wijaya', ringkasan: 'Kode perusahaan M9 menjadi MI' },
  ],
};

export function statusBerikutnya(s: StatusAktif): StatusAktif {
  return s === 'aktif' ? 'nonaktif' : 'aktif';
}
