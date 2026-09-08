import { useId } from 'react';
import { cn } from '@/lib/cn';

/**
 * Pembungkus label + kolom + pesan galat.
 * Label 11px medium, jarak 6px ke kolom — sesuai layar 03 dan 23.
 */
export function Field({
  label,
  wajib,
  galat,
  keterangan,
  className,
  children,
}: {
  label: string;
  wajib?: boolean;
  galat?: string;
  keterangan?: string;
  className?: string;
  children: (props: { id: string; 'aria-invalid': boolean; 'aria-describedby'?: string }) => React.ReactNode;
}) {
  const id = useId();
  const idPesan = `${id}-pesan`;
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={id} className="text-label font-medium text-ink-muted">
        {label}
        {wajib ? <span className="ml-0.5 text-st-merah-fg">*</span> : null}
      </label>
      {children({
        id,
        'aria-invalid': Boolean(galat),
        'aria-describedby': galat || keterangan ? idPesan : undefined,
      })}
      {galat ? (
        <p id={idPesan} className="text-note text-st-merah-fg">
          {galat}
        </p>
      ) : keterangan ? (
        <p id={idPesan} className="text-note text-ink-subtle">
          {keterangan}
        </p>
      ) : null}
    </div>
  );
}
