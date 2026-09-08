import { useEffect, useMemo, useState } from 'react';
import { Building2, Plus } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { useToast } from '@/components/ui/Toast';
import { DataTable } from '@/components/table/DataTable';
import { Toolbar } from '@/components/table/Toolbar';
import { errorField, pesanError } from '@/lib/api';
import { STATUS_AKTIF } from '@/lib/status';
import type { Bagian, StatusAktif } from '@/types';
import { useFilterTabel } from './useFilterTabel';
import { useBagian, useSimpanBagian, type IsianBagian } from './api';

/** Layar 22 Data Master Bagian, dengan layar 32 sebagai modalnya. */
export function BagianPage() {
  const { q, setQ, bersihkan } = useFilterTabel();
  const { data, isPending } = useBagian(q);
  const [sunting, setSunting] = useState<Bagian | 'baru' | null>(null);

  const kolom = useMemo<ColumnDef<Bagian, unknown>[]>(
    () => [
      {
        accessorKey: 'kode',
        header: 'Kode',
        meta: { tetap: 90 },
        cell: (c) => <span className="tabular font-medium">{c.getValue() as string}</span>,
      },
      { accessorKey: 'nama', header: 'Nama Bagian', meta: { lebar: '30%' } },
      {
        accessorKey: 'jumlah_kode_surat',
        header: 'Jumlah Kode Surat',
        meta: { tetap: 160 },
        cell: (c) => (
          <span className="tabular text-ink-muted">{c.getValue() as number} kode</span>
        ),
      },
      {
        accessorKey: 'jumlah_surat_tahun_ini',
        header: 'Surat 2026',
        meta: { tetap: 120 },
        cell: (c) => <span className="tabular text-ink-muted">{c.getValue() as number}</span>,
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
        placeholderCari="Cari kode atau nama bagian"
        aksi={
          <Button ragam="utama" onClick={() => setSunting('baru')}>
            <Plus size={15} />
            Tambah Bagian
          </Button>
        }
      />

      <DataTable
        kolom={kolom}
        data={data ?? []}
        memuat={isPending}
        jumlahBarisSkeleton={6}
        kosong={
          <EmptyState
            ikon={<Building2 size={20} />}
            judul={q ? 'Tidak ada bagian yang cocok' : 'Belum ada bagian'}
            keterangan="Bagian menentukan segmen kedua pada nomor surat keluar."
            aksi={q ? <Button onClick={bersihkan}>Hapus pencarian</Button> : undefined}
          />
        }
      />

      <p className="mt-4 text-label text-ink-subtle">
        Bagian menentukan segmen kedua pada nomor surat keluar, contoh{' '}
        <span className="tabular">468/FIN.03/Digitak/VIII/2026</span>.
      </p>

      <FormBagianModal
        terbuka={sunting !== null}
        onTutup={() => setSunting(null)}
        bagian={sunting === 'baru' ? null : sunting}
        urutanBerikutnya={(data?.length ?? 0) + 1}
      />
    </>
  );
}

/** Layar 32 Form Bagian. */
function FormBagianModal({
  terbuka,
  onTutup,
  bagian,
  urutanBerikutnya,
}: {
  terbuka: boolean;
  onTutup: () => void;
  bagian: Bagian | null;
  urutanBerikutnya: number;
}) {
  const simpan = useSimpanBagian();
  const toast = useToast();
  const [isian, setIsian] = useState<IsianBagian>({
    kode: '',
    nama: '',
    urutan_tampil: urutanBerikutnya,
    status: 'aktif',
  });
  const [galat, setGalat] = useState<Record<string, string>>({});
  const [galatUmum, setGalatUmum] = useState<string | null>(null);

  useEffect(() => {
    if (!terbuka) return;
    setIsian(
      bagian
        ? {
            kode: bagian.kode,
            nama: bagian.nama,
            urutan_tampil: bagian.urutan_tampil,
            status: bagian.status,
          }
        : { kode: '', nama: '', urutan_tampil: urutanBerikutnya, status: 'aktif' },
    );
    setGalat({});
    setGalatUmum(null);
  }, [terbuka, bagian, urutanBerikutnya]);

  const kirim = async () => {
    const g: Record<string, string> = {};
    if (!isian.kode.trim()) g.kode = 'Kode bagian wajib diisi';
    else if (!/^[A-Z]{2,5}$/.test(isian.kode)) g.kode = 'Dua sampai lima huruf kapital';
    if (!isian.nama.trim()) g.nama = 'Nama bagian wajib diisi';
    setGalat(g);
    if (Object.keys(g).length) return;

    setGalatUmum(null);
    try {
      await simpan.mutateAsync({ id: bagian?.id, isian });
      toast.sukses(bagian ? 'Bagian diperbarui' : 'Bagian baru ditambahkan');
      onTutup();
    } catch (e) {
      const perField = errorField(e);
      if (Object.keys(perField).length) setGalat(perField);
      else setGalatUmum(pesanError(e));
      toast.galat('Bagian gagal disimpan', pesanError(e));
    }
  };

  return (
    <Modal
      terbuka={terbuka}
      onTutup={onTutup}
      judul={bagian ? 'Ubah Bagian' : 'Tambah Bagian'}
      keterangan="Bagian menentukan unit penerbit surat dan segmen kedua nomor surat."
      lebar="sempit"
      footer={
        <>
          <Button onClick={onTutup}>Batal</Button>
          <Button ragam="utama" onClick={kirim} disabled={simpan.isPending}>
            {simpan.isPending ? 'Menyimpan…' : 'Simpan'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        <Field label="Kode bagian" wajib galat={galat.kode}>
          {(p) => (
            <Input
              {...p}
              value={isian.kode}
              onChange={(e) =>
                setIsian((s) => ({ ...s, kode: e.target.value.toUpperCase() }))
              }
              placeholder="FIN"
              className="tabular"
              maxLength={5}
            />
          )}
        </Field>

        <Field label="Nama bagian" wajib galat={galat.nama}>
          {(p) => (
            <Input
              {...p}
              value={isian.nama}
              onChange={(e) => setIsian((s) => ({ ...s, nama: e.target.value }))}
              placeholder="Keuangan"
            />
          )}
        </Field>

        <Field label="Urutan tampil">
          {(p) => (
            <Input
              {...p}
              type="number"
              min={1}
              value={isian.urutan_tampil}
              onChange={(e) =>
                setIsian((s) => ({ ...s, urutan_tampil: Number(e.target.value) }))
              }
            />
          )}
        </Field>

        <Field label="Status">
          {(p) => (
            <Select
              id={p.id}
              nilai={isian.status}
              onUbah={(v) => setIsian((s) => ({ ...s, status: v as StatusAktif }))}
              opsi={[
                { nilai: 'aktif', label: 'Aktif' },
                { nilai: 'nonaktif', label: 'Nonaktif' },
              ]}
            />
          )}
        </Field>

        <p className="text-note text-ink-subtle">
          Mengubah kode bagian tidak mengubah nomor surat yang sudah pernah terbit —
          nomor lama tersimpan apa adanya.
        </p>

        {galatUmum ? (
          <p
            role="alert"
            className="rounded-control border border-st-merah-br bg-st-merah-bg px-3 py-2 text-label text-st-merah-fg"
          >
            {galatUmum}
          </p>
        ) : null}
      </div>
    </Modal>
  );
}
