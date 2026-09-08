import { useMemo, useState } from 'react';
import { IdCard, Plus } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { DataTable } from '@/components/table/DataTable';
import { Toolbar } from '@/components/table/Toolbar';
import { STATUS_AKTIF } from '@/lib/status';
import type { Pegawai } from '@/types';
import { FormPegawaiModal } from './FormPegawaiModal';
import { useFilterTabel } from './useFilterTabel';
import { usePegawai } from './api';

/** Layar 21 Data Master Pegawai (UC-13). */
export function PegawaiPage() {
  const { q, page, setQ, setPage, bersihkan } = useFilterTabel();
  const { data, isPending } = usePegawai(q, page);
  const [sunting, setSunting] = useState<Pegawai | 'baru' | null>(null);

  const kolom = useMemo<ColumnDef<Pegawai, unknown>[]>(
    () => [
      {
        accessorKey: 'nama',
        header: 'Nama',
        meta: { lebar: '24%' },
        cell: (c) => <span className="font-medium">{c.getValue() as string}</span>,
      },
      {
        accessorKey: 'nip',
        header: 'NIP',
        meta: { tetap: 120 },
        cell: (c) => (
          <span className="tabular text-ink-muted">{(c.getValue() as string) || '—'}</span>
        ),
      },
      {
        accessorKey: 'jabatan',
        header: 'Jabatan',
        meta: { lebar: '24%' },
        cell: (c) => <span className="text-ink-muted">{(c.getValue() as string) || '—'}</span>,
      },
      {
        id: 'bagian',
        header: 'Bagian',
        meta: { lebar: '20%' },
        cell: ({ row }) =>
          row.original.bagian ? (
            <span className="text-ink-muted">
              {row.original.bagian.kode} — {row.original.bagian.nama}
            </span>
          ) : (
            <span className="text-ink-subtle">—</span>
          ),
      },
      {
        id: 'akun',
        header: 'Akun',
        meta: { lebar: '16%' },
        cell: ({ row }) =>
          row.original.user ? (
            <span className="text-ink-muted">{row.original.user.username}</span>
          ) : (
            <span className="text-ink-subtle">Tanpa akun</span>
          ),
      },
      {
        id: 'status',
        header: 'Status',
        meta: { tetap: 110 },
        cell: ({ row }) => {
          const s = STATUS_AKTIF[row.original.status];
          return <Badge nada={s.nada}>{s.label}</Badge>;
        },
      },
      {
        id: 'aksi',
        header: 'Aksi',
        meta: { tetap: 90 },
        cell: ({ row }) => (
          <Button ukuran="kecil" onClick={() => setSunting(row.original)}>
            Ubah
          </Button>
        ),
      },
    ],
    [],
  );

  return (
    <>
      <Toolbar
        nilaiCari={q}
        onCari={setQ}
        placeholderCari="Cari nama pegawai atau jabatan"
        aksi={
          <Button ragam="utama" onClick={() => setSunting('baru')}>
            <Plus size={15} />
            Tambah Pegawai
          </Button>
        }
      />

      <DataTable
        kolom={kolom}
        data={data?.data ?? []}
        meta={data?.meta}
        memuat={isPending}
        satuan="pegawai"
        onPindahHalaman={setPage}
        kosong={
          <EmptyState
            ikon={<IdCard size={20} />}
            judul={q ? 'Tidak ada pegawai yang cocok' : 'Belum ada data pegawai'}
            keterangan="Data pegawai menjadi sumber daftar penerima disposisi dan PIC surat."
            aksi={
              q ? (
                <Button onClick={bersihkan}>Hapus pencarian</Button>
              ) : (
                <Button ragam="utama" onClick={() => setSunting('baru')}>
                  <Plus size={15} />
                  Tambah Pegawai
                </Button>
              )
            }
          />
        }
      />

      <p className="mt-4 text-label text-ink-subtle">
        Pegawai tanpa akun pengguna tetap dapat dipilih sebagai PIC surat, tetapi tidak
        dapat menerima disposisi.
      </p>

      <FormPegawaiModal
        terbuka={sunting !== null}
        onTutup={() => setSunting(null)}
        pegawai={sunting === 'baru' ? null : sunting}
      />
    </>
  );
}
