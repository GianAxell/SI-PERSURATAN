import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { History, SearchX } from 'lucide-react';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Pagination } from '@/components/ui/Pagination';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Timeline } from '@/components/ui/Timeline';
import { Toolbar } from '@/components/table/Toolbar';
import { cn } from '@/lib/cn';
import { tanggalPanjang } from '@/lib/format';
import { useDaftarDisposisi, useRiwayatDisposisi } from './api';

/**
 * Layar 06 Riwayat Disposisi (sisi Admin, UC-08).
 *
 * Figma menggambarkan satu kartu berisi jejak satu disposisi. Di sini daftar
 * disposisi ada di kiri dan jejaknya di kanan, supaya Admin bisa berpindah
 * antar surat tanpa memuat ulang halaman. Disposisi yang sedang dilihat
 * disimpan di URL agar tautannya bisa dibagikan.
 */
export function RiwayatAdminPage() {
  const [params, setParams] = useSearchParams();

  const q = params.get('q') ?? '';
  const page = Number(params.get('page') ?? 1);
  const terpilihId = params.get('id');

  const { data, isPending } = useDaftarDisposisi(q, page);

  const terpilih = useMemo(() => {
    if (!data?.data.length) return null;
    return data.data.find((d) => String(d.id) === terpilihId) ?? data.data[0];
  }, [data, terpilihId]);

  const { data: riwayat, isPending: riwayatMemuat } = useRiwayatDisposisi(terpilih?.id);

  const ubah = (bagian: { q?: string; page?: number; id?: number }) => {
    const baru = new URLSearchParams(params);
    if (bagian.q !== undefined) {
      bagian.q ? baru.set('q', bagian.q) : baru.delete('q');
      baru.delete('page');
      baru.delete('id');
    }
    if (bagian.page !== undefined) {
      bagian.page > 1 ? baru.set('page', String(bagian.page)) : baru.delete('page');
      baru.delete('id');
    }
    if (bagian.id !== undefined) baru.set('id', String(bagian.id));
    setParams(baru);
  };

  return (
    <>
      <Toolbar
        nilaiCari={q}
        onCari={(nilai) => ubah({ q: nilai })}
        placeholderCari="Cari surat atau nama pegawai"
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
        {/* daftar */}
        <div className="flex flex-col gap-3">
          {isPending ? (
            Array.from({ length: 5 }).map((_, i) => (
              <Card key={i} className="px-4 py-3.5">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="mt-2.5 h-3.5 w-2/3" />
              </Card>
            ))
          ) : !data?.data.length ? (
            <Card>
              <EmptyState
                ikon={<SearchX size={20} />}
                judul={q ? 'Tidak ada yang cocok' : 'Belum ada disposisi'}
                keterangan={
                  q
                    ? 'Coba kata kunci lain, misalnya nomor agenda atau nama pegawai.'
                    : 'Disposisi yang dibuat dari halaman surat masuk akan tercatat di sini.'
                }
              />
            </Card>
          ) : (
            <>
              {data.data.map((d) => {
                const aktif = d.id === terpilih?.id;
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => ubah({ id: d.id })}
                    className={cn(
                      'rounded-card border bg-surface px-4 py-3.5 text-left shadow-card',
                      'transition-colors duration-150',
                      aktif
                        ? 'border-ink-subtle'
                        : 'border-line hover:border-ink-subtle',
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span className="tabular text-label text-ink-subtle">
                        {d.surat.nomor_agenda}
                      </span>
                      <StatusBadge status={d.status} terlambat={d.terlambat} />
                    </div>
                    <p className="mt-1.5 line-clamp-2 text-base font-medium leading-snug text-ink">
                      {d.surat.perihal}
                    </p>
                    <p className="mt-1 text-label text-ink-subtle">
                      Penerima: {d.penerima.nama}
                    </p>
                  </button>
                );
              })}

              <Card className="overflow-hidden">
                <Pagination
                  meta={data.meta}
                  onPindah={(p) => ubah({ page: p })}
                  satuan="disposisi"
                  className="border-t-0"
                />
              </Card>
            </>
          )}
        </div>

        {/* jejak */}
        {terpilih ? (
          <Card className="h-fit">
            <CardHeader
              judul={`Surat ${terpilih.surat.nomor_agenda} — ${terpilih.surat.perihal}`}
              keterangan={`Penerima disposisi: ${terpilih.penerima.nama} · Disposisi dibuat oleh ${terpilih.pemberi.nama}`}
            />
            <CardBody>
              {riwayatMemuat ? (
                <div className="flex flex-col gap-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : (
                <Timeline riwayat={riwayat ?? []} />
              )}

              <div className="mt-6 border-t border-line pt-5">
                <p className="text-label font-medium text-ink-muted">Instruksi</p>
                <p className="mt-1.5 text-base leading-relaxed text-ink">
                  {terpilih.instruksi}
                </p>
                <p className="mt-3 text-label text-ink-subtle">
                  Batas waktu:{' '}
                  {terpilih.batas_waktu ? tanggalPanjang(terpilih.batas_waktu) : '—'}
                </p>
                <Link
                  to={`/surat-masuk/${terpilih.surat.id}`}
                  className="mt-4 inline-block text-label text-ink-muted underline underline-offset-4 transition-colors hover:text-ink"
                >
                  Buka detail surat masuk
                </Link>
              </div>
            </CardBody>
          </Card>
        ) : (
          <Card className="h-fit">
            <EmptyState
              ikon={<History size={20} />}
              judul="Pilih satu disposisi"
              keterangan="Jejak perubahan statusnya akan ditampilkan di sini."
            />
          </Card>
        )}
      </div>
    </>
  );
}
