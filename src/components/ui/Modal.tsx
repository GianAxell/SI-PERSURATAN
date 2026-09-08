import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/cn';

/**
 * Overlay Figma (layar 23, 24, 29, 30, 31, 32, 33, 34, 35) digambar sebagai
 * panel putih di tengah dengan latar gelap tipis. Elemen di belakangnya
 * memang tidak bisa ditekan — itu perilaku modal, bukan kekurangan.
 */
export function Modal({
  terbuka,
  onTutup,
  judul,
  keterangan,
  lebar = 'sedang',
  footer,
  children,
}: {
  terbuka: boolean;
  onTutup: () => void;
  judul: string;
  keterangan?: string;
  lebar?: 'sempit' | 'sedang' | 'lebar' | 'penuh';
  footer?: React.ReactNode;
  children: React.ReactNode;
}) {
  const LEBAR = {
    sempit: 'max-w-[420px]',
    sedang: 'max-w-[560px]',
    lebar: 'max-w-[760px]',
    penuh: 'max-w-[1100px]',
  }[lebar];

  return (
    <Dialog.Root open={terbuka} onOpenChange={(o) => !o && onTutup()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-ink/25 animate-fade-in" />
        <Dialog.Content
          className={cn(
            'fixed left-1/2 top-1/2 z-50 w-[calc(100vw-4rem)] -translate-x-1/2 -translate-y-1/2',
            'rounded-card border border-line bg-surface shadow-pop animate-pop-in',
            'max-h-[calc(100vh-4rem)] overflow-hidden flex flex-col',
            LEBAR,
          )}
        >
          <div className="flex items-start justify-between gap-4 border-b border-line px-6 py-4">
            <div className="min-w-0">
              <Dialog.Title className="text-card font-semibold text-ink">
                {judul}
              </Dialog.Title>
              {keterangan ? (
                <Dialog.Description className="mt-1 text-label text-ink-subtle">
                  {keterangan}
                </Dialog.Description>
              ) : null}
            </div>
            <Dialog.Close
              className="-mr-1 -mt-1 rounded-control p-1.5 text-ink-subtle transition-colors hover:bg-surface-muted hover:text-ink"
              aria-label="Tutup"
            >
              <X size={16} />
            </Dialog.Close>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">{children}</div>

          {footer ? (
            <div className="flex items-center justify-end gap-3 border-t border-line px-6 py-4">
              {footer}
            </div>
          ) : null}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
