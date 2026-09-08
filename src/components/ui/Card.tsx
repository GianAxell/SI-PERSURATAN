import { cn } from '@/lib/cn';

export function Card({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-card border border-line bg-surface shadow-card',
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({
  judul,
  keterangan,
  aksi,
  className,
}: {
  judul: React.ReactNode;
  keterangan?: React.ReactNode;
  aksi?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex items-start justify-between gap-4 border-b border-line px-6 py-4',
        className,
      )}
    >
      <div className="min-w-0">
        <h2 className="text-card font-semibold text-ink">{judul}</h2>
        {keterangan ? (
          <p className="mt-1 text-label text-ink-subtle">{keterangan}</p>
        ) : null}
      </div>
      {aksi ? <div className="shrink-0">{aksi}</div> : null}
    </div>
  );
}

export function CardBody({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('px-6 py-5', className)} {...props} />;
}

export function CardFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'flex items-center justify-end gap-3 border-t border-line px-6 py-4',
        className,
      )}
      {...props}
    />
  );
}
