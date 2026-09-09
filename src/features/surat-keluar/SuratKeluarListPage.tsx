import { useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, SearchX, Send } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { FilterDropdown } from '@/components/ui/FilterDropdown';
import { DataTable } from '@/components/table/DataTable';
import { Toolbar } from '@/components/table/Toolbar';
import { tanggalPendek } from '@/lib/format';
import { useBagian, useJenisSurat } from '@/features/master/api';
import type { SuratKeluar } from '@/types';
import { filterAwalKeluar, useSuratKeluar, type FilterSuratKeluar } from './api';

/** Tahun yang bisa dipilih — mengikuti data yang benar-benar ada di Excel. */
const TAHUN = ['2026', '2025', '2024'];

/**
 * Layar 07 Daftar Surat Keluar.
 *
 * Filter bagian dan jenis surat bertingkat: memilih bagian mempersempit
 * daftar jenis surat, dan mengganti bagian membuang jenis yang sudah tidak
 * termasuk di dalamnya — kalau tidak, filter bisa tersisa dalam kombinasi
 * yang mustahil dan tabelnya kosong tanpa alasan yang terlihat.
 */
export function SuratKeluarListPage() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();

  const filter: FilterSuratKeluar = useMemo(
    () => ({
      q: params.get('q') ?? '',
      tahun: params.get('tahun'),
      bagian_id: params.get('bagian') ? Number(params.get('bagian')) : null,
      jenis_surat_id: params.get('jenis') ? Number(params.get('jenis')) : null,
      page: Number(params.get('page') ?? 1),
      limit: Number(params.get('limit') ?? filterAwalKeluar.limit),
    }),
    [params],
  );

  const { data: bagian } = useBagian();
  const { data: jenis } = useJenisSurat(filter.bagian_id);

  const ubahFilter = (bagianBaru: Partial<FilterSuratKeluar>, kembaliKeAwal = true) => {
    const gabung = { ...filter, ...bagianBaru };
    /* Jenis surat menempel pada bagian, jadi ikut lepas saat bagian berganti. */
    if (bagianBaru.bagian_id !== undefined && bagianBaru.jenis_surat_id === undefined) {
      gabung.jenis_surat_id = null;
    }

    const baru = new URLSearchParams();
    if (gabung.q) baru.set('q', gabung.q);
    if (gabung.tahun) baru.set('tahun', gabung.tahun);
    if (gabung.bagian_id) baru.set('bagian', String(gabung.bagian_id));
    if (gabung.jenis_surat_id) baru.set('jenis', String(gabung.jenis_surat_id));
    const halaman = kembaliKeAwal ? 1 : gabung.page;
    if (halaman > 1) baru.set('page', String(halaman));
    if (gabung.limit !== filterAwalKeluar.limit) baru.set('limit', String(gabung.limit));
    setParams(baru);
  };

  const { data, isPending, isError } = useSuratKeluar(filter);
  const adaFilter = Boolean(
    filter.q || filter.tahun || filter.bagian_id || filter.jenis_surat_id,
  );

  const kolom = useMemo<ColumnDef<SuratKeluar, unknown>[]>(
    () => [
      {
        accessorKey: 'nomor_urut',
        header: 'No. Urut',
        meta: { tetap: 90 },
        cell: (c) => (
          <span className="tabular font-medium">{c.getValue() as number}</span>
        ),
      },
      {
        accessorKey: 'nomor_surat',
        header: 'Nomor Surat',
        meta: { lebar: '24%' },
        cell: (c) => (
          <span className="tabular leading-snug text-ink">{c.getValue() as string}</span>
        ),
      },
      {
        accessorKey: 'tanggal_surat',
        header: 'Tanggal',
        meta: { tetap: 120 },
        cell: (c) => (
          <span className="tabular whitespace-nowrap text-ink-muted">
            {tanggalPendek(c.getValue() as string)}
          </span>
        ),
      },
      {
        accessorKey: 'kepada',
        header: 'Kepada',
        meta: { lebar: '20%' },
        cell: (c) => (
          <span className="line-clamp-2 leading-snug text-ink-muted">
            {c.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: 'perihal',
        header: 'Perihal',
        meta: { lebar: '24%' },
        cell: (c) => (
          <span className="line-clamp-2 leading-snug">{c.getValue() as string}</span>
        ),
      },
      {
        id: 'jenis',
        header: 'Jenis Surat',
        meta: { lebar: '14%', sembunyiSempit: true },
        cell: ({ row }) => (
          <span className="text-ink-muted">
            <span className="tabular">{row.original.jenis_surat.kode}</span>{' '}
            {row.original.jenis_surat.nama}
          </span>
        ),
      },
    ],
    [],
  );

  if (isError) {
    return (
      <EmptyState
        judul="Data surat keluar tidak dapat dimuat"
        keterangan="Periksa sambungan ke server, lalu muat ulang halaman."
      />
    );
  }

  return (
    <>
      <Toolbar
        nilaiCari={filter.q}
        onCari={(q) => ubahFilter({ q })}
        placeholderCari="Cari nomor surat, perihal, atau tujuan"
        filter={
          <>
            <FilterDropdown
              label="Tahun"
              nilaiTerpilih={filter.tahun}
              onPilih={(tahun) => ubahFilter({ tahun })}
              opsi={TAHUN.map((t) => ({ nilai: t, label: t }))}
              lebarPanel={160}
            />
            <FilterDropdown
              label="Bagian"
              nilaiTerpilih={filter.bagian_id ? String(filter.bagian_id) : null}
              onPilih={(v) => ubahFilter({ bagian_id: v ? Number(v) : null })}
              opsi={(bagian ?? []).map((b) => ({
                nilai: String(b.id),
                label: `${b.kode} — ${b.nama}`,
              }))}
              lebarPanel={240}
            />
            <FilterDropdown
              label="Jenis surat"
              nilaiTerpilih={filter.jenis_surat_id ? String(filter.jenis_surat_id) : null}
              onPilih={(v) => ubahFilter({ jenis_surat_id: v ? Number(v) : null })}
              opsi={(jenis ?? []).map((j) => ({
                nilai: String(j.id),
                label: `${j.kode} — ${j.nama}`,
              }))}
              lebarPanel={260}
            />
          </>
        }
        aksi={
          <Button ragam="utama" asChild>
            <Link to="/surat-keluar/baru">
              <Plus size={15} />
              Buat Surat Keluar
            </Link>
          </Button>
        }
      />

      <DataTable
        kolom={kolom}
        data={data?.data ?? []}
        meta={data?.meta}
        memuat={isPending}
        satuan="surat"
        jumlahBarisSkeleton={filter.limit}
        onPindahHalaman={(page) => ubahFilter({ page }, false)}
        onKlikBaris={(baris) => navigate(`/surat-keluar/${baris.id}`)}
        kosong={
          adaFilter ? (
            <EmptyState
              ikon={<SearchX size={20} />}
              judul="Belum ada surat yang cocok"
              keterangan="Kata kunci atau filter yang dipilih tidak menemukan surat apa pun."
              aksi={
                <Button onClick={() => setParams(new URLSearchParams())}>
                  Hapus filter
                </Button>
              }
            />
          ) : (
            <EmptyState
              ikon={<Send size={20} />}
              judul="Belum ada surat keluar"
              keterangan="Surat yang diterbitkan akan tercatat di sini lengkap dengan nomornya."
              aksi={
                <Button ragam="utama" asChild>
                  <Link to="/surat-keluar/baru">
                    <Plus size={15} />
                    Buat Surat Keluar
                  </Link>
                </Button>
              }
            />
          )
        }
      />
    </>
  );
}
