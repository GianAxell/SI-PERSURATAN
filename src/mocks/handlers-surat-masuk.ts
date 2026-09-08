import { http, HttpResponse } from 'msw';
import { SURAT_MASUK, keRingkas, nomorAgendaBerikutnya, pdfContoh } from './surat-masuk';
import { gagal, halaman, jeda, penggunaDari, sukses } from './util';
import type { CatatanSurat } from './surat-masuk';
import type { StatusDisposisi } from '@/types';

const PEGAWAI_PENERIMA = [
  { id: 12, nama: 'Budi Santoso — FIN Keuangan' },
  { id: 13, nama: 'Sari Wulandari — ADM Administrasi' },
  { id: 14, nama: 'Agus Prasetyo — HR Personalia' },
  { id: 15, nama: 'Dewi Lestari — MKT Pengembangan' },
  { id: 16, nama: 'Rizky Ramadhan — ENG Engineer' },
];

/** Surat keluar yang belum menjadi balasan surat masuk mana pun (K-12). */
const SURAT_KELUAR_TERSEDIA = Array.from({ length: 12 }, (_, i) => ({
  id: 468 - i,
  nomor_surat: `${468 - i}/FIN.03/Digitak/VIII/2026`,
  tanggal_surat: '2026-08-02',
  perihal: 'Invoice Termin III Portal Hubud',
  kepada: 'PT Fiber Media Indonesia',
}));

/**
 * Ringkasan status surat dihitung, bukan disimpan (§3.3 kontrak):
 * null bila belum ada disposisi · belum_dibaca bila ada satu pun yang belum
 * dibaca · selesai bila semuanya selesai · selain itu diproses.
 */
function ringkasStatus(s: CatatanSurat): StatusDisposisi | null {
  if (s.disposisi.length === 0) return null;
  if (s.disposisi.some((d) => d.status === 'belum_dibaca')) return 'belum_dibaca';
  if (s.disposisi.every((d) => d.status === 'selesai')) return 'selesai';
  return 'diproses';
}

