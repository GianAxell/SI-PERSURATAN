import { BAGIAN, JENIS_SURAT, PENOMORAN, TEMPLATE } from './master';
import { bulanRomawiDari } from './util';
import type { SuratKeluar } from '@/types';

/*
 * Data contoh surat keluar. Nomor urut berjalan global per tahun (K-6),
 * jadi urutan di sini dibuat menurun dari nomor terakhir pada aturan
 * penomoran — 467 untuk 2026 — supaya angka pada layar 07 cocok dengan
 * yang tampil di Data Master Penomoran.
 */

const TUJUAN = [
  'PT Fiber Media Indonesia',
  'Dinas Komunikasi dan Informatika Kab. Garut',
  'Institut Teknologi Garut',
  'PT Sinar Terang Nusantara',
  'CV Karya Mandiri',
  'Badan Kepegawaian Daerah',
  'SMK Negeri 1 Garut',
  'PT Nusantara Data Prima',
];

const PIC = [
  'Seno Prianto',
  'Riski Ramadhan',
  'Dewi Lestari',
  'Agus Prasetyo',
  'Sari Wulandari',
];

const PERIHAL: Record<string, string[]> = {
  FIN: [
    'Invoice Termin III Portal Hubud',
    'Penagihan Layanan Pemeliharaan',
    'Kuitansi Pembayaran Termin II',
    'Permintaan Pembayaran Lisensi',
    'Laporan Penerimaan Pembayaran',
  ],
  ADM: [
    'Balasan Permohonan Kerja Praktik',
    'Undangan Rapat Koordinasi',
    'Pemberitahuan Perubahan Jadwal',
    'Surat Keterangan Aktif Bekerja',
  ],
  HR: [
    'Surat Tugas Pendampingan Instalasi',
    'Pemberitahuan Penempatan Pegawai',
    'Surat Peringatan Pertama',
  ],
  DIR: ['Perjanjian Kerja Sama Pengembangan Sistem', 'Nota Dinas Persetujuan Anggaran'],
  MKT: ['Penawaran Layanan Jaringan', 'Konfirmasi Jadwal Pemaparan Produk'],
  ENG: ['Berita Acara Serah Terima Perangkat', 'Laporan Hasil Uji Fungsional'],
};

/** Tanggal mundur dari 2026-08-28, kira-kira satu surat tiap dua hari. */
function tanggalKe(i: number) {
  const d = new Date(Date.UTC(2026, 7, 28));
  d.setUTCDate(d.getUTCDate() - i * 2);
  return d.toISOString().slice(0, 10);
}

/**
 * Merangkai nomor dari pola yang tersimpan pada aturan penomoran.
 * Fungsi yang sama dipakai handler saat surat baru disimpan, sehingga
 * mengubah pola di layar 16 langsung terlihat pada surat berikutnya.
 */
export function rangkaiNomor(opsi: {
  urut: number;
  bagianKode: string;
  kodeJenis: string;
  tanggal: string;
}) {
  const [, kodeDua] = opsi.kodeJenis.split('.');
  return PENOMORAN.format_nomor
    .replace('{urut}', String(opsi.urut).padStart(PENOMORAN.panjang_nomor_urut, '0'))
    .replace('{bagian}', opsi.bagianKode)
    .replace('{kode}', kodeDua ?? opsi.kodeJenis)
    .replace('{perusahaan}', PENOMORAN.kode_perusahaan)
    .replace('{bulan_romawi}', bulanRomawiDari(opsi.tanggal))
    .replace('{tahun}', opsi.tanggal.slice(0, 4));
}

export interface CatatanSuratKeluar extends SuratKeluar {
  /** Kolom bantu pencarian, tidak ikut dikirim ke klien. */
  _cari: string;
}

export function keRingkasKeluar(s: CatatanSuratKeluar): SuratKeluar {
  const { _cari: _abaikan, ...sisa } = s;
  return sisa;
}

