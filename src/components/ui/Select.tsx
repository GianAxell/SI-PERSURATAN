import * as RSelect from '@radix-ui/react-select';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface OpsiSelect {
  nilai: string;
  label: string;
  keterangan?: string;
}

/**
 * Select berbasis Radix — perilaku papan ketik dan aksesibilitas datang
 * gratis, tampilannya tetap milik kita (Figma memakai kotak putih dengan
 * kaitan ▾ di kanan).
 */
export function Select({
  nilai,
  onUbah,
  opsi,
  placeholder = 'Pilih',
  id,
  tinggi = 'form',
  className,
  disabled,
  'aria-invalid': galat,
}: {
  nilai?: string;
  onUbah: (nilai: string) => void;
  opsi: OpsiSelect[];
  placeholder?: string;
  id?: string;
  tinggi?: 'form' | 'toolbar';
  className?: string;
  disabled?: boolean;
  'aria-invalid'?: boolean;
}) {
  return (
    <RSelect.Root value={nilai} onValueChange={onUbah} disabled={disabled}>
      <RSelect.Trigger
        id={id}
        aria-invalid={galat}
        className={cn(
          'flex w-full items-center justify-between gap-2 rounded-control border bg-surface px-3',
          'text-base text-ink transition-colors duration-150',
          'data-[placeholder]:text-ink-subtle',
          'disabled:cursor-not-allowed disabled:bg-surface-muted',
          galat ? 'border-st-merah-br' : 'border-line hover:border-ink-subtle',
          tinggi === 'form' ? 'h-10' : 'h-[38px]',
          className,
        )}
      >
        <RSelect.Value placeholder={placeholder} />
        <RSelect.Icon>
          <ChevronDown size={14} className="text-ink-subtle" />
        </RSelect.Icon>
      </RSelect.Trigger>

      <RSelect.Portal>
        <RSelect.Content
          position="popper"
          sideOffset={4}
          className={cn(
            'z-50 min-w-[--radix-select-trigger-width] overflow-hidden',
            'rounded-card border border-line bg-surface shadow-pop animate-pop-in',
          )}
        >
          <RSelect.Viewport className="p-1">
            {opsi.map((o) => (
              <RSelect.Item
                key={o.nilai}
                value={o.nilai}
                className={cn(
                  'relative flex cursor-pointer select-none items-center gap-2 rounded-control',
                  'px-2.5 py-2 pr-8 text-base text-ink outline-none',
                  'data-[highlighted]:bg-surface-muted',
                )}
              >
                <div className="min-w-0">
                  <RSelect.ItemText>{o.label}</RSelect.ItemText>
                  {o.keterangan ? (
                    <div className="text-note text-ink-subtle">{o.keterangan}</div>
                  ) : null}
                </div>
                <RSelect.ItemIndicator className="absolute right-2.5">
                  <Check size={14} className="text-accent" />
                </RSelect.ItemIndicator>
              </RSelect.Item>
            ))}
          </RSelect.Viewport>
        </RSelect.Content>
      </RSelect.Portal>
    </RSelect.Root>
  );
}
