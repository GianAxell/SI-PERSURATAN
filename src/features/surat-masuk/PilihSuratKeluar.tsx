import { useState } from 'react';
import { Check, Search, X } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { cn } from '@/lib/cn';
import { tanggalPendek } from '@/lib/format';
import { useSuratKeluarTersedia } from './api';

/**
 * Pencarian surat keluar untuk ditautkan sebagai balasan (layar 03 dan 12).
 *
 * Daftar hanya berisi surat keluar yang belum menjadi balasan surat lain —
 * satu surat keluar hanya untuk satu surat masuk (K-12). Penyaringan itu
 * dikerjakan server, bukan di sini.
 */
export function PilihSuratKeluar({
  terpilihId,
  onPilih,
}: {
  terpilihId: number | null;
  onPilih: (id: number | null) => void;
}) {
  const [q, setQ] = useState('');
  const { data, isPending } = useSuratKeluarTersedia(q);

  const terpilih = data?.find((s) => s.id === terpilihId);

  if (terpilih) {
    return (
      <div className="flex items-center gap-3 rounded-control border border-line bg-surface px-4 py-3">
        <Check size={16} className="shrink-0 text-st-hijau-fg" />
        <div className="min-w-0 flex-1">
          <p className="tabular truncate text-base text-ink">{terpilih.nomor_surat}</p>
          <p className="truncate text-label text-ink-subtle">
            {terpilih.perihal} · {tanggalPendek(terpilih.tanggal_surat)}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onPilih(null)}
          aria-label="Lepas tautan"
          className="rounded-control p-1.5 text-ink-subtle transition-colors hover:bg-surface-muted hover:text-ink"
        >
          <X size={15} />
        </button>
      </div>
    );
  }

  return (
    <div>
      <Input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Cari nomor surat keluar (boleh dikosongkan)"
        ikonKiri={<Search size={15} />}
      />

      {q ? (
        <div className="mt-2 max-h-[220px] overflow-y-auto rounded-control border border-line">
          {isPending ? (
            <div className="flex flex-col gap-2 p-3">
              <Skeleton className="h-3 w-2/3" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ) : !data?.length ? (
            <p className="px-4 py-6 text-center text-sm text-ink-subtle">
              Tidak ada surat keluar yang cocok
            </p>
          ) : (
            data.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => onPilih(s.id)}
                className={cn(
                  'flex w-full flex-col items-start gap-0.5 border-b border-line px-4 py-2.5',
                  'text-left last:border-b-0 transition-colors hover:bg-surface-muted',
                )}
              >
                <span className="tabular text-base text-ink">{s.nomor_surat}</span>
                <span className="text-label text-ink-subtle">
                  {s.perihal} · {s.kepada} · {tanggalPendek(s.tanggal_surat)}
                </span>
              </button>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}
