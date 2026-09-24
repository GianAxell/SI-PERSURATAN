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

const JENIS_SURAT_PER_BAGIAN: Record<string, string[]> = {
  DIR: [
    'Keputusan',
    'Pemberitahuan',
    'Tugas',
    'Penawaran',
    'Perjanjian Kerjasama',
    'Pernyataan Hutang',
    'Permohonan',
  ],
  HR: [
    'Perjanjian Kerjasama',
    'SPD',
    'Keterangan Kerja',
    'Peringatan',
    'Referensi Kerja',
    'Penunjukan Kerja',
    'Addendum Freelancer',
    'Keterangan Penghasilan',
    'Keputusan Kerja',
    'Permintaan Pembayaran',
  ],
  ADM: [
    'Undangan Intern',
    'Memo Libur',
    'Nota Dinas/Surat Tugas/Surat Jalan',
    'Pemasangan Iklan',
    'Keluhan',
    'Serah Terima Barang',
    'Permohonan',
    'Pengakuan Hutang',
    'Pemberitahuan',
    'Permintaan Pembayaran',
  ],
  FIN: [
    'Pemberitahuan',
    'Pembayaran',
    'Invoice',
    'Kuitansi',
    'Permintaan Pembayaran',
    'Laporan Penerimaan',
  ],
  MKT: [
    'Perkenalan',
    'Penawaran',
    'Pemberitahuan',
    'Permintaan Pembayaran',
    'Laporan Penerimaan',
  ],
  ENG: [
    'Kontrak Kerjasama',
    'PO',
    'Surat Jalan',
    'Serah Terima',
    'Surat Peringatan',
    'Pemberitahuan',
  ],
};

