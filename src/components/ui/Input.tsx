import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

const DASAR =
  'w-full rounded-control border bg-surface px-3 text-base text-ink ' +
  'transition-colors duration-150 placeholder:text-ink-subtle ' +
  'disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-ink-subtle';

const NORMAL = 'border-line hover:border-ink-subtle';
const GALAT = 'border-st-merah-br bg-st-merah-bg/40';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** 40px untuk formulir, 38px untuk toolbar. */
  tinggi?: 'form' | 'toolbar';
  ikonKiri?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, tinggi = 'form', ikonKiri, ...props },
  ref,
) {
  const kolom = (
    <input
      ref={ref}
      className={cn(
        DASAR,
        props['aria-invalid'] ? GALAT : NORMAL,
        tinggi === 'form' ? 'h-10' : 'h-[38px]',
        ikonKiri && 'pl-9',
        className,
      )}
      {...props}
    />
  );

  if (!ikonKiri) return kolom;

  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-subtle">
        {ikonKiri}
      </span>
      {kolom}
    </div>
  );
});

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, rows = 4, ...props },
  ref,
) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      className={cn(
        DASAR,
        props['aria-invalid'] ? GALAT : NORMAL,
        'resize-y py-2.5 leading-relaxed',
        className,
      )}
      {...props}
    />
  );
});
