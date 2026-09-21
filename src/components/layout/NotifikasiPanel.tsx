import * as Popover from '@radix-ui/react-popover';
import { Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/cn';
import { waktuRelatif } from '@/lib/format';
import type { Notifikasi } from '@/types';

/**
 * Overlay Pemberitahuan (Admin & Pegawai). K-3: notifikasi in-app masuk
 * scope, email tidak.
 */
export function NotifikasiPanel({
  daftar,
  belumDibaca,
  onTandaiSemua,
  tautanSemua,
  labelSemua,
}: {
  daftar: Notifikasi[];
  belumDibaca: number;
  onTandaiSemua: () => void;
  tautanSemua: string;
  labelSemua: string;
}) {
  const navigate = useNavigate();

  const bukaTautan = (n: Notifikasi) => {
    if (!n.tautan) return;
    const peta = {
      surat_masuk: `/surat-masuk/${n.tautan.id}`,
      surat_keluar: `/surat-keluar/${n.tautan.id}`,
      disposisi: `/disposisi-saya/${n.tautan.id}`,
    } as const;
    navigate(peta[n.tautan.tipe]);
  };

  return (
    <Popover.Root>
      <Popover.Trigger
        aria-label={`Pemberitahuan${belumDibaca ? `, ${belumDibaca} belum dibaca` : ''}`}
        className="relative rounded-control p-2 text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink"
      >
        <Bell size={18} />
        {belumDibaca > 0 ? (
          <span
            className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-accent ring-2 ring-surface"
            aria-hidden
          />
        ) : null}
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          align="end"
          sideOffset={8}
          className="z-50 w-[360px] overflow-hidden rounded-card border border-line bg-surface shadow-pop animate-pop-in"
        >
          <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
            <p className="text-card font-semibold text-ink">Pemberitahuan</p>
            <button
              type="button"
              onClick={onTandaiSemua}
              disabled={belumDibaca === 0}
              className="text-label text-ink-subtle transition-colors hover:text-ink disabled:opacity-50 disabled:hover:text-ink-subtle"
            >
              Tandai sudah dibaca
            </button>
          </div>

          <div className="max-h-[340px] overflow-y-auto">
            {daftar.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-ink-subtle">
                Belum ada pemberitahuan
              </p>
            ) : (
              daftar.map((n) => (
                <Popover.Close
                  key={n.id}
                  onClick={() => bukaTautan(n)}
                  className={cn(
                    'flex w-full gap-3 border-b border-line px-4 py-3 text-left last:border-b-0',
                    'transition-colors hover:bg-surface-muted',
                  )}
                >
                  <span
                    className={cn(
                      'mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full',
                      n.dibaca ? 'bg-transparent' : 'bg-accent',
                    )}
                    aria-hidden
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-ink">
                      {n.judul}
                    </span>
                    <span className="mt-0.5 block truncate text-label text-ink-muted">
                      {n.keterangan}
                    </span>
                    <span className="mt-1 block text-note text-ink-subtle">
                      {waktuRelatif(n.waktu)}
                    </span>
                  </span>
                </Popover.Close>
              ))
            )}
          </div>

          {tautanSemua && labelSemua ? (
            <div className="border-t border-line">
              <Popover.Close
                onClick={() => navigate(tautanSemua)}
                className="block w-full px-4 py-3 text-center text-label font-medium text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink"
              >
                {labelSemua}
              </Popover.Close>
            </div>
          ) : null}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
