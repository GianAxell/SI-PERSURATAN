import type {
  DisposisiPadaSurat,
  StatusDisposisi,
  SuratMasukDetail,
  SuratMasukRingkas,
} from '@/types';

/*
 * Data contoh surat masuk. Jumlahnya 134, sama dengan angka yang tertulis
 * pada layar 02 Figma ("Menampilkan 1 sampai 9 dari 134 surat"), supaya
 * pagination benar-benar teruji dan bukan sekadar tampil.
 */

const PENGIRIM = [
  'Rektor Institut Teknologi Garut',
  'PT Fiber Media Indonesia',
  'Dinas Komunikasi dan Informatika Kab. Garut',
  'SMK Negeri 1 Garut',
  'PT Sinar Terang Nusantara',
  'Universitas Padjadjaran',
  'CV Karya Mandiri',
  'Badan Kepegawaian Daerah',
];

const PERIHAL = [
  'Permohonan Kerja Praktik',
  'Undangan Sosialisasi Modul SPB',
  'Pengajuan Praktek Kerja Lapangan',
  'Permohonan Kerja Sama Pengembangan Sistem',
  'Penawaran Kerja Sama Layanan Jaringan',
  'Permohonan Data Dukung Audit',
  'Undangan Rapat Koordinasi Triwulan',
  'Konfirmasi Jadwal Pemaparan Produk',
];

const PIC = [
  'Seno Prianto',
  'Riski Ramadhan',
  'Dewi Lestari',
  'Agus Prasetyo',
  'Sari Wulandari',
];

const PEGAWAI = [
  { id: 12, nama: 'Budi Santoso' },
  { id: 13, nama: 'Sari Wulandari' },
  { id: 14, nama: 'Agus Prasetyo' },
  { id: 15, nama: 'Dewi Lestari' },
  { id: 16, nama: 'Rizky Ramadhan' },
];

function pad(n: number, panjang = 4) {
  return String(n).padStart(panjang, '0');
}

/**
 * Tanggal mundur dari 2026-09-06, satu surat kira-kira tiap dua hari.
 * Jangkarnya sengaja dekat dengan hari ini: surat masuk terbaru mestinya
 * baru datang, bukan berumur tiga minggu.
 */
function tanggalKe(i: number) {
  const d = new Date(Date.UTC(2026, 8, 6));
  d.setUTCDate(d.getUTCDate() - i * 2);
  return d.toISOString().slice(0, 10);
}

/*
 * Status mengikuti umur surat, bukan sekadar berputar. Surat lama umumnya
 * sudah selesai; yang masih berjalan adalah surat baru. Kalau diputar rata,
 * surat bulan Mei ikut berstatus "belum dibaca" dan seluruh papan menjadi
 * merah oleh penanda terlambat — penanda itu jadi tidak berarti apa-apa.
 */
function statusKe(i: number): StatusDisposisi | null {
  if (i % 7 === 3) return null;

  if (i >= 40) {
    /* Sisakan sedikit yang benar-benar tertinggal, supaya "terlambat" ada
       contohnya tanpa menjadi keadaan mayoritas. */
    return i % 9 === 0 ? 'diproses' : 'selesai';
  }

  const urut: StatusDisposisi[] = ['belum_dibaca', 'diproses', 'selesai'];
  return urut[i % 3];
}

/** Tenggat nyata bervariasi; 4–13 hari sesudah tanggal surat. */
function batasHari(i: number) {
  return 4 + (i % 4) * 3;
}

const INSTRUKSI = [
  'Mohon disiapkan surat balasan dan koordinasi dengan bagian terkait',
  'Tolong ditindaklanjuti dan laporkan hasilnya',
  'Mohon dipelajari, sampaikan pendapat sebelum batas waktu',
  'Harap diarsipkan dan diteruskan ke bagian yang berkepentingan',
  'Mohon disiapkan data pendukung untuk rapat',
  'Silakan dijadwalkan dan konfirmasikan ke pengirim',
];

/**
 * Bentuk internal mock. Selain yang dikirim ke frontend, ia menyimpan waktu
 * dan pelaku perubahan — di server sungguhan ini tersebar di tabel disposisi
 * dan disposisi_riwayat.
 */
export interface DisposisiMock extends DisposisiPadaSurat {
  pemberi: { id: number; nama: string };
  dibuat_pada: string;
  dibaca_pada: string | null;
  selesai_pada: string | null;
  hasil_tindak_lanjut: string | null;
}

export interface CatatanSurat extends Omit<SuratMasukDetail, 'disposisi'> {
  disposisi: DisposisiMock[];
  _cari: string;
}

