import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { Meta } from '@/types';

/**
 * Layar 02 dan 39: keterangan jumlah di kiri, nomor halaman di kanan.
 * Halaman aktif memakai warna aksen — satu-satunya tempat oranye dipakai
 * sebagai latar, selain penanda menu sidebar.
 */
export function Pagination({
  meta,
  onPindah,
  satuan = 'data',
  className,
}: {
  meta: Meta;
  onPindah: (halaman: number) => void;
  satuan?: string;
  className?: string;
}) {
  const { page, limit, total, total_page } = meta;
  if (total === 0) return null;

  const dari = (page - 1) * limit + 1;
  const sampai = Math.min(page * limit, total);

  return (
    <div
      className={cn(
        'flex items-center justify-between gap-4 border-t border-line px-6 py-3.5',
        className,
      )}
    >
      <p className="text-label text-ink-subtle">
        Menampilkan <span className="tabular">{dari}</span> sampai{' '}
        <span className="tabular">{sampai}</span> dari{' '}
        <span className="tabular">{total}</span> {satuan}
      </p>

      {total_page > 1 ? (
        <nav className="flex items-center gap-1" aria-label="Navigasi halaman">
          <TombolArah
            arah="kiri"
            disabled={page <= 1}
            onClick={() => onPindah(page - 1)}
          />
          {nomorHalaman(page, total_page).map((n, i) =>
            n === null ? (
              <span key={`sela-${i}`} className="px-1 text-label text-ink-subtle">
                …
              </span>
            ) : (
              <button
                key={n}
                type="button"
                onClick={() => onPindah(n)}
                aria-current={n === page ? 'page' : undefined}
                className={cn(
                  'tabular h-7 min-w-7 rounded-control px-2 text-label font-medium transition-colors',
                  n === page
                    ? 'bg-accent text-white'
                    : 'border border-line bg-surface text-ink-muted hover:bg-surface-muted',
                )}
              >
                {n}
              </button>
            ),
          )}
          <TombolArah
            arah="kanan"
            disabled={page >= total_page}
            onClick={() => onPindah(page + 1)}
          />
        </nav>
      ) : null}
    </div>
  );
}

function TombolArah({
  arah,
  ...props
}: { arah: 'kiri' | 'kanan' } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const Ikon = arah === 'kiri' ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      aria-label={arah === 'kiri' ? 'Halaman sebelumnya' : 'Halaman berikutnya'}
      className="flex h-7 w-7 items-center justify-center rounded-control border border-line bg-surface text-ink-muted transition-colors hover:bg-surface-muted disabled:opacity-40 disabled:hover:bg-surface"
      {...props}
    >
      <Ikon size={14} />
    </button>
  );
}

/** 1 … 4 5 6 … 20 — selalu menampilkan halaman pertama, terakhir, dan tetangga. */
function nomorHalaman(aktif: number, total: number): (number | null)[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const hasil: (number | null)[] = [1];
  const mulai = Math.max(2, aktif - 1);
  const akhir = Math.min(total - 1, aktif + 1);

  if (mulai > 2) hasil.push(null);
  for (let i = mulai; i <= akhir; i += 1) hasil.push(i);
  if (akhir < total - 1) hasil.push(null);
  hasil.push(total);

  return hasil;
}
