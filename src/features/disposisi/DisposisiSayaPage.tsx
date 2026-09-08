import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ChevronRight, Inbox } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Pagination } from '@/components/ui/Pagination';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { cn } from '@/lib/cn';
import { tanggalPanjang } from '@/lib/format';
import { STATUS_DISPOSISI, URUTAN_STATUS } from '@/lib/status';
import type { StatusDisposisi } from '@/types';
import { filterSayaAwal, useDisposisiSaya, type FilterDisposisiSaya } from './api';

/**
 * Layar 17 dan tiga keadaan tabnya (36 Belum Dibaca, 37 Diproses, 38 Selesai).
 *
 * Tab adalah nilai `?status=` pada URL, bukan keadaan komponen — satu halaman
 * melayani keempat tampilan, dan tautan ke tab tertentu bisa dibagikan.
 */
export function DisposisiSayaPage() {
  const [params, setParams] = useSearchParams();

  const filter: FilterDisposisiSaya = useMemo(
    () => ({
      ...filterSayaAwal,
      status: (params.get('status') as StatusDisposisi | null) ?? null,
      page: Number(params.get('page') ?? 1),
    }),
    [params],
  );

  const { data, isPending } = useDisposisiSaya(filter);
  const hitungan = data?.meta.hitungan;

  const pindah = (bagian: { status?: StatusDisposisi | null; page?: number }) => {
    const baru = new URLSearchParams();
    const status = bagian.status !== undefined ? bagian.status : filter.status;
    const page = bagian.page ?? (bagian.status !== undefined ? 1 : filter.page);
    if (status) baru.set('status', status);
    if (page > 1) baru.set('page', String(page));
    setParams(baru);
  };

  const tab: { nilai: StatusDisposisi | null; label: string; jumlah?: number }[] = [
    { nilai: null, label: 'Semua', jumlah: hitungan?.semua },
    ...URUTAN_STATUS.map((s) => ({
      nilai: s,
      label: STATUS_DISPOSISI[s].label,
      jumlah: hitungan?.[s],
    })),
  ];

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center gap-2">
        {tab.map((t) => {
          const aktif = t.nilai === filter.status;
          return (
            <button
              key={t.label}
              type="button"
              onClick={() => pindah({ status: t.nilai })}
              aria-current={aktif ? 'true' : undefined}
              className={cn(
                'h-[34px] rounded-control border px-3.5 text-base transition-colors duration-150',
                aktif
                  ? 'border-nav bg-nav text-white'
                  : 'border-line bg-surface text-ink-muted hover:border-ink-subtle hover:text-ink',
              )}
            >
              {t.label}
              {typeof t.jumlah === 'number' ? (
                <span className={cn('tabular ml-1.5', aktif ? 'text-white/70' : 'text-ink-subtle')}>
                  ({t.jumlah})
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {isPending ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} className="px-5 py-4">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="mt-3 h-3.5 w-2/3" />
              <Skeleton className="mt-2 h-3 w-1/2" />
            </Card>
          ))}
        </div>
      ) : !data?.data.length ? (
        <Card>
          <EmptyState
            ikon={<Inbox size={20} />}
            judul={
              filter.status
                ? `Tidak ada disposisi berstatus ${STATUS_DISPOSISI[filter.status].label}`
                : 'Belum ada disposisi untuk Anda'
            }
            keterangan="Surat yang didisposisikan kepada Anda akan muncul di sini."
            aksi={
              filter.status ? (
                <button
                  type="button"
                  onClick={() => pindah({ status: null })}
                  className="text-label text-ink-muted underline underline-offset-4 hover:text-ink"
                >
                  Lihat semua disposisi
                </button>
              ) : undefined
            }
          />
        </Card>
      ) : (
        <>
          <div className="flex flex-col gap-3">
            {data.data.map((d) => (
              <Link
                key={d.id}
                to={`/disposisi-saya/${d.id}`}
                className={cn(
                  'group flex items-start gap-4 rounded-card border border-line bg-surface px-5 py-4 shadow-card',
                  'transition-colors duration-150 hover:border-ink-subtle',
                )}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={d.status} terlambat={d.terlambat} />
                    <span className="tabular text-label text-ink-subtle">
                      {d.surat.nomor_agenda}
                    </span>
                  </div>

                  <p className="mt-2 text-card font-semibold text-ink">{d.surat.perihal}</p>
                  <p className="mt-0.5 text-label text-ink-subtle">
                    dari {d.surat.pengirim}
                  </p>
                  <p className="mt-2 line-clamp-2 text-base text-ink-muted">
                    Instruksi: {d.instruksi}
                  </p>

                  {d.batas_waktu ? (
                    <p className="mt-2 text-label text-ink-subtle">
                      Batas waktu {tanggalPanjang(d.batas_waktu)}
                    </p>
                  ) : null}
                </div>

                <span className="flex shrink-0 items-center gap-1 self-center text-label text-ink-muted transition-colors group-hover:text-ink">
                  Buka
                  <ChevronRight size={14} />
                </span>
              </Link>
            ))}
          </div>

          <Card className="mt-4 overflow-hidden">
            <Pagination
              meta={data.meta}
              onPindah={(page) => pindah({ page })}
              satuan="disposisi"
              className="border-t-0"
            />
          </Card>

          <p className="mt-4 text-label text-ink-subtle">
            Status berubah menjadi{' '}
            <Badge nada="amber">{STATUS_DISPOSISI.diproses.label}</Badge> ketika disposisi
            dibuka pertama kali.
          </p>
        </>
      )}
    </>
  );
}
