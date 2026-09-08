import { Badge } from './Badge';
import { BADGE_TERLAMBAT, labelStatusDisposisi } from '@/lib/status';
import type { StatusDisposisi } from '@/types';

/**
 * Status disposisi + penanda terlambat. "Terlambat" bukan status keempat
 * (K-4), jadi ia muncul sebagai badge kedua di sebelahnya, bukan
 * menggantikan status yang sedang berjalan.
 */
export function StatusBadge({
  status,
  terlambat,
  lebarTetap,
}: {
  status: StatusDisposisi | null;
  terlambat?: boolean;
  lebarTetap?: boolean;
}) {
  const s = labelStatusDisposisi(status);
  return (
    <span className="inline-flex items-center gap-1.5">
      <Badge nada={s.nada} lebarTetap={lebarTetap}>
        {s.label}
      </Badge>
      {terlambat && status !== 'selesai' ? (
        <Badge nada={BADGE_TERLAMBAT.nada}>{BADGE_TERLAMBAT.label}</Badge>
      ) : null}
    </span>
  );
}
