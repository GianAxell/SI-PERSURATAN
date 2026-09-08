import { useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { SearchX } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import { EmptyState } from '@/components/ui/EmptyState';
import { RentangTanggal } from '@/components/ui/RentangTanggal';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { DataTable } from '@/components/table/DataTable';
import { Toolbar } from '@/components/table/Toolbar';
import { tanggalPendek } from '@/lib/format';
import type { DisposisiSaya } from '@/types';
import { filterSayaAwal, useDisposisiSaya, type FilterDisposisiSaya } from './api';

/**
 * Layar 19 Pegawai Riwayat Disposisi.
 *
 * Sumbernya endpoint yang sama dengan layar 17 — bedanya hanya bentuk
 * tampilan. Pegawai hanya melihat disposisi yang ditujukan kepadanya; itu
 * dijamin server (B-8, K-17), bukan disaring di sini.
 */
export function RiwayatSayaPage() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();

  const filter: FilterDisposisiSaya = useMemo(
    () => ({
      ...filterSayaAwal,
      q: params.get('q') ?? '',
      tanggal_dari: params.get('dari'),
      tanggal_sampai: params.get('sampai'),
      page: Number(params.get('page') ?? 1),
    }),
    [params],
  );

  const ubah = (bagian: Partial<FilterDisposisiSaya>, kembaliKeAwal = true) => {
    const g = { ...filter, ...bagian };
    const baru = new URLSearchParams();
    if (g.q) baru.set('q', g.q);
    if (g.tanggal_dari) baru.set('dari', g.tanggal_dari);
    if (g.tanggal_sampai) baru.set('sampai', g.tanggal_sampai);
    const page = kembaliKeAwal ? 1 : g.page;
    if (page > 1) baru.set('page', String(page));
    setParams(baru);
  };

  const { data, isPending } = useDisposisiSaya(filter);
  const adaFilter = Boolean(filter.q || filter.tanggal_dari || filter.tanggal_sampai);

  const kolom = useMemo<ColumnDef<DisposisiSaya, unknown>[]>(
    () => [
      {
        id: 'surat',
        header: 'Surat',
        meta: { tetap: 120 },
        cell: ({ row }) => (
          <span className="tabular whitespace-nowrap font-medium">
            {row.original.surat.nomor_agenda}
          </span>
        ),
      },
      {
        id: 'perihal',
        header: 'Perihal',
        meta: { lebar: '40%' },
        cell: ({ row }) => (
          <>
            <span className="line-clamp-2 leading-snug">{row.original.surat.perihal}</span>
            <span className="mt-0.5 block truncate text-label text-ink-subtle">
              dari {row.original.surat.pengirim}
            </span>
          </>
        ),
      },
      {
        accessorKey: 'dibuat_pada',
        header: 'Diterima',
        meta: { tetap: 120 },
        cell: (c) => (
          <span className="tabular whitespace-nowrap text-ink-muted">
            {tanggalPendek(c.getValue() as string)}
          </span>
        ),
      },
      {
        accessorKey: 'selesai_pada',
        header: 'Selesai',
        meta: { tetap: 120 },
        cell: (c) => (
          <span className="tabular whitespace-nowrap text-ink-muted">
            {tanggalPendek(c.getValue() as string | null)}
          </span>
        ),
      },
      {
        id: 'status',
        header: 'Status',
        meta: { tetap: 190 },
        cell: ({ row }) => (
          <StatusBadge status={row.original.status} terlambat={row.original.terlambat} />
        ),
      },
    ],
    [],
  );

  return (
    <>
      <Toolbar
        nilaiCari={filter.q}
        onCari={(q) => ubah({ q })}
        placeholderCari="Cari surat atau perihal"
        filter={
          <RentangTanggal
            nilai={{ dari: filter.tanggal_dari, sampai: filter.tanggal_sampai }}
            onUbah={(r) => ubah({ tanggal_dari: r.dari, tanggal_sampai: r.sampai })}
          />
        }
      />

      <DataTable
        kolom={kolom}
        data={data?.data ?? []}
        meta={data?.meta}
        memuat={isPending}
        satuan="disposisi"
        onPindahHalaman={(page) => ubah({ page }, false)}
        onKlikBaris={(b) => navigate(`/disposisi-saya/${b.id}`)}
        kosong={
          <EmptyState
            ikon={<SearchX size={20} />}
            judul={adaFilter ? 'Tidak ada yang cocok' : 'Belum ada riwayat disposisi'}
            keterangan={
              adaFilter
                ? 'Kata kunci atau rentang tanggal yang dipilih tidak menemukan disposisi apa pun.'
                : 'Disposisi yang pernah ditujukan kepada Anda akan tercatat di sini.'
            }
            aksi={
              adaFilter ? (
                <button
                  type="button"
                  onClick={() => setParams(new URLSearchParams())}
                  className="text-label text-ink-muted underline underline-offset-4 hover:text-ink"
                >
                  Hapus filter
                </button>
              ) : undefined
            }
          />
        }
      />

      <p className="mt-4 text-label text-ink-subtle">
        Pegawai hanya melihat riwayat disposisi yang ditujukan kepadanya.
      </p>
    </>
  );
}
