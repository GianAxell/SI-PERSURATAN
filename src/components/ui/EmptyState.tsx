import { cn } from '@/lib/cn';

/**
 * Layar 26. Bedakan dua keadaan yang terlihat mirip tapi berbeda artinya:
 * belum ada data sama sekali, versus filter yang tidak menemukan apa-apa.
 * Yang kedua butuh tombol "Hapus filter", yang pertama tidak.
 */
export function EmptyState({
  ikon,
  judul,
  keterangan,
  aksi,
  className,
}: {
  ikon?: React.ReactNode;
  judul: string;
  keterangan?: string;
  aksi?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 px-6 py-16 text-center',
        className,
      )}
    >
      {ikon ? (
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-muted text-ink-subtle">
          {ikon}
        </div>
      ) : null}
      <div>
        <p className="text-card font-semibold text-ink">{judul}</p>
        {keterangan ? (
          <p className="mx-auto mt-1.5 max-w-[420px] text-sm text-ink-subtle">
            {keterangan}
          </p>
        ) : null}
      </div>
      {aksi ? <div className="mt-2 flex items-center gap-3">{aksi}</div> : null}
    </div>
  );
}
