import { http } from 'msw';
import { SURAT_MASUK } from './surat-masuk';
import { gagal, halaman, jeda, penggunaDari, sukses } from './util';
import type { CatatanSurat, DisposisiMock } from './surat-masuk';
import type { RiwayatDisposisi, StatusDisposisi, User } from '@/types';

/*
 * Disposisi disimpan di dalam surat, sama seperti relasinya di database
 * (satu surat punya banyak disposisi, satu disposisi satu penerima — K-2).
 * Handler ini hanya meratakan bentuk itu menjadi daftar.
 */

/** Akun pengguna → data pegawai. Dua entitas terpisah (K-11). */
const PEGAWAI_DARI_USER: Record<number, number> = { 3: 12 };

const RIWAYAT: Record<number, RiwayatDisposisi[]> = {};
let nomorRiwayat = 1;

function catat(
  d: DisposisiMock,
  lama: StatusDisposisi | null,
  baru: StatusDisposisi,
  aktor: { id: number; nama: string },
  waktu: string,
  catatan: string | null = null,
) {
  RIWAYAT[d.id] ??= [];
  RIWAYAT[d.id].push({
    id: nomorRiwayat++,
    status_lama: lama,
    status_baru: baru,
    catatan,
    aktor,
    waktu,
  });
}

/** Riwayat awal dibangun dari keadaan setiap disposisi contoh. */
function siapkanRiwayat(d: DisposisiMock) {
  if (RIWAYAT[d.id]) return;
  catat(d, null, 'belum_dibaca', d.pemberi, d.dibuat_pada);
  if (d.dibaca_pada) catat(d, 'belum_dibaca', 'diproses', d.penerima, d.dibaca_pada);
  if (d.selesai_pada) {
    catat(d, 'diproses', 'selesai', d.penerima, d.selesai_pada, d.hasil_tindak_lanjut);
  }
}

interface Rata {
  d: DisposisiMock;
  surat: CatatanSurat;
}

function semuaDisposisi(): Rata[] {
  const hasil: Rata[] = [];
  for (const surat of SURAT_MASUK) {
    for (const d of surat.disposisi) {
      siapkanRiwayat(d);
      hasil.push({ d, surat });
    }
  }
  return hasil;
}

function cari(id: number) {
  return semuaDisposisi().find((r) => r.d.id === id) ?? null;
}

/** Terlambat dihitung saat query, bukan kolom tersimpan (B-7). */
function terlambat(d: DisposisiMock) {
  if (!d.batas_waktu || d.status === 'selesai') return false;
  return new Date(d.batas_waktu) < new Date(new Date().toISOString().slice(0, 10));
}

function keKartuSaya({ d, surat }: Rata) {
  return {
    id: d.id,
    status: d.status,
    terlambat: terlambat(d),
    instruksi: d.instruksi,
    batas_waktu: d.batas_waktu,
    dibuat_pada: d.dibuat_pada,
    selesai_pada: d.selesai_pada,
    surat: {
      id: surat.id,
      nomor_agenda: surat.nomor_agenda,
      perihal: surat.perihal,
      pengirim: surat.pengirim,
    },
  };
}

function keDetail({ d, surat }: Rata) {
  return {
    id: d.id,
    status: d.status,
    terlambat: terlambat(d),
    instruksi: d.instruksi,
    batas_waktu: d.batas_waktu,
    hasil_tindak_lanjut: d.hasil_tindak_lanjut,
    pemberi: { ...d.pemberi, role: 'admin' as const },
    penerima: d.penerima,
    dibuat_pada: d.dibuat_pada,
    dibaca_pada: d.dibaca_pada,
    selesai_pada: d.selesai_pada,
    surat: {
      id: surat.id,
      nomor_agenda: surat.nomor_agenda,
      perihal: surat.perihal,
      pengirim: surat.pengirim,
      berkas: surat.berkas,
    },
  };
}

/** Pegawai hanya boleh menyentuh disposisi miliknya (B-8, K-17). */
function berhak(user: User, r: Rata) {
  if (user.role === 'admin') return true;
  return r.d.penerima.id === PEGAWAI_DARI_USER[user.id];
}