function buatSurat(i: number): CatatanSurat {
  const nomorAgendaKe = 134 - i;
  const status = statusKe(i);
  const tanggal = tanggalKe(i);
  const pengirim = PENGIRIM[i % PENGIRIM.length];
  const perihal = PERIHAL[i % PERIHAL.length];
  const batasWaktu = new Date(`${tanggal}T00:00:00Z`);
  batasWaktu.setUTCDate(batasWaktu.getUTCDate() + batasHari(i));
  const batas = batasWaktu.toISOString().slice(0, 10);

  const lewat = new Date(batas) < new Date() && status !== 'selesai';

  const PEMBERI = { id: 1, nama: 'Rina Marlina' };
  const jam = (offsetHari: number, waktu: string) => {
    const d = new Date(`${tanggal}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() + offsetHari);
    return `${d.toISOString().slice(0, 10)}T${waktu}+07:00`;
  };

  const disposisi: DisposisiMock[] =
    status === null
      ? []
      : [
          {
            id: 1000 + i,
            penerima: PEGAWAI[i % PEGAWAI.length],
            pemberi: PEMBERI,
            instruksi: INSTRUKSI[i % INSTRUKSI.length],
            batas_waktu: batas,
            status,
            terlambat: lewat,
            dibuat_pada: jam(1, '09:14:00'),
            dibaca_pada: status === 'belum_dibaca' ? null : jam(1, '13:02:00'),
            selesai_pada: status === 'selesai' ? jam(3, '16:40:00') : null,
            hasil_tindak_lanjut:
              status === 'selesai'
                ? 'Surat balasan sudah disiapkan dan diserahkan ke bagian Administrasi.'
                : null,
          },
          ...(i % 5 === 0
            ? [
                {
                  id: 2000 + i,
                  penerima: PEGAWAI[(i + 2) % PEGAWAI.length],
                  pemberi: PEMBERI,
                  instruksi: INSTRUKSI[(i + 3) % INSTRUKSI.length],
                  batas_waktu: batas,
                  status: 'diproses' as StatusDisposisi,
                  /* Batas waktunya sama dengan disposisi pertama, jadi
                     keterlambatannya harus dihitung sama pula. */
                  terlambat: new Date(batas) < new Date(),
                  dibuat_pada: jam(1, '09:20:00'),
                  dibaca_pada: jam(1, '15:05:00'),
                  selesai_pada: null,
                  hasil_tindak_lanjut: null,
                },
              ]
            : []),
        ];

  const nomorAgenda = `${pad(nomorAgendaKe)}/2026`;
  const nomorSurat = `${782 - i}/ITG/A.5/B/VII/2026`;

  return {
    id: nomorAgendaKe,
    nomor_agenda: nomorAgenda,
    nomor_surat: nomorSurat,
    tanggal_surat: tanggal,
    perihal,
    pengirim,
    pic: PIC[i % PIC.length],
    keterangan: i % 3 === 0 ? 'Diteruskan ke bagian Personalia' : null,
    status_disposisi: status,
    berkas: { nama: `${nomorAgenda.replace('/', '-')}.pdf`, ukuran: 380_000 + i * 1200 },
    surat_balasan:
      i % 6 === 1
        ? { id: 400 + i, nomor_surat: `${400 + i}/FIN.03/Digitak/VIII/2026` }
        : null,
    disposisi,
    dibuat_oleh: { id: 1, nama: 'Rina Marlina' },
    dibuat_pada: `${tanggal}T08:40:00+07:00`,
    _cari: `${nomorSurat} ${perihal} ${pengirim}`.toLowerCase(),
  };
}

export const SURAT_MASUK: CatatanSurat[] = Array.from({ length: 134 }, (_, i) =>
  buatSurat(i),
);

export function keRingkas(s: CatatanSurat): SuratMasukRingkas {
  return {
    id: s.id,
    nomor_agenda: s.nomor_agenda,
    nomor_surat: s.nomor_surat,
    tanggal_surat: s.tanggal_surat,
    perihal: s.perihal,
    pengirim: s.pengirim,
    pic: s.pic,
    status_disposisi: s.status_disposisi,
    terlambat: s.disposisi.some((d) => d.terlambat),
  };
}

/** Nomor agenda berikutnya — di server ini hasil transaksi terkunci (B-1). */
export function nomorAgendaBerikutnya() {
  const tertinggi = Math.max(...SURAT_MASUK.map((s) => s.id));
  return { id: tertinggi + 1, nomor: `${pad(tertinggi + 1)}/2026` };
}

/**
 * PDF satu halaman yang dirakit di tempat, supaya pratinjau dan unduh
 * benar-benar bisa dicoba tanpa berkas contoh di repositori.
 */
export function pdfContoh(judul: string) {
  const teks = judul.replace(/[()\\]/g, '');
  const isi = `BT /F1 16 Tf 60 760 Td (${teks}) Tj ET
BT /F1 11 Tf 60 730 Td (Dokumen contoh untuk pengembangan antarmuka.) Tj ET
BT /F1 11 Tf 60 712 Td (Berkas asli akan datang dari server.) Tj ET`;

  const objek = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>',
    `<< /Length ${isi.length} >>\nstream\n${isi}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ];

  let pdf = '%PDF-1.4\n';
  const posisi: number[] = [];
  objek.forEach((o, i) => {
    posisi.push(pdf.length);
    pdf += `${i + 1} 0 obj\n${o}\nendobj\n`;
  });

  const awalXref = pdf.length;
  pdf += `xref\n0 ${objek.length + 1}\n0000000000 65535 f \n`;
  posisi.forEach((p) => {
    pdf += `${String(p).padStart(10, '0')} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objek.length + 1} /Root 1 0 R >>\nstartxref\n${awalXref}\n%%EOF`;

  return new Blob([pdf], { type: 'application/pdf' });
}
