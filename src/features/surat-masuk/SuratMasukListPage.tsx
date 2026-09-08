import { useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Inbox, Plus, SearchX } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { FilterDropdown } from '@/components/ui/FilterDropdown';
import { RentangTanggal } from '@/components/ui/RentangTanggal';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { DataTable } from '@/components/table/DataTable';
import { Toolbar } from '@/components/table/Toolbar';
import { tanggalPendek } from '@/lib/format';
import { STATUS_DISPOSISI, URUTAN_STATUS } from '@/lib/status';
import type { SuratMasukRingkas } from '@/types';
import { filterAwal, useSuratMasuk, type FilterSuratMasuk } from './api';

/**
 * Layar 02 (daftar), 26 (tidak ada hasil), 39 (halaman 2).
 *
 * Seluruh keadaan filter disimpan di query string, bukan di useState. Dengan
 * begitu tombol kembali, muat ulang, dan menyalin tautan ke rekan kerja
 * semuanya menghasilkan tampilan yang sama.
 */
export function SuratMasukListPage() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();

  const filter: FilterSuratMasuk = useMemo(
    () => ({
      q: params.get('q') ?? '',
      status: (params.get('status') as FilterSuratMasuk['status']) ?? null,
      tanggal_dari: params.get('dari'),
      tanggal_sampai: params.get('sampai'),
      page: Number(params.get('page') ?? 1),
      limit: Number(params.get('limit') ?? filterAwal.limit),
    }),
    [params],
  );

  const ubahFilter = (bagian: Partial<FilterSuratMasuk>, kembaliKeAwal = true) => {
    const gabung = { ...filter, ...bagian };
    const baru = new URLSearchParams();
    if (gabung.q) baru.set('q', gabung.q);
    if (gabung.status) baru.set('status', gabung.status);
    if (gabung.tanggal_dari) baru.set('dari', gabung.tanggal_dari);
    if (gabung.tanggal_sampai) baru.set('sampai', gabung.tanggal_sampai);
    const halaman = kembaliKeAwal ? 1 : gabung.page;
    if (halaman > 1) baru.set('page', String(halaman));
    if (gabung.limit !== filterAwal.limit) baru.set('limit', String(gabung.limit));
    setParams(baru);
  };

  const { data, isPending, isError } = useSuratMasuk(filter);

  const adaFilter = Boolean(
    filter.q || filter.status || filter.tanggal_dari || filter.tanggal_sampai,
  );

  const kolom = useMemo<ColumnDef<SuratMasukRingkas, unknown>[]>(
    () => [
      {
        accessorKey: 'nomor_agenda',
        header: 'No. Agenda',
        meta: { tetap: 120 },
        cell: (c) => (
          <span className="tabular whitespace-nowrap font-medium">
            {c.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: 'nomor_surat',
        header: 'No. Surat',
        meta: { lebar: '18%' },
        cell: (c) => (
          <span className="tabular text-ink-muted">{c.getValue() as string}</span>
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
        accessorKey: 'perihal',
        header: 'Perihal',
        meta: { lebar: '26%' },
        cell: (c) => (
          <span className="line-clamp-2 leading-snug">{c.getValue() as string}</span>
        ),
      },
      {
        accessorKey: 'pengirim',
        header: 'Pengirim',
        meta: { lebar: '18%' },
        cell: (c) => (
          <span className="line-clamp-2 leading-snug text-ink-muted">
            {c.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: 'pic',
        header: 'PIC',
        /* Status yang harus selalu terlihat (§7.4 Analisis Teknis); PIC
           mengalah lebih dulu saat layar menyempit. */
        meta: { lebar: '12%', sembunyiSempit: true },
        cell: (c) => (
          <span className="text-ink-muted">{(c.getValue() as string) || '—'}</span>
        ),
      },
      {
        id: 'status',
        header: 'Status',
        meta: { tetap: 190 },
        cell: ({ row }) => (
          <StatusBadge
            status={row.original.status_disposisi}
            terlambat={row.original.terlambat}
          />
        ),
      },
    ],
    [],
  );

  if (isError) {
    return (
      <EmptyState
        judul="Data surat masuk tidak dapat dimuat"
        keterangan="Periksa sambungan ke server, lalu muat ulang halaman."
      />
    );
  }

  return (
    <>
      <Toolbar
        nilaiCari={filter.q}
        onCari={(q) => ubahFilter({ q })}
        placeholderCari="Cari nomor surat, perihal, atau pengirim"
        filter={
          <>
            <FilterDropdown
              label="Status disposisi"
              nilaiTerpilih={filter.status}
              onPilih={(status) =>
                ubahFilter({ status: status as FilterSuratMasuk['status'] })
              }
              opsi={[
                ...URUTAN_STATUS.map((s) => ({
                  nilai: s,
                  label: STATUS_DISPOSISI[s].label,
                })),
                { nilai: 'belum_didisposisi', label: 'Belum Didisposisi' },
              ]}
            />
            <RentangTanggal
              nilai={{ dari: filter.tanggal_dari, sampai: filter.tanggal_sampai }}
              onUbah={(r) => ubahFilter({ tanggal_dari: r.dari, tanggal_sampai: r.sampai })}
            />
          </>
        }
        aksi={
          <Button ragam="utama" asChild>
            <Link to="/surat-masuk/baru">
              <Plus size={15} />
              Registrasi Surat Masuk
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
        onKlikBaris={(baris) => navigate(`/surat-masuk/${baris.id}`)}
        kosong={
          adaFilter ? (
            <EmptyState
              ikon={<SearchX size={20} />}
              judul="Belum ada surat yang cocok"
              keterangan="Kata kunci atau filter yang dipilih tidak menemukan surat apa pun."
              aksi={
                <>
                  <Button onClick={() => setParams(new URLSearchParams())}>
                    Hapus filter
                  </Button>
                  <Button ragam="utama" asChild>
                    <Link to="/surat-masuk/baru">
                      <Plus size={15} />
                      Registrasi Surat Masuk
                    </Link>
                  </Button>
                </>
              }
            />
          ) : (
            <EmptyState
              ikon={<Inbox size={20} />}
              judul="Belum ada surat masuk"
              keterangan="Surat yang diterima dicatat di sini beserta dokumen dan disposisinya."
              aksi={
                <Button ragam="utama" asChild>
                  <Link to="/surat-masuk/baru">
                    <Plus size={15} />
                    Registrasi Surat Masuk
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