export const handlersDisposisi = [
  http.get('/api/disposisi/saya', async ({ request }) => {
    const user = penggunaDari(request);
    if (!user) return gagal(401, 'Sesi tidak valid');
    if (user.role !== 'pegawai') return gagal(403, 'Halaman ini untuk Pegawai');
    await jeda();

    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const q = (url.searchParams.get('q') ?? '').toLowerCase().trim();
    const dari = url.searchParams.get('tanggal_dari');
    const sampai = url.searchParams.get('tanggal_sampai');
    const page = Number(url.searchParams.get('page') ?? 1);
    const limit = Number(url.searchParams.get('limit') ?? 10);

    const pegawaiId = PEGAWAI_DARI_USER[user.id];
    const milikSaya = semuaDisposisi().filter((r) => r.d.penerima.id === pegawaiId);

    /* Hitungan tab dihitung atas seluruh data pegawai, bukan halaman ini. */
    const hitungan = {
      semua: milikSaya.length,
      belum_dibaca: milikSaya.filter((r) => r.d.status === 'belum_dibaca').length,
      diproses: milikSaya.filter((r) => r.d.status === 'diproses').length,
      selesai: milikSaya.filter((r) => r.d.status === 'selesai').length,
    };

    let hasil = milikSaya;
    if (status) hasil = hasil.filter((r) => r.d.status === status);
    if (q) {
      hasil = hasil.filter((r) =>
        `${r.surat.nomor_agenda} ${r.surat.perihal} ${r.surat.pengirim}`
          .toLowerCase()
          .includes(q),
      );
    }
    if (dari) hasil = hasil.filter((r) => r.d.dibuat_pada.slice(0, 10) >= dari);
    if (sampai) hasil = hasil.filter((r) => r.d.dibuat_pada.slice(0, 10) <= sampai);

    const { data, meta } = halaman(hasil.map(keKartuSaya), page, limit);
    return sukses(data, { ...meta, hitungan });
  }),

  http.get('/api/disposisi', async ({ request }) => {
    const user = penggunaDari(request);
    if (!user) return gagal(401, 'Sesi tidak valid');
    if (user.role !== 'admin') return gagal(403, 'Halaman ini untuk Admin');
    await jeda();

    const url = new URL(request.url);
    const q = (url.searchParams.get('q') ?? '').toLowerCase().trim();
    const page = Number(url.searchParams.get('page') ?? 1);
    const limit = Number(url.searchParams.get('limit') ?? 10);

    let hasil = semuaDisposisi();
    if (q) {
      hasil = hasil.filter((r) =>
        `${r.surat.nomor_agenda} ${r.surat.perihal} ${r.d.penerima.nama}`
          .toLowerCase()
          .includes(q),
      );
    }

    const ringkas = hasil.map(({ d, surat }) => ({
      id: d.id,
      status: d.status,
      terlambat: terlambat(d),
      instruksi: d.instruksi,
      batas_waktu: d.batas_waktu,
      dibuat_pada: d.dibuat_pada,
      penerima: d.penerima,
      pemberi: d.pemberi,
      surat: { id: surat.id, nomor_agenda: surat.nomor_agenda, perihal: surat.perihal },
    }));

    const { data, meta } = halaman(ringkas, page, limit);
    return sukses(data, meta);
  }),

  http.get('/api/disposisi/:id', async ({ request, params }) => {
    const user = penggunaDari(request);
    if (!user) return gagal(401, 'Sesi tidak valid');
    await jeda();

    const r = cari(Number(params.id));
    if (!r) return gagal(404, 'Disposisi tidak ditemukan');
    if (!berhak(user, r)) return gagal(403, 'Disposisi ini bukan untuk Anda');

    return sukses(keDetail(r));
  }),

  http.get('/api/disposisi/:id/riwayat', ({ request, params }) => {
    const user = penggunaDari(request);
    if (!user) return gagal(401, 'Sesi tidak valid');

    const r = cari(Number(params.id));
    if (!r) return gagal(404, 'Disposisi tidak ditemukan');
    if (!berhak(user, r)) return gagal(403, 'Disposisi ini bukan untuk Anda');

    return sukses(RIWAYAT[r.d.id] ?? []);
  }),

  /*
   * Idempotent (B-3): panggilan kedua tidak mengubah apa pun dan tetap 200.
   * React StrictMode memanggilnya dua kali saat development.
   */
  http.patch('/api/disposisi/:id/baca', ({ request, params }) => {
    const user = penggunaDari(request);
    if (!user) return gagal(401, 'Sesi tidak valid');

    const r = cari(Number(params.id));
    if (!r) return gagal(404, 'Disposisi tidak ditemukan');
    if (!berhak(user, r)) return gagal(403, 'Disposisi ini bukan untuk Anda');

    if (r.d.status === 'belum_dibaca') {
      const waktu = new Date().toISOString();
      r.d.status = 'diproses';
      r.d.dibaca_pada = waktu;
      catat(r.d, 'belum_dibaca', 'diproses', r.d.penerima, waktu);
    }
    return sukses(keDetail(r));
  }),

  http.patch('/api/disposisi/:id/status', async ({ request, params }) => {
    const user = penggunaDari(request);
    if (!user) return gagal(401, 'Sesi tidak valid');

    const r = cari(Number(params.id));
    if (!r) return gagal(404, 'Disposisi tidak ditemukan');
    if (!berhak(user, r)) return gagal(403, 'Disposisi ini bukan untuk Anda');

    const body = (await request.json()) as {
      status: StatusDisposisi;
      hasil_tindak_lanjut?: string;
    };

    /* Status hanya boleh maju (B-5). */
    const urut: StatusDisposisi[] = ['belum_dibaca', 'diproses', 'selesai'];
    if (urut.indexOf(body.status) <= urut.indexOf(r.d.status)) {
      return gagal(409, 'Status disposisi tidak dapat dikembalikan ke tahap sebelumnya');
    }

    const waktu = new Date().toISOString();
    const lama = r.d.status;
    r.d.status = body.status;
    if (body.hasil_tindak_lanjut) r.d.hasil_tindak_lanjut = body.hasil_tindak_lanjut;
    if (body.status === 'diproses' && !r.d.dibaca_pada) r.d.dibaca_pada = waktu;
    if (body.status === 'selesai') r.d.selesai_pada = waktu;

    catat(r.d, lama, body.status, r.d.penerima, waktu, body.hasil_tindak_lanjut ?? null);

    return sukses(keDetail(r), undefined, 'Perubahan tersimpan');
  }),
];