/** FIN dirinci sesuai Figma; bagian lain diisi kode umum sebanyak yang tercatat. */
export const JENIS_SURAT: JenisSurat[] = (() => {
  const hasil: JenisSurat[] = [];
  let id = 1;

  for (const b of BAGIAN) {
    const nama = JENIS_SURAT_PER_BAGIAN[b.kode] ?? PERIHAL_UMUM.slice(0, b.jumlah_kode_surat);
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
  { field_key: 'tanggal_surat', label: 'Tanggal surat', tipe: 'date', is_required: true, nilai_bawaan: null, urutan: 3, opsi: null },
  { field_key: 'pic', label: 'PIC', tipe: 'text', is_required: false, nilai_bawaan: null, urutan: 4, opsi: null },
  { field_key: 'nilai', label: 'Nilai tagihan', tipe: 'number', is_required: true, nilai_bawaan: null, urutan: 5, opsi: null },
  { field_key: 'isi', label: 'Isi surat', tipe: 'textarea', is_required: false, nilai_bawaan: null, urutan: 6, opsi: null },
];

// Fields untuk FIN.02 - Pembayaran
const FIELD_FIN02: Omit<TemplateField, 'id'>[] = [
  { field_key: 'kepada', label: 'Kepada', tipe: 'text', is_required: true, nilai_bawaan: null, urutan: 1, opsi: null },
  { field_key: 'perihal', label: 'Perihal', tipe: 'text', is_required: true, nilai_bawaan: null, urutan: 2, opsi: null },
  { field_key: 'tanggal_surat', label: 'Tanggal surat', tipe: 'date', is_required: true, nilai_bawaan: null, urutan: 3, opsi: null },
  { field_key: 'pic', label: 'PIC / Penandatangan', tipe: 'text', is_required: true, nilai_bawaan: null, urutan: 4, opsi: null },
  { field_key: 'nomor_referensi', label: 'Nomor invoice/referensi', tipe: 'text', is_required: false, nilai_bawaan: null, urutan: 5, opsi: null },
  { field_key: 'nilai', label: 'Nilai pembayaran', tipe: 'number', is_required: true, nilai_bawaan: null, urutan: 6, opsi: null },
  { field_key: 'tanggal_pembayaran', label: 'Tanggal pembayaran', tipe: 'date', is_required: true, nilai_bawaan: null, urutan: 7, opsi: null },
  { field_key: 'metode_pembayaran', label: 'Metode pembayaran', tipe: 'select', is_required: true, nilai_bawaan: null, urutan: 8, opsi: ['Transfer Bank', 'Tunai', 'Lainnya'] },
  { field_key: 'isi', label: 'Isi surat / catatan tambahan', tipe: 'textarea', is_required: false, nilai_bawaan: null, urutan: 9, opsi: null },
];

// Fields untuk FIN.04 - Kuitansi
const FIELD_FIN04: Omit<TemplateField, 'id'>[] = [
  { field_key: 'diterima_dari', label: 'Diterima dari', tipe: 'text', is_required: true, nilai_bawaan: null, urutan: 1, opsi: null },
  { field_key: 'jumlah_uang', label: 'Jumlah uang', tipe: 'number', is_required: true, nilai_bawaan: null, urutan: 2, opsi: null },
  { field_key: 'terbilang', label: 'Terbilang', tipe: 'text', is_required: true, nilai_bawaan: null, urutan: 3, opsi: null },
  { field_key: 'untuk_pembayaran', label: 'Untuk pembayaran', tipe: 'text', is_required: true, nilai_bawaan: null, urutan: 4, opsi: null },
  { field_key: 'tanggal_surat', label: 'Tanggal surat', tipe: 'date', is_required: true, nilai_bawaan: null, urutan: 5, opsi: null },
  { field_key: 'pic', label: 'PIC / Penerima', tipe: 'text', is_required: true, nilai_bawaan: null, urutan: 6, opsi: null },
];

// Fields untuk FIN.05 - Permintaan Pembayaran
const FIELD_FIN05: Omit<TemplateField, 'id'>[] = [
  { field_key: 'kepada', label: 'Kepada', tipe: 'text', is_required: true, nilai_bawaan: null, urutan: 1, opsi: null },
  { field_key: 'perihal', label: 'Perihal', tipe: 'text', is_required: true, nilai_bawaan: null, urutan: 2, opsi: null },
  { field_key: 'tanggal_surat', label: 'Tanggal surat', tipe: 'date', is_required: true, nilai_bawaan: null, urutan: 3, opsi: null },
  { field_key: 'pic', label: 'PIC / Penandatangan', tipe: 'text', is_required: true, nilai_bawaan: null, urutan: 4, opsi: null },
  { field_key: 'nomor_referensi', label: 'Nomor invoice referensi', tipe: 'text', is_required: false, nilai_bawaan: null, urutan: 5, opsi: null },
  { field_key: 'nilai', label: 'Nilai tagihan', tipe: 'number', is_required: true, nilai_bawaan: null, urutan: 6, opsi: null },
  { field_key: 'batas_waktu_pembayaran', label: 'Batas waktu pembayaran', tipe: 'date', is_required: true, nilai_bawaan: null, urutan: 7, opsi: null },
  { field_key: 'metode_pembayaran', label: 'Metode pembayaran', tipe: 'select', is_required: false, nilai_bawaan: null, urutan: 8, opsi: ['Transfer Bank', 'Tunai', 'Lainnya'] },
  { field_key: 'isi', label: 'Isi surat / catatan tambahan', tipe: 'textarea', is_required: false, nilai_bawaan: null, urutan: 9, opsi: null },
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

// Konten HTML untuk FIN.02 - Pembayaran
const KONTEN_FIN02 = `<div class="kop">
  <h1>PT METANOUVA INFORMATIKA</h1>
  <p>Jl. Gn. Batu Dalam Komplek Citra Asri Permai No.C-26, Pasirkaliki, Kec. Cimahi Utara, Kota Cimahi, Jawa Barat 40514</p>
  <p>Email: info@digitak.id</p>
</div>

<p>{nomor_surat}</p>
<p>Cimahi, {tanggal_surat}</p>

<p>Kepada Yth.<br>{kepada}</p>

<p>Perihal: {perihal}</p>

<p>Dengan hormat,</p>

<p>Bersama surat ini kami sampaikan bahwa pembayaran atas invoice/tagihan berikut telah/akan kami laksanakan:</p>

<table>
  <tr><td>Nomor Invoice/Referensi</td><td>: {nomor_referensi}</td></tr>
  <tr><td>Nilai Pembayaran</td><td>: Rp {nilai}</td></tr>
  <tr><td>Tanggal Pembayaran</td><td>: {tanggal_pembayaran}</td></tr>
  <tr><td>Metode Pembayaran</td><td>: {metode_pembayaran}</td></tr>
</table>

<p>{isi}</p>

<p>Demikian pemberitahuan ini kami sampaikan. Atas perhatian dan kerja sama Bapak/Ibu, kami ucapkan terima kasih.</p>

<div class="penutup">
  <p>Hormat kami,</p>
  <p>PT Metanouva Informatika</p>
  <br><br>
  <p>{pic}</p>
</div>`;

// Konten HTML untuk FIN.04 - Kuitansi
const KONTEN_FIN04 = `<div class="kop">
  <h1>PT METANOUVA INFORMATIKA</h1>
  <p>Jl. Gn. Batu Dalam Komplek Citra Asri Permai No.C-26, Pasirkaliki, Kec. Cimahi Utara, Kota Cimahi, Jawa Barat 40514</p>
  <p>Email: info@digitak.id</p>
</div>

<h2 style="text-align: center;">KUITANSI</h2>
<p>No. {nomor_surat}</p>

<table>
  <tr><td>Sudah terima dari</td><td>: {diterima_dari}</td></tr>
  <tr><td>Uang sejumlah</td><td>: Rp {jumlah_uang}</td></tr>
  <tr><td>Terbilang</td><td>: {terbilang}</td></tr>
  <tr><td>Untuk pembayaran</td><td>: {untuk_pembayaran}</td></tr>
</table>

<div class="penutup">
  <p>Cimahi, {tanggal_surat}</p>
  <p>Yang menerima,</p>
  <p><em>(materai bila nilai ≥ Rp 5.000.000)</em></p>
  <br><br>
  <p>{pic}</p>
</div>`;

// Konten HTML untuk FIN.05 - Permintaan Pembayaran
const KONTEN_FIN05 = `<div class="kop">
  <h1>PT METANOUVA INFORMATIKA</h1>
  <p>Jl. Gn. Batu Dalam Komplek Citra Asri Permai No.C-26, Pasirkaliki, Kec. Cimahi Utara, Kota Cimahi, Jawa Barat 40514</p>
  <p>Email: info@digitak.id</p>
</div>

<p>{nomor_surat}</p>
<p>Cimahi, {tanggal_surat}</p>

<p>Kepada Yth.<br>{kepada}</p>

<p>Perihal: {perihal}</p>

<p>Dengan hormat,</p>

<p>Sehubungan dengan invoice yang telah kami terbitkan, dengan ini kami sampaikan permintaan pembayaran sebagai berikut:</p>

<table>
  <tr><td>Nomor Invoice</td><td>: {nomor_referensi}</td></tr>
  <tr><td>Nilai Tagihan</td><td>: Rp {nilai}</td></tr>
  <tr><td>Batas Waktu</td><td>: {batas_waktu_pembayaran}</td></tr>
  <tr><td>Metode Pembayaran</td><td>: {metode_pembayaran}</td></tr>
</table>

<p>{isi}</p>

<p>Kami mohon agar pembayaran dapat dilakukan sebelum batas waktu di atas. Atas perhatian dan kerja sama Bapak/Ibu, kami ucapkan terima kasih.</p>

<div class="penutup">
  <p>Hormat kami,</p>
  <p>PT Metanouva Informatika</p>
  <br><br>
  <p>{pic}</p>
</div>`;

// Konten HTML untuk FIN.03 - Invoice (diperbarui dengan alamat lengkap)
const KONTEN_FIN03 = `<div class="kop">
  <h1>PT METANOUVA INFORMATIKA</h1>
  <p>Jl. Gn. Batu Dalam Komplek Citra Asri Permai No.C-26, Pasirkaliki, Kec. Cimahi Utara, Kota Cimahi, Jawa Barat 40514</p>
  <p>Email: info@digitak.id</p>
</div>

<p>{nomor_surat}</p>
<p>Cimahi, {tanggal_surat}</p>

<p>Kepada Yth.<br>{kepada}</p>

<p>Perihal: {perihal}</p>

<p>Dengan hormat,</p>

<p>{isi}</p>

<p>Nilai tagihan: Rp {nilai}</p>

<div class="penutup">
  <p>Hormat kami,</p>
  <p>PT Metanouva Informatika</p>
  <br><br>
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
    konten_html: KONTEN_FIN03,
    format_nomor: '{urut}/{bagian}.{kode}/{perusahaan}/{bulan_romawi}/{tahun}',
    is_active: true,
    fields: buatField(FIELD_INVOICE),
  },
  {
    id: 2,
    nama: 'Invoice Termin Proyek',
    jenis_surat: jenis('FIN.03'),
    konten_html: KONTEN_FIN03,
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
    konten_html: KONTEN_FIN04,
    format_nomor: '{urut}/{bagian}.{kode}/{perusahaan}/{bulan_romawi}/{tahun}',
    is_active: true,
    fields: buatField(FIELD_FIN04),
  },
  {
    id: 4,
    nama: 'Permintaan Pembayaran',
    jenis_surat: jenis('FIN.05'),
    konten_html: KONTEN_FIN05,
    format_nomor: '{urut}/{bagian}.{kode}/{perusahaan}/{bulan_romawi}/{tahun}',
    is_active: true,
    fields: buatField(FIELD_FIN05),
  },
  {
    id: 5,
    nama: 'Pembayaran Standar',
    jenis_surat: jenis('FIN.02'),
    konten_html: KONTEN_FIN02,
    format_nomor: '{urut}/{bagian}.{kode}/{perusahaan}/{bulan_romawi}/{tahun}',
    is_active: true,
    fields: buatField(FIELD_FIN02),
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
