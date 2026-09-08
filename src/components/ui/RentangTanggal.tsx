import * as Popover from '@radix-ui/react-popover';
import { useEffect, useState } from 'react';
import { CalendarDays, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/cn';
import { tanggalPendek } from '@/lib/format';
import { Button } from './Button';
import { DateInput } from './DateInput';

export interface Rentang {
  dari: string | null;
  sampai: string | null;
}

/**
 * Filter "Rentang tanggal" (layar 02, 19). Di Figma digambar sebagai overlay
 * berisi dua kolom tanggal; di sini popover dengan isi yang sama.
 */
export function RentangTanggal({
  nilai,
  onUbah,
  label = 'Rentang tanggal',
}: {
  nilai: Rentang;
  onUbah: (r: Rentang) => void;
  label?: string;
}) {
  const [buka, setBuka] = useState(false);
  const [draf, setDraf] = useState<Rentang>(nilai);

  useEffect(() => setDraf(nilai), [nilai]);

  const aktif = Boolean(nilai.dari || nilai.sampai);
  const ringkas = aktif
    ? `${nilai.dari ? tanggalPendek(nilai.dari) : 'Awal'} – ${
        nilai.sampai ? tanggalPendek(nilai.sampai) : 'Kini'
      }`
    : label;

  /* Tanggal terbalik hampir selalu salah ketik, bukan maksud pengguna. */
  const terbalik = Boolean(draf.dari && draf.sampai && draf.dari > draf.sampai);

  return (
    <Popover.Root open={buka} onOpenChange={setBuka}>
      <Popover.Trigger
        className={cn(
          'flex h-[38px] items-center justify-between gap-2 rounded-control border px-3',
          'text-base transition-colors duration-150',
          aktif
            ? 'border-ink-subtle bg-surface text-ink'
            : 'border-line bg-surface text-ink-subtle hover:border-ink-subtle',
        )}
        style={{ minWidth: 190 }}
      >
        <span className="flex min-w-0 items-center gap-2">
          <CalendarDays size={14} className="shrink-0 text-ink-subtle" />
          <span className="truncate">{ringkas}</span>
        </span>
        <ChevronDown size={14} className="shrink-0 text-ink-subtle" />
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={4}
          className="z-50 w-[280px] rounded-card border border-line bg-surface p-4 shadow-pop animate-pop-in"
        >
          <div className="flex flex-col gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-label font-medium text-ink-muted">Dari tanggal</span>
              <DateInput
                tinggi="toolbar"
                value={draf.dari ?? ''}
                onChange={(e) => setDraf((d) => ({ ...d, dari: e.target.value || null }))}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-label font-medium text-ink-muted">Sampai tanggal</span>
              <DateInput
                tinggi="toolbar"
                value={draf.sampai ?? ''}
                onChange={(e) =>
                  setDraf((d) => ({ ...d, sampai: e.target.value || null }))
                }
              />
            </label>

            {terbalik ? (
              <p className="text-note text-st-merah-fg">
                Tanggal awal melewati tanggal akhir
              </p>
            ) : null}

            <div className="mt-1 flex items-center justify-between gap-3">
              <Button
                ragam="hantu"
                ukuran="kecil"
                onClick={() => {
                  setDraf({ dari: null, sampai: null });
                  onUbah({ dari: null, sampai: null });
                  setBuka(false);
                }}
              >
                Atur ulang
              </Button>
              <Button
                ragam="utama"
                ukuran="kecil"
                disabled={terbalik}
                onClick={() => {
                  onUbah(draf);
                  setBuka(false);
                }}
              >
                Terapkan
              </Button>
            </div>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
