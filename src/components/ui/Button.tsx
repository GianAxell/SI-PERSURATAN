import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cn } from '@/lib/cn';

type Ragam = 'utama' | 'kedua' | 'hantu' | 'bahaya';
type Ukuran = 'toolbar' | 'form' | 'kecil';

const RAGAM: Record<Ragam, string> = {
  // tombol utama memakai warna sidebar, bukan oranye — oranye hanya penanda posisi
  utama: 'bg-nav text-white hover:bg-nav-active active:bg-nav disabled:bg-ink-subtle',
  kedua:
    'bg-surface text-ink border border-line hover:bg-surface-muted active:bg-surface-muted',
  hantu: 'bg-transparent text-ink-muted hover:bg-surface-muted hover:text-ink',
  bahaya:
    'bg-st-merah-bg text-st-merah-fg border border-st-merah-br hover:brightness-[0.98]',
};

const UKURAN: Record<Ukuran, string> = {
  toolbar: 'h-[38px] px-4 text-sm',
  form: 'h-[42px] px-5 text-base',
  kecil: 'h-[30px] px-3 text-label',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  ragam?: Ragam;
  ukuran?: Ukuran;
  /** Render sebagai elemen anak (mis. <Link>) alih-alih <button>. */
  asChild?: boolean;
  penuh?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, ragam = 'kedua', ukuran = 'toolbar', asChild, penuh, type, ...props },
  ref,
) {
  const Komponen = asChild ? Slot : 'button';
  return (
    <Komponen
      ref={ref}
      type={asChild ? undefined : (type ?? 'button')}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-control font-semibold',
        'transition-colors duration-150 select-none',
        'disabled:cursor-not-allowed disabled:opacity-60',
        RAGAM[ragam],
        UKURAN[ukuran],
        penuh && 'w-full',
        className,
      )}
      {...props}
    />
  );
});
