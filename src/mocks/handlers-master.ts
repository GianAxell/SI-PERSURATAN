import { http } from 'msw';
import {
  BAGIAN,
  JENIS_SURAT,
  PEGAWAI,
  PENOMORAN,
  TEMPLATE,
  USERS,
  segarkanJumlahTemplate,
} from './master';
import { gagal, halaman, jeda, penggunaDari, sukses } from './util';
import type { StatusAktif, TemplateField, User } from './../types';

/*
 * Master data. Semua endpoint hanya untuk Admin (§5.6 kontrak).
 *
 * Yang dijaga di sini bukan sekadar bentuk data, melainkan aturan yang
 * membuat data tetap masuk akal: kode unik, satu akun untuk satu pegawai,
 * dan nonaktif yang tidak menghapus apa pun.
 */

function admin(request: Request) {
  const user = penggunaDari(request);
  if (!user) return { galat: gagal(401, 'Sesi tidak valid'), user: null };
  if (user.role !== 'admin') return { galat: gagal(403, 'Halaman ini untuk Admin'), user: null };
  return { galat: null, user };
}

const tanpaPassword = (u: User & { password?: string }) => {
  const { password: _abaikan, ...sisa } = u;
  return sisa;
};

export const handlersMaster = [
  /* ---------- pengguna ---------- */

  http.get('/api/users/tersedia', ({ request }) => {
    const { galat } = admin(request);
    if (galat) return galat;

    const pegawaiId = Number(new URL(request.url).searchParams.get('pegawai_id')) || null;
    const dipakai = new Set(
      PEGAWAI.filter((p) => p.id !== pegawaiId)
        .map((p) => p.user?.id)
        .filter(Boolean) as number[],
    );

    return sukses(
      USERS.filter((u) => u.status === 'aktif' && !dipakai.has(u.id)).map((u) => ({
        id: u.id,
        username: u.username,
        nama: u.nama,
      })),
    );
  }),

  http.get('/api/users', async ({ request }) => {
    const { galat } = admin(request);
    if (galat) return galat;
    await jeda();

    const url = new URL(request.url);
    const q = (url.searchParams.get('q') ?? '').toLowerCase().trim();
    const role = url.searchParams.get('role');
    const page = Number(url.searchParams.get('page') ?? 1);
    const limit = Number(url.searchParams.get('limit') ?? 10);

    let hasil = USERS.map(tanpaPassword);
    if (role) hasil = hasil.filter((u) => u.role === role);
    if (q) {
      hasil = hasil.filter((u) =>
        `${u.nama} ${u.username}`.toLowerCase().includes(q),
      );
    }

    const { data, meta } = halaman(hasil, page, limit);
    return sukses(data, meta);
  }),

  http.post('/api/users', async ({ request }) => {
    const { galat } = admin(request);
    if (galat) return galat;

    const isian = (await request.json()) as Record<string, string | number | null>;
    const username = String(isian.username ?? '').trim();

    if (USERS.some((u) => u.username === username)) {
      return gagal(409, `Nama pengguna ${username} sudah dipakai`);
    }
    if (!isian.password_awal) {
      return gagal(400, 'Validasi gagal', [
        { field: 'password_awal', message: 'Kata sandi awal wajib diisi' },
      ]);
    }

    const bagian = BAGIAN.find((b) => b.id === Number(isian.bagian_id)) ?? null;
    const baru = {
      id: Math.max(...USERS.map((u) => u.id)) + 1,
      nama: String(isian.nama ?? ''),
      username,
      password: String(isian.password_awal),
      role: isian.role as User['role'],
      jabatan: String(isian.jabatan ?? '') || null,
      bagian: bagian ? { id: bagian.id, kode: bagian.kode, nama: bagian.nama } : null,
      status: (isian.status as StatusAktif) ?? 'aktif',
      terakhir_masuk: null,
    };
    USERS.push(baru);
    return sukses(tanpaPassword(baru), undefined, 'Pengguna berhasil ditambahkan');
  }),

  http.put('/api/users/:id', async ({ request, params }) => {
    const { galat, user } = admin(request);
    if (galat) return galat;

    const u = USERS.find((x) => x.id === Number(params.id));
    if (!u) return gagal(404, 'Pengguna tidak ditemukan');

    const isian = (await request.json()) as Record<string, string | number | null>;
    const username = String(isian.username ?? '').trim();

    if (USERS.some((x) => x.username === username && x.id !== u.id)) {
      return gagal(409, `Nama pengguna ${username} sudah dipakai`);
    }

    /*
     * Aturan yang sama dengan PATCH /users/:id/status. Tanpa ini, larangan
     * menonaktifkan akun sendiri bisa dilewati cukup dengan mengubah kolom
     * Status pada formulir — satu aturan harus dijaga di semua pintu masuk.
     */
    if (u.id === user!.id) {
      if (isian.status === 'nonaktif') {
        return gagal(409, 'Anda tidak dapat menonaktifkan akun Anda sendiri');
      }
      if (isian.role && isian.role !== u.role) {
        return gagal(409, 'Anda tidak dapat mengubah role akun Anda sendiri');
      }
    }

    const bagian = BAGIAN.find((b) => b.id === Number(isian.bagian_id)) ?? null;
    u.nama = String(isian.nama ?? u.nama);
    u.username = username || u.username;
    u.role = (isian.role as User['role']) ?? u.role;
    u.jabatan = String(isian.jabatan ?? '') || null;
    u.bagian = bagian ? { id: bagian.id, kode: bagian.kode, nama: bagian.nama } : null;
    u.status = (isian.status as StatusAktif) ?? u.status;
    /* Kata sandi kosong berarti dipertahankan (layar 23). */
    if (isian.password_awal) u.password = String(isian.password_awal);

    return sukses(tanpaPassword(u), undefined, 'Perubahan tersimpan');
  }),

  http.patch('/api/users/:id/status', async ({ request, params }) => {
    const { galat, user } = admin(request);
    if (galat) return galat;

    const u = USERS.find((x) => x.id === Number(params.id));
    if (!u) return gagal(404, 'Pengguna tidak ditemukan');
    if (u.id === user!.id) {
      return gagal(409, 'Anda tidak dapat menonaktifkan akun Anda sendiri');
    }

    const { status } = (await request.json()) as { status: StatusAktif };
    u.status = status;
    return sukses(tanpaPassword(u), undefined, 'Status pengguna diperbarui');
  }),

  /* ---------- pegawai ---------- */

  http.get('/api/pegawai', async ({ request }) => {
    const { galat } = admin(request);
    if (galat) return galat;
    await jeda();

    const url = new URL(request.url);
    const q = (url.searchParams.get('q') ?? '').toLowerCase().trim();
    const page = Number(url.searchParams.get('page') ?? 1);
    const limit = Number(url.searchParams.get('limit') ?? 10);

    let hasil = [...PEGAWAI];
    if (q) {
      hasil = hasil.filter((p) =>
        `${p.nama} ${p.jabatan ?? ''} ${p.nip ?? ''}`.toLowerCase().includes(q),
      );
    }

    const { data, meta } = halaman(hasil, page, limit);
    return sukses(data, meta);
  }),

  http.post('/api/pegawai', async ({ request }) => {
    const { galat } = admin(request);
    if (galat) return galat;

    const isian = (await request.json()) as Record<string, string | number | null>;
    const cek = periksaAkun(Number(isian.user_id) || null, null);
    if (cek) return cek;

    const baru = bentukPegawai(
      Math.max(...PEGAWAI.map((p) => p.id)) + 1,
      isian,
      null,
    );
    if ('galat' in baru) return baru.galat;
    PEGAWAI.push(baru.nilai);
    return sukses(baru.nilai, undefined, 'Pegawai berhasil ditambahkan');
  }),

  http.put('/api/pegawai/:id', async ({ request, params }) => {
    const { galat } = admin(request);
    if (galat) return galat;

    const p = PEGAWAI.find((x) => x.id === Number(params.id));
    if (!p) return gagal(404, 'Pegawai tidak ditemukan');

    const isian = (await request.json()) as Record<string, string | number | null>;
    const cek = periksaAkun(Number(isian.user_id) || null, p.id);
    if (cek) return cek;

    const hasil = bentukPegawai(p.id, isian, p.id);
    if ('galat' in hasil) return hasil.galat;
    Object.assign(p, hasil.nilai);
    return sukses(p, undefined, 'Perubahan tersimpan');
  }),

  /* ---------- bagian ---------- */

  http.get('/api/master/bagian', ({ request }) => {
    const { galat } = admin(request);
    if (galat) return galat;

    const q = (new URL(request.url).searchParams.get('q') ?? '').toLowerCase().trim();
    const hasil = [...BAGIAN]
      .filter((b) => `${b.kode} ${b.nama}`.toLowerCase().includes(q))
      .sort((a, b) => a.urutan_tampil - b.urutan_tampil);
    return sukses(hasil);
  }),

  http.post('/api/master/bagian', async ({ request }) => {
    const { galat } = admin(request);
    if (galat) return galat;

    const isian = (await request.json()) as Record<string, string | number>;
    const kode = String(isian.kode).toUpperCase();
    if (BAGIAN.some((b) => b.kode === kode)) {
      return gagal(409, `Kode bagian ${kode} sudah dipakai`);
    }

    const baru = {
      id: Math.max(...BAGIAN.map((b) => b.id)) + 1,
      kode,
      nama: String(isian.nama),
      jumlah_kode_surat: 0,
      jumlah_surat_tahun_ini: 0,
      urutan_tampil: Number(isian.urutan_tampil) || BAGIAN.length + 1,
      status: (isian.status as StatusAktif) ?? 'aktif',
    };
    BAGIAN.push(baru);
    return sukses(baru, undefined, 'Bagian berhasil ditambahkan');
  }),

  http.put('/api/master/bagian/:id', async ({ request, params }) => {
    const { galat } = admin(request);
    if (galat) return galat;

    const b = BAGIAN.find((x) => x.id === Number(params.id));
    if (!b) return gagal(404, 'Bagian tidak ditemukan');

    const isian = (await request.json()) as Record<string, string | number>;
    const kode = String(isian.kode).toUpperCase();
    if (BAGIAN.some((x) => x.kode === kode && x.id !== b.id)) {
      return gagal(409, `Kode bagian ${kode} sudah dipakai`);
    }

    b.kode = kode;
    b.nama = String(isian.nama);
    b.urutan_tampil = Number(isian.urutan_tampil) || b.urutan_tampil;
    b.status = (isian.status as StatusAktif) ?? b.status;

    /* Kode bagian ikut menyusun kode jenis surat, jadi rujukannya disegarkan. */
    for (const j of JENIS_SURAT) {
      if (j.bagian.id === b.id) {
        j.bagian = { id: b.id, kode: b.kode, nama: b.nama };
        j.kode = `${b.kode}.${j.kode.split('.')[1]}`;
      }
    }

    return sukses(b, undefined, 'Perubahan tersimpan');
  }),

  /* ---------- jenis surat ---------- */

  http.get('/api/master/jenis-surat', ({ request }) => {
    const { galat } = admin(request);
    if (galat) return galat;

    const bagianId = Number(new URL(request.url).searchParams.get('bagian_id')) || null;
    segarkanJumlahTemplate();
    const hasil = JENIS_SURAT.filter((j) => !bagianId || j.bagian.id === bagianId);
    return sukses(hasil);
  }),

  http.post('/api/master/jenis-surat', async ({ request }) => {
    const { galat } = admin(request);
    if (galat) return galat;

    const isian = (await request.json()) as Record<string, string | number>;
    const bagian = BAGIAN.find((b) => b.id === Number(isian.bagian_id));
    if (!bagian) return gagal(400, 'Bagian tidak dikenali');

    const kode = `${bagian.kode}.${String(isian.kode)}`;
    if (JENIS_SURAT.some((j) => j.kode === kode)) {
      return gagal(409, `Kode ${kode} sudah terdaftar`);
    }

    const baru = {
      id: Math.max(...JENIS_SURAT.map((j) => j.id)) + 1,
      kode,
      nama: String(isian.nama),
      bagian: { id: bagian.id, kode: bagian.kode, nama: bagian.nama },
      jumlah_template: 0,
      status: (isian.status as StatusAktif) ?? 'aktif',
    };
    JENIS_SURAT.push(baru);
    bagian.jumlah_kode_surat += 1;
    return sukses(baru, undefined, 'Kode jenis surat ditambahkan');
  }),

  http.put('/api/master/jenis-surat/:id', async ({ request, params }) => {
    const { galat } = admin(request);
    if (galat) return galat;

    const j = JENIS_SURAT.find((x) => x.id === Number(params.id));
    if (!j) return gagal(404, 'Kode jenis surat tidak ditemukan');

    const isian = (await request.json()) as Record<string, string | number>;
    const bagian = BAGIAN.find((b) => b.id === Number(isian.bagian_id));
    if (!bagian) return gagal(400, 'Bagian tidak dikenali');

    const kode = `${bagian.kode}.${String(isian.kode)}`;
    if (JENIS_SURAT.some((x) => x.kode === kode && x.id !== j.id)) {
      return gagal(409, `Kode ${kode} sudah terdaftar`);
    }

    j.kode = kode;
    j.nama = String(isian.nama);
    j.bagian = { id: bagian.id, kode: bagian.kode, nama: bagian.nama };
    j.status = (isian.status as StatusAktif) ?? j.status;

    return sukses(j, undefined, 'Perubahan tersimpan');
  }),

  /* ---------- template ---------- */

  http.get('/api/master/template', ({ request }) => {
    const { galat } = admin(request);
    if (galat) return galat;

    const jenisId = Number(new URL(request.url).searchParams.get('jenis_surat_id')) || null;
    return sukses(TEMPLATE.filter((t) => !jenisId || t.jenis_surat.id === jenisId));
  }),

  http.get('/api/master/template/:id', async ({ request, params }) => {
    const { galat } = admin(request);
    if (galat) return galat;
    await jeda(120);

    const t = TEMPLATE.find((x) => x.id === Number(params.id));
    return t ? sukses(t) : gagal(404, 'Template tidak ditemukan');
  }),

  http.put('/api/master/template/:id', async ({ request, params }) => {
    const { galat } = admin(request);
    if (galat) return galat;

    const t = TEMPLATE.find((x) => x.id === Number(params.id));
    if (!t) return gagal(404, 'Template tidak ditemukan');

    const isian = (await request.json()) as { konten_html: string; format_nomor: string };
    if (!isian.format_nomor.includes('{urut}')) {
      return gagal(400, 'Validasi gagal', [
        { field: 'format_nomor', message: 'Pola wajib memuat {urut}' },
      ]);
    }

    t.konten_html = isian.konten_html;
    t.format_nomor = isian.format_nomor;
    return sukses(t, undefined, 'Perubahan tersimpan');
  }),

  http.post('/api/master/template/:id/fields', async ({ request, params }) => {
    const { galat } = admin(request);
    if (galat) return galat;

    const t = TEMPLATE.find((x) => x.id === Number(params.id));
    if (!t) return gagal(404, 'Template tidak ditemukan');

    const isian = (await request.json()) as Omit<TemplateField, 'id'>;
    if (t.fields.some((f) => f.field_key === isian.field_key)) {
      return gagal(409, `Field {${isian.field_key}} sudah ada pada template ini`);
    }

    const baru = { ...isian, id: Date.now() };
    t.fields.push(baru);
    return sukses(baru, undefined, 'Field ditambahkan');
  }),

  http.put('/api/master/template/:id/fields/:fieldId', async ({ request, params }) => {
    const { galat } = admin(request);
    if (galat) return galat;

    const t = TEMPLATE.find((x) => x.id === Number(params.id));
    if (!t) return gagal(404, 'Template tidak ditemukan');

    const f = t.fields.find((x) => x.id === Number(params.fieldId));
    if (!f) return gagal(404, 'Field tidak ditemukan');

    const isian = (await request.json()) as Omit<TemplateField, 'id'>;
    if (t.fields.some((x) => x.field_key === isian.field_key && x.id !== f.id)) {
      return gagal(409, `Field {${isian.field_key}} sudah ada pada template ini`);
    }

    Object.assign(f, isian);
    return sukses(f, undefined, 'Perubahan tersimpan');
  }),

  /* ---------- aturan penomoran ---------- */

  http.get('/api/master/penomoran', ({ request }) => {
    const { galat } = admin(request);
    if (galat) return galat;
    return sukses(PENOMORAN);
  }),

  http.put('/api/master/penomoran', async ({ request }) => {
    const { galat, user } = admin(request);
    if (galat) return galat;

    const isian = (await request.json()) as {
      format_nomor: string;
      kode_perusahaan: string;
      panjang_nomor_urut: number;
    };

    if (!isian.format_nomor.includes('{urut}') || !isian.format_nomor.includes('{tahun}')) {
      return gagal(400, 'Validasi gagal', [
        { field: 'format_nomor', message: 'Pola wajib memuat {urut} dan {tahun}' },
      ]);
    }

    const kodeLama = PENOMORAN.kode_perusahaan;
    PENOMORAN.format_nomor = isian.format_nomor;
    PENOMORAN.kode_perusahaan = isian.kode_perusahaan;
    PENOMORAN.panjang_nomor_urut = isian.panjang_nomor_urut;

    if (kodeLama !== isian.kode_perusahaan) {
      PENOMORAN.riwayat_perubahan.unshift({
        waktu: new Date().toISOString(),
        aktor: user!.nama,
        ringkasan: `Kode perusahaan ${kodeLama} menjadi ${isian.kode_perusahaan}`,
      });
    }

    return sukses(PENOMORAN, undefined, 'Perubahan tersimpan');
  }),
];

