import * as Popover from '@radix-ui/react-popover';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/cn';

/**
 * Tombol filter pada toolbar (layar 02, 07, 17, 19) beserta panelnya.
 * Di Figma ini digambar sebagai overlay terpisah; di sini ia popover yang
 * menempel pada pemicunya, sehingga posisinya benar di lebar layar mana pun.
 */
export function FilterDropdown({
  label,
  nilaiTerpilih,
  opsi,
  onPilih,
  lebarPanel = 200,
}: {
  label: string;
  nilaiTerpilih?: string | null;
  opsi: { nilai: string; label: string }[];
  onPilih: (nilai: string | null) => void;
  lebarPanel?: number;
}) {
  const terpilih = opsi.find((o) => o.nilai === nilaiTerpilih);
  const aktif = Boolean(terpilih);

  return (
    <Popover.Root>
      <Popover.Trigger
        className={cn(
          'flex h-[38px] items-center justify-between gap-2 rounded-control border px-3',
          'text-base transition-colors duration-150',
          aktif
            ? 'border-ink-subtle bg-surface text-ink'
            : 'border-line bg-surface text-ink-subtle hover:border-ink-subtle',
        )}
        style={{ minWidth: 150 }}
      >
        <span className="truncate">{terpilih ? terpilih.label : label}</span>
        <ChevronDown size={14} className="shrink-0 text-ink-subtle" />
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={4}
          style={{ width: lebarPanel }}
          className="z-50 overflow-hidden rounded-card border border-line bg-surface p-1 shadow-pop animate-pop-in"
        >
          <Baris
            label={`Semua ${label.toLowerCase()}`}
            terpilih={!aktif}
            onClick={() => onPilih(null)}
          />
          <div className="my-1 h-px bg-line" />
          {opsi.map((o) => (
            <Baris
              key={o.nilai}
              label={o.label}
              terpilih={o.nilai === nilaiTerpilih}
              onClick={() => onPilih(o.nilai)}
            />
          ))}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

function Baris({
  label,
  terpilih,
  onClick,
}: {
  label: string;
  terpilih: boolean;
  onClick: () => void;
}) {
  return (
    <Popover.Close
      onClick={onClick}
      className={cn(
        'flex w-full items-center justify-between gap-2 rounded-control px-2.5 py-2',
        'text-left text-base text-ink transition-colors hover:bg-surface-muted',
      )}
    >
      <span className="truncate">{label}</span>
      {terpilih ? <Check size={14} className="shrink-0 text-accent" /> : null}
    </Popover.Close>
  );
}
