import { useMemo, useState } from 'react';
import { Plus, Users } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { DataTable } from '@/components/table/DataTable';
import { Toolbar } from '@/components/table/Toolbar';
import { STATUS_AKTIF } from '@/lib/status';
import type { User } from '@/types';
import { FormPenggunaModal } from './FormPenggunaModal';
import { useFilterTabel } from './useFilterTabel';
import { useUsers } from './api';

/** Layar 13 Data Master Pengguna (UC-13). */
export function PenggunaPage() {
  const { q, page, setQ, setPage, bersihkan } = useFilterTabel();
  const { data, isPending } = useUsers(q, page);
  const [sunting, setSunting] = useState<User | 'baru' | null>(null);

  const kolom = useMemo<ColumnDef<User, unknown>[]>(
    () => [
      {
        accessorKey: 'nama',
        header: 'Nama',
        meta: { lebar: '24%' },
        cell: (c) => <span className="font-medium">{c.getValue() as string}</span>,
      },
      {
        accessorKey: 'username',
        header: 'Nama Pengguna',
        meta: { lebar: '20%' },
        cell: (c) => <span className="text-ink-muted">{c.getValue() as string}</span>,
      },
      {
        accessorKey: 'role',
        header: 'Role',
        meta: { tetap: 100 },
        cell: (c) => (
          <span className="capitalize text-ink-muted">{c.getValue() as string}</span>
        ),
      },
      {
        id: 'bagian',
        header: 'Bagian',
        meta: { lebar: '22%' },
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
        placeholderCari="Cari nama atau nama pengguna"
        aksi={
          <Button ragam="utama" onClick={() => setSunting('baru')}>
            <Plus size={15} />
            Tambah Pengguna
          </Button>
        }
      />

      <DataTable
        kolom={kolom}
        data={data?.data ?? []}
        meta={data?.meta}
        memuat={isPending}
        satuan="pengguna"
        onPindahHalaman={setPage}
        kosong={
          <EmptyState
            ikon={<Users size={20} />}
            judul={q ? 'Tidak ada pengguna yang cocok' : 'Belum ada pengguna'}
            keterangan="Akun Pegawai dibuat di sini agar dapat dipilih sebagai penerima disposisi."
            aksi={
              q ? (
                <Button onClick={bersihkan}>Hapus pencarian</Button>
              ) : (
                <Button ragam="utama" onClick={() => setSunting('baru')}>
                  <Plus size={15} />
                  Tambah Pengguna
                </Button>
              )
            }
          />
        }
      />

      <p className="mt-4 text-label text-ink-subtle">
        Akun Pegawai dibuat di sini agar dapat dipilih sebagai penerima disposisi.
      </p>

      <FormPenggunaModal
        terbuka={sunting !== null}
        onTutup={() => setSunting(null)}
        user={sunting === 'baru' ? null : sunting}
      />
    </>
  );
}
