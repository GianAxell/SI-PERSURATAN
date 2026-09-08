import { cn } from '@/lib/cn';
import { KELAS_BADGE, type NadaBadge } from '@/lib/status';

export interface BadgeProps {
  nada?: NadaBadge;
  children: React.ReactNode;
  className?: string;
  /** Lebar tetap agar kolom Status pada tabel tidak bergoyang. */
  lebarTetap?: boolean;
}

export function Badge({ nada = 'abu', children, className, lebarTetap }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-pill border',
        'px-2.5 py-1 text-badge font-medium whitespace-nowrap',
        KELAS_BADGE[nada],
        lebarTetap && 'w-24',
        className,
      )}
    >
      {children}
    </span>
  );
}