export const SURAT_KELUAR: CatatanSuratKeluar[] = (() => {
  const hasil: CatatanSuratKeluar[] = [];
  const tahun = 2026;
  const nomorTerakhir = PENOMORAN.counter.find((c) => c.tahun === tahun)?.nomor_terakhir ?? 467;

  /*
   * Surat selalu lahir dari sebuah template, jadi urutannya template dulu —
   * jenis surat dan bagian mengikutinya. Kalau dibalik, ada surat yang
   * jenisnya tidak punya template dan detailnya menampilkan kolom milik
   * jenis lain.
   */
  const aktif = TEMPLATE.filter((t) => t.is_active);

  for (let i = 0; i < 96; i++) {
    const urut = nomorTerakhir - i;
    const template = aktif[i % aktif.length];
    const jenis =
      JENIS_SURAT.find((j) => j.id === template.jenis_surat.id) ?? JENIS_SURAT[0];
    const bagian = BAGIAN.find((b) => b.id === jenis.bagian.id) ?? BAGIAN[0];
    const daftarPerihal = PERIHAL[bagian.kode] ?? PERIHAL.ADM;
    const perihal = daftarPerihal[i % daftarPerihal.length];
    const tanggal = tanggalKe(i);

    const nomorSurat = rangkaiNomor({
      urut,
      bagianKode: bagian.kode,
      kodeJenis: jenis.kode,
      tanggal,
    });

    /* Sebagian kecil surat keluar merupakan balasan surat masuk (B-9). */
    const membalas =
      i % 7 === 3
        ? {
            id: 135 - i,
            nomor_agenda: `${String(135 - i).padStart(4, '0')}/2026`,
            perihal: 'Permohonan Kerja Praktik',
          }
        : null;

    hasil.push({
      id: urut,
      nomor_urut: urut,
      nomor_surat: nomorSurat,
      tahun,
      tanggal_surat: tanggal,
      kepada: TUJUAN[i % TUJUAN.length],
      perihal,
      pic: PIC[i % PIC.length],
      bagian: { id: bagian.id, kode: bagian.kode, nama: bagian.nama },
      jenis_surat: { id: jenis.id, kode: jenis.kode, nama: jenis.nama },
      template: { id: template.id, nama: template.nama },
      membalas_surat_masuk: membalas,
      /* Isi mengikuti field yang benar-benar dimiliki template. */
      data_dinamis: Object.fromEntries(
        template.fields.map((f) => {
          switch (f.field_key) {
            case 'kepada':
              return [f.field_key, TUJUAN[i % TUJUAN.length]];
            case 'perihal':
              return [f.field_key, perihal];
            case 'tanggal':
              return [f.field_key, tanggal];
            case 'pic':
              return [f.field_key, PIC[i % PIC.length]];
            case 'nilai':
              return [f.field_key, 12_500_000 + (i % 9) * 1_750_000];
            case 'termin':
              return [f.field_key, (i % 4) + 1];
            case 'tembusan':
              return [f.field_key, i % 3 === 0 ? 'Arsip' : ''];
            default:
              return [
                f.field_key,
                'Bersama surat ini kami sampaikan hal sebagaimana tersebut pada perihal di atas, untuk menjadi perhatian.',
              ];
          }
        }),
      ),
      dibuat_pada: `${tanggal}T09:${String(10 + (i % 45)).padStart(2, '0')}:00+07:00`,
      _cari: `${nomorSurat} ${perihal} ${TUJUAN[i % TUJUAN.length]}`.toLowerCase(),
    });
  }

  return hasil;
})();

/**
 * Mengambil nomor urut berikutnya sekaligus menaikkan counter.
 * Di server langkah ini satu transaksi terkunci, sehingga dua Admin yang
 * menyimpan bersamaan tidak memperoleh nomor yang sama (B-6).
 */
export function nomorUrutBerikutnya(tahun: number) {
  let counter = PENOMORAN.counter.find((c) => c.tahun === tahun);
  if (!counter) {
    counter = { tahun, nomor_terakhir: 0 };
    PENOMORAN.counter.unshift(counter);
  }
  counter.nomor_terakhir += 1;
  return counter.nomor_terakhir;
}
