import { cn } from '@/lib/cn';

/**
 * Batang abu saat data belum datang. Bentuknya sengaja sama dengan
 * placeholder pada mockup Figma, sehingga peralihan dari memuat ke terisi
 * tidak menggeser tata letak.
 */
export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded bg-surface-muted', className)}
      {...props}
    />
  );
}
