# Frontend — Sistem Informasi Persuratan

PT Metanouva Informatika · Kerja Praktik

Antarmuka untuk pencatatan surat masuk, disposisi, dan penerbitan surat keluar.
Dibangun mengikuti prototype Figma *UI UX - Sistem Informasi Persuratan* (38 layar).

## Menjalankan

```bash
npm install
npm run dev
```

Buka http://localhost:5173

Selama backend belum ada, permintaan API dilayani **mock MSW** di dalam browser —
tidak perlu server apa pun. Akun contoh:

| Peran | Nama pengguna | Kata sandi |
|---|---|---|
| Admin | `rina.marlina` | `admin123` |
| Pegawai | `budi.santoso` | `pegawai123` |

Untuk menyambung ke backend sungguhan, buat berkas `.env.local`:

```
VITE_MOCK=off
```

Permintaan `/api/*` lalu diteruskan ke `http://localhost:3000` lewat proxy Vite
(atur di `vite.config.ts`).

## Perintah

| Perintah | Kegunaan |
|---|---|
| `npm run dev` | server pengembangan |
| `npm run build` | periksa tipe lalu bangun ke `dist/` |
| `npm run preview` | menjalankan hasil build |
| `npm run lint` | oxlint |

## Acuan

Dua dokumen di folder `docs/` adalah acuan yang mengikat:

- **`Kontrak_API_SI_Persuratan.md`** — bentuk data dan daftar endpoint yang
  disepakati bersama backend. Berkas `src/types/index.ts` adalah terjemahan
  langsung dari §3 dokumen itu. Kalau bentuk data berubah, dokumen ini yang
  diperbarui lebih dulu.
- **`Frontend_SI_Persuratan.md`** — stack, design token, routing, dan peta
  layar Figma ke endpoint.

## Susunan folder

```
src/
├── app/            router, providers, penjaga route, AppLayout
├── components/
│   ├── ui/         komponen dasar, tidak tahu apa-apa soal persuratan
│   ├── table/      DataTable dan toolbar daftar
│   └── layout/     sidebar, topbar, panel pemberitahuan, menu akun
├── features/       satu folder per modul (auth, surat-masuk, disposisi, …)
├── lib/            api, format tanggal Indonesia, peta status, util kelas
├── mocks/          handler MSW — tidak ikut ke produksi
├── styles/         token warna dari Figma
└── types/          bentuk data sesuai kontrak
```

## Catatan

- Warna, ukuran huruf, dan radius diambil langsung dari Figma dan disimpan
  sebagai CSS variable di `src/styles/tokens.css`. Jangan menulis warna
  mentah di komponen.
- Aplikasi ini untuk laptop dan desktop (1024–1920 px). Tidak ada tampilan
  ponsel. Di bawah 1280 px sidebar menutup sendiri.
- Penjaga route di `src/app/ProtectedRoute.tsx` hanya untuk kenyamanan.
  Otorisasi yang sesungguhnya tetap di backend.
- Logo (`public/logo-metanouva.png`) diekspor dari Figma. Sudut membulatnya
  sudah menyatu di berkas, jadi jangan menambah `border-radius` di atasnya.
- `src/lib/cn.ts` mendaftarkan nama skala huruf khusus ke tailwind-merge.
  Kalau menambah ukuran baru di `tailwind.config.js`, tambahkan juga di sana —
  kalau tidak, `text-white` bisa terbuang diam-diam oleh penggabung kelas.

## Yang sudah ada

- **Fondasi** — token desain, komponen dasar, AppLayout, DataTable,
  autentikasi, mock MSW.
- **Modul Surat Masuk** — daftar dengan pencarian, filter status, filter
  rentang tanggal dan pagination (layar 02, 26, 39); registrasi surat dengan
  unggah PDF (03); detail surat dengan pratinjau dokumen (04, 35); buat
  disposisi (05); tandai surat balasan (12).

Modul berikutnya mengikuti §8 dokumen Rencana Frontend: Disposisi, lalu Data
Master, lalu Surat Keluar.
