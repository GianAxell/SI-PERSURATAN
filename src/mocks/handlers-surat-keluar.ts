import { http, HttpResponse } from 'msw';
import { SURAT_KELUAR, keRingkasKeluar, nomorUrutBerikutnya, rangkaiNomor } from './surat-keluar';
import { SURAT_MASUK, pdfContoh } from './surat-masuk';
import { BAGIAN, JENIS_SURAT, TEMPLATE } from './master';
import { gagal, halaman, jeda, penggunaDari, sukses } from './util';
import type { CatatanSuratKeluar } from './surat-keluar';
import type { ApiFieldError } from '@/types';

export const handlersSuratKeluar = [
  /* Layar 07 — daftar. Filter tahun, bagian, dan jenis surat dipisah agar
     dropdown pada toolbar bisa dikombinasikan tanpa saling menimpa. */
  http.get('/api/surat-keluar', async ({ request }) => {
    const user = penggunaDari(request);
    if (!user) return gagal(401, 'Sesi tidak valid');
    if (user.role !== 'admin') return gagal(403, 'Halaman ini hanya untuk Admin');
    await jeda();

    const url = new URL(request.url);
    const q = (url.searchParams.get('q') ?? '').toLowerCase().trim();
    const tahun = url.searchParams.get('tahun');
    const bagianId = url.searchParams.get('bagian_id');
    const jenisId = url.searchParams.get('jenis_surat_id');
    const page = Number(url.searchParams.get('page') ?? 1);
    const limit = Number(url.searchParams.get('limit') ?? 10);

    let hasil = [...SURAT_KELUAR];
    if (q) hasil = hasil.filter((s) => s._cari.includes(q));
    if (tahun) hasil = hasil.filter((s) => String(s.tahun) === tahun);
    if (bagianId) hasil = hasil.filter((s) => String(s.bagian.id) === bagianId);
    if (jenisId) hasil = hasil.filter((s) => String(s.jenis_surat.id) === jenisId);

    hasil.sort((a, b) => b.nomor_urut - a.nomor_urut);

    const { data, meta } = halaman(hasil.map(keRingkasKeluar), page, limit);
    return sukses(data, meta);
  }),

  /* Surat keluar yang belum menjadi balasan surat masuk mana pun (K-12). */
  http.get('/api/surat-keluar/tersedia', ({ request }) => {
    const user = penggunaDari(request);
    if (!user) return gagal(401, 'Sesi tidak valid');

    const q = (new URL(request.url).searchParams.get('q') ?? '').toLowerCase();
    const dipakai = new Set(
      SURAT_MASUK.map((s) => s.surat_balasan?.id).filter(Boolean) as number[],
    );

    return sukses(
      SURAT_KELUAR.filter((s) => !dipakai.has(s.id) && s._cari.includes(q))
        .slice(0, 20)
        .map((s) => ({
          id: s.id,
          nomor_surat: s.nomor_surat,
          tanggal_surat: s.tanggal_surat,
          perihal: s.perihal,
          kepada: s.kepada,
        })),
    );
  }),

  http.get('/api/surat-keluar/:id', async ({ request, params }) => {
    const user = penggunaDari(request);
    if (!user) return gagal(401, 'Sesi tidak valid');
    if (user.role !== 'admin') return gagal(403, 'Halaman ini hanya untuk Admin');
    await jeda();

    const surat = SURAT_KELUAR.find((s) => s.id === Number(params.id));
    if (!surat) return gagal(404, 'Surat keluar tidak ditemukan');
    return sukses(keRingkasKeluar(surat));
  }),

  /*
   * Layar 09 → 10. Nomor baru diambil di sini, bukan saat pratinjau (K-7),
   * sehingga membatalkan wizard tidak memakan satu nomor.
   */
  http.post('/api/surat-keluar', async ({ request }) => {
    const user = penggunaDari(request);
    if (!user) return gagal(401, 'Sesi tidak valid');
    if (user.role !== 'admin') return gagal(403, 'Hanya Admin yang dapat membuat surat keluar');
    await jeda();

    const body = (await request.json()) as {
      template_id: number;
      tanggal_surat: string;
      kepada: string;
      perihal: string;
      pic: string | null;
      data_dinamis: Record<string, unknown>;
    };

    const template = TEMPLATE.find((t) => t.id === body.template_id);
    if (!template) {
      return gagal(400, 'Validasi gagal', [
        { field: 'template_id', message: 'Template tidak dikenali' },
      ]);
    }
    if (!template.is_active) {
      return gagal(409, `Template ${template.nama} sedang nonaktif`);
    }

    const galat: ApiFieldError[] = [];
    if (!body.tanggal_surat) {
      galat.push({ field: 'tanggal_surat', message: 'Tanggal surat wajib diisi' });
    }
    if (!body.kepada?.trim()) galat.push({ field: 'kepada', message: 'Kolom ini wajib diisi' });
    if (!body.perihal?.trim()) galat.push({ field: 'perihal', message: 'Kolom ini wajib diisi' });

    /* Server memvalidasi ulang field dinamis; validasi klien hanya kenyamanan. */
    for (const f of template.fields) {
      if (!f.is_required) continue;
      const nilai = body.data_dinamis?.[f.field_key];
      if (nilai === undefined || nilai === null || String(nilai).trim() === '') {
        if (!galat.some((g) => g.field === f.field_key)) {
          galat.push({ field: f.field_key, message: `${f.label} wajib diisi` });
        }
      }
    }
    if (galat.length) return gagal(400, 'Validasi gagal', galat);

    const tahun = Number(body.tanggal_surat.slice(0, 4));
    const urut = nomorUrutBerikutnya(tahun);
    const nomorSurat = rangkaiNomor({
      urut,
      bagianKode: template.jenis_surat.kode.split('.')[0],
      kodeJenis: template.jenis_surat.kode,
      tanggal: body.tanggal_surat,
    });

    /* Bagian diambil dari jenis surat, bukan dikirim frontend — satu sumber. */
    const jenis = JENIS_SURAT.find((j) => j.id === template.jenis_surat.id);
    const bagian = jenis?.bagian ?? BAGIAN[0];

    const baru: CatatanSuratKeluar = {
      id: urut,
      nomor_urut: urut,
      nomor_surat: nomorSurat,
      tahun,
      tanggal_surat: body.tanggal_surat,
      kepada: body.kepada.trim(),
      perihal: body.perihal.trim(),
      pic: body.pic?.trim() || null,
      bagian: { id: bagian.id, kode: bagian.kode, nama: bagian.nama },
      jenis_surat: template.jenis_surat,
      template: { id: template.id, nama: template.nama },
      /* Tautan balasan dibuat lewat PATCH /surat-masuk/:id/surat-balasan
         (layar 12), bukan di sini — satu fakta, satu jalan tulis. */
      membalas_surat_masuk: null,
      /* Empat kolom tetap juga ikut masuk data_dinamis (§3.9 kontrak). */
      data_dinamis: {
        ...body.data_dinamis,
        kepada: body.kepada.trim(),
        perihal: body.perihal.trim(),
        tanggal: body.tanggal_surat,
        pic: body.pic ?? null,
      },
      dibuat_pada: new Date().toISOString(),
      _cari: `${nomorSurat} ${body.perihal} ${body.kepada}`.toLowerCase(),
    };

    SURAT_KELUAR.unshift(baru);
    return sukses(keRingkasKeluar(baru), undefined, 'Surat keluar berhasil dibuat');
  }),

  http.get('/api/surat-keluar/:id/file', ({ request, params }) => {
    const user = penggunaDari(request);
    if (!user) return gagal(401, 'Sesi tidak valid');

    const surat = SURAT_KELUAR.find((s) => s.id === Number(params.id));
    if (!surat) return gagal(404, 'Berkas tidak ditemukan');

    return new HttpResponse(pdfContoh(`${surat.nomor_surat} — ${surat.perihal}`), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${surat.nomor_surat.replace(/\//g, '-')}.pdf"`,
      },
    });
  }),
];