/* ---------- pembantu ---------- */

/** Satu akun pengguna hanya boleh dipasang pada satu pegawai. */
function periksaAkun(userId: number | null, kecualiPegawaiId: number | null) {
  if (!userId) return null;
  const bentrok = PEGAWAI.find(
    (p) => p.user?.id === userId && p.id !== kecualiPegawaiId,
  );
  if (!bentrok) return null;
  return gagal(409, `Akun tersebut sudah dipakai oleh ${bentrok.nama}`);
}

function bentukPegawai(
  id: number,
  isian: Record<string, string | number | null>,
  _idLama: number | null,
) {
  const bagian = BAGIAN.find((b) => b.id === Number(isian.bagian_id));
  if (!bagian) {
    return {
      galat: gagal(400, 'Validasi gagal', [
        { field: 'bagian_id', message: 'Bagian wajib dipilih' },
      ]),
    } as const;
  }

  const akun = USERS.find((u) => u.id === Number(isian.user_id));

  return {
    nilai: {
      id,
      nama: String(isian.nama ?? ''),
      nip: String(isian.nip ?? '') || null,
      jabatan: String(isian.jabatan ?? '') || null,
      bagian: { id: bagian.id, kode: bagian.kode, nama: bagian.nama },
      user: akun ? { id: akun.id, username: akun.username } : null,
      status: (isian.status as StatusAktif) ?? 'aktif',
    },
  } as const;
}