export const handlersSuratMasuk = [
  http.get('/api/surat-masuk', async ({ request }) => {
    if (!penggunaDari(request)) return gagal(401, 'Sesi tidak valid');
    await jeda();

    const url = new URL(request.url);
    const q = (url.searchParams.get('q') ?? '').toLowerCase().trim();
    const status = url.searchParams.get('status');
    const dari = url.searchParams.get('tanggal_dari');
    const sampai = url.searchParams.get('tanggal_sampai');
    const page = Number(url.searchParams.get('page') ?? 1);
    const limit = Number(url.searchParams.get('limit') ?? 10);

    let hasil = SURAT_MASUK.map((s) => ({ ...s, status_disposisi: ringkasStatus(s) }));

    if (q) hasil = hasil.filter((s) => s._cari.includes(q));
    if (status === 'belum_didisposisi') {
      hasil = hasil.filter((s) => s.status_disposisi === null);
    } else if (status) {
      hasil = hasil.filter((s) => s.status_disposisi === status);
    }
    if (dari) hasil = hasil.filter((s) => s.tanggal_surat >= dari);
    if (sampai) hasil = hasil.filter((s) => s.tanggal_surat <= sampai);

    const { data, meta } = halaman(hasil.map(keRingkas), page, limit);
    return sukses(data, meta);
  }),

  http.post('/api/surat-masuk', async ({ request }) => {
    const user = penggunaDari(request);
    if (!user) return gagal(401, 'Sesi tidak valid');
    if (user.role !== 'admin') return gagal(403, 'Hanya Admin yang dapat meregistrasi surat');

    const form = await request.formData();
    const ambilTeks = (k: string) => String(form.get(k) ?? '').trim();
    const berkas = form.get('file');

    const galat = [];
    for (const wajib of ['nomor_surat', 'tanggal_surat', 'perihal', 'pic', 'pengirim']) {
      if (!ambilTeks(wajib)) {
        galat.push({ field: wajib, message: 'Kolom ini wajib diisi' });
      }
    }
    if (!(berkas instanceof File)) {
      galat.push({ field: 'file', message: 'Dokumen surat wajib diunggah' });
    } else {
      /* Server memvalidasi ulang; validasi di klien hanya kenyamanan (B-13). */
      if (berkas.type !== 'application/pdf') {
        galat.push({ field: 'file', message: 'Berkas harus berformat PDF' });
      } else if (berkas.size > 10 * 1024 * 1024) {
        return gagal(413, 'Ukuran berkas melebihi 10 MB');
      }
    }
    if (galat.length) return gagal(400, 'Validasi gagal', galat);

    const nomorSurat = ambilTeks('nomor_surat');
    if (SURAT_MASUK.some((s) => s.nomor_surat === nomorSurat)) {
      return gagal(409, `Nomor surat ${nomorSurat} sudah pernah diregistrasi`);
    }

    /* Nomor agenda dibuat sistem, bukan dikirim frontend (K-5). */
    const { id, nomor } = nomorAgendaBerikutnya();
    const namaBerkas = berkas instanceof File ? berkas.name : `${nomor}.pdf`;

    const baru: CatatanSurat = {
      id,
      nomor_agenda: nomor,
      nomor_surat: nomorSurat,
      tanggal_surat: ambilTeks('tanggal_surat'),
      perihal: ambilTeks('perihal'),
      pengirim: ambilTeks('pengirim'),
      pic: ambilTeks('pic'),
      keterangan: ambilTeks('keterangan') || null,
      status_disposisi: null,
      berkas: {
        nama: namaBerkas,
        ukuran: berkas instanceof File ? berkas.size : 0,
      },
      surat_balasan: null,
      disposisi: [],
      dibuat_oleh: { id: user.id, nama: user.nama },
      dibuat_pada: new Date().toISOString(),
      _cari: `${nomorSurat} ${ambilTeks('perihal')} ${ambilTeks('pengirim')}`.toLowerCase(),
    };

    SURAT_MASUK.unshift(baru);
    return sukses(baru, undefined, 'Surat masuk berhasil diregistrasi');
  }),

  http.get('/api/surat-masuk/:id', async ({ request, params }) => {
    if (!penggunaDari(request)) return gagal(401, 'Sesi tidak valid');
    await jeda();

    const surat = SURAT_MASUK.find((s) => s.id === Number(params.id));
    if (!surat) return gagal(404, 'Surat masuk tidak ditemukan');

    return sukses({ ...surat, status_disposisi: ringkasStatus(surat) });
  }),

  http.get('/api/surat-masuk/:id/file', ({ request, params }) => {
    if (!penggunaDari(request)) return gagal(401, 'Sesi tidak valid');

    const surat = SURAT_MASUK.find((s) => s.id === Number(params.id));
    if (!surat) return gagal(404, 'Berkas tidak ditemukan');

    return new HttpResponse(pdfContoh(`${surat.nomor_agenda} — ${surat.perihal}`), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${surat.berkas?.nama ?? 'surat.pdf'}"`,
      },
    });
  }),

  http.post('/api/surat-masuk/:id/disposisi', async ({ request, params }) => {
    const user = penggunaDari(request);
    if (!user) return gagal(401, 'Sesi tidak valid');
    if (user.role !== 'admin') return gagal(403, 'Hanya Admin yang dapat membuat disposisi');

    const surat = SURAT_MASUK.find((s) => s.id === Number(params.id));
    if (!surat) return gagal(404, 'Surat masuk tidak ditemukan');

    const body = (await request.json()) as {
      pegawai_id: number;
      instruksi: string;
      batas_waktu: string | null;
    };

    const penerima = PEGAWAI_PENERIMA.find((p) => p.id === body.pegawai_id);
    if (!penerima) {
      return gagal(400, 'Validasi gagal', [
        { field: 'pegawai_id', message: 'Pegawai penerima tidak dikenali' },
      ]);
    }

    const baru = {
      id: Date.now(),
      penerima: { id: penerima.id, nama: penerima.nama.split(' — ')[0] },
      pemberi: { id: user.id, nama: user.nama },
      instruksi: body.instruksi,
      batas_waktu: body.batas_waktu,
      status: 'belum_dibaca' as StatusDisposisi,
      terlambat: false,
      dibuat_pada: new Date().toISOString(),
      dibaca_pada: null,
      selesai_pada: null,
      hasil_tindak_lanjut: null,
    };
    surat.disposisi.push(baru);

    return sukses(baru, undefined, 'Disposisi berhasil dibuat');
  }),

  http.patch('/api/surat-masuk/:id/surat-balasan', async ({ request, params }) => {
    const user = penggunaDari(request);
    if (!user) return gagal(401, 'Sesi tidak valid');

    const surat = SURAT_MASUK.find((s) => s.id === Number(params.id));
    if (!surat) return gagal(404, 'Surat masuk tidak ditemukan');

    const { surat_keluar_id } = (await request.json()) as { surat_keluar_id: number };
    const keluar = SURAT_KELUAR_TERSEDIA.find((s) => s.id === surat_keluar_id);
    if (!keluar) return gagal(404, 'Surat keluar tidak ditemukan');

    /* Satu surat keluar hanya boleh menjadi balasan satu surat masuk (B-9). */
    const sudahDipakai = SURAT_MASUK.find(
      (s) => s.surat_balasan?.id === surat_keluar_id && s.id !== surat.id,
    );
    if (sudahDipakai) {
      return gagal(
        409,
        `Surat ${keluar.nomor_surat} sudah menjadi balasan untuk surat ${sudahDipakai.nomor_agenda}`,
      );
    }

    surat.surat_balasan = { id: keluar.id, nomor_surat: keluar.nomor_surat };
    return sukses(surat.surat_balasan, undefined, 'Surat balasan berhasil ditautkan');
  }),

  http.get('/api/pegawai/penerima-disposisi', ({ request }) => {
    if (!penggunaDari(request)) return gagal(401, 'Sesi tidak valid');
    const q = (new URL(request.url).searchParams.get('q') ?? '').toLowerCase();
    return sukses(
      PEGAWAI_PENERIMA.filter((p) => p.nama.toLowerCase().includes(q)),
    );
  }),

  http.get('/api/surat-keluar/tersedia', ({ request }) => {
    if (!penggunaDari(request)) return gagal(401, 'Sesi tidak valid');
    const q = (new URL(request.url).searchParams.get('q') ?? '').toLowerCase();
    const dipakai = new Set(
      SURAT_MASUK.map((s) => s.surat_balasan?.id).filter(Boolean) as number[],
    );
    return sukses(
      SURAT_KELUAR_TERSEDIA.filter(
        (s) =>
          !dipakai.has(s.id) &&
          `${s.nomor_surat} ${s.perihal} ${s.kepada}`.toLowerCase().includes(q),
      ),
    );
  }),
];
