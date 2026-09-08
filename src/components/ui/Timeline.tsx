import { cn } from '@/lib/cn';
import { waktuPanjang } from '@/lib/format';
import { KELAS_BADGE, STATUS_DISPOSISI } from '@/lib/status';
import { Badge } from './Badge';
import type { RiwayatDisposisi } from '@/types';

/**
 * Riwayat perubahan status disposisi (layar 06 dan panel bawah layar 18).
 *
 * Setiap baris adalah satu perubahan status yang dicatat server (B-6), bukan
 * rangkuman yang disusun ulang di klien — dengan begitu urutan dan waktunya
 * sama persis dengan yang tersimpan.
 */
export function Timeline({ riwayat }: { riwayat: RiwayatDisposisi[] }) {
  if (riwayat.length === 0) {
    return <p className="text-sm text-ink-subtle">Belum ada perubahan status.</p>;
  }

  return (
    <ol className="relative flex flex-col gap-6 pl-6">
      {/* garis penghubung; berhenti di titik terakhir, bukan menggantung */}
      <span
        className="absolute left-[5px] top-2 w-px bg-line"
        style={{ height: `calc(100% - ${riwayat.length > 1 ? '2rem' : '100%'})` }}
        aria-hidden
      />

      {riwayat.map((r) => {
        const s = STATUS_DISPOSISI[r.status_baru];
        return (
          <li key={r.id} className="relative">
            <span
              className={cn(
                'absolute -left-6 top-1.5 h-2.5 w-2.5 rounded-full border',
                KELAS_BADGE[s.nada],
              )}
              aria-hidden
            />
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-base text-ink">{kalimat(r)}</p>
              <Badge nada={s.nada}>{s.label}</Badge>
            </div>
            <p className="mt-1 text-label text-ink-subtle">{waktuPanjang(r.waktu)}</p>
            {r.catatan ? (
              <p className="mt-2 rounded-control bg-surface-muted px-3 py-2 text-base text-ink-muted">
                {r.catatan}
              </p>
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}

/** Bahasa yang dipakai layar 06: "Disposisi dibuka oleh Budi Santoso". */
function kalimat(r: RiwayatDisposisi) {
  if (r.status_lama === null) return `Disposisi dibuat oleh ${r.aktor.nama}`;
  if (r.status_baru === 'diproses') return `Disposisi dibuka oleh ${r.aktor.nama}`;
  if (r.status_baru === 'selesai') return `Tindak lanjut diselesaikan oleh ${r.aktor.nama}`;
  return `Status diubah oleh ${r.aktor.nama}`;
}
