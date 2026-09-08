import { useRef, useState } from 'react';
import { FileText, Trash2, UploadCloud } from 'lucide-react';
import { cn } from '@/lib/cn';
import { ukuranBerkas } from '@/lib/format';

export const MAKS_UKURAN = 10 * 1024 * 1024; // NFR-07 / K-13: 10 MB
export const TIPE_DITERIMA = 'application/pdf';

/**
 * Area unggah berkas surat (layar 03).
 *
 * Validasi di sini hanya untuk kenyamanan — server memvalidasi ulang (B-13).
 * Yang penting: pengguna tahu berkasnya ditolak sebelum menunggu unggahan
 * selesai, bukan sesudahnya.
 */
export function FileUpload({
  berkas,
  onPilih,
  progress,
  galat,
  id,
}: {
  berkas: File | null;
  onPilih: (f: File | null) => void;
  progress?: number | null;
  galat?: string;
  id?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [seret, setSeret] = useState(false);
  const [galatLokal, setGalatLokal] = useState<string | null>(null);

  const periksa = (f: File) => {
    if (f.type !== TIPE_DITERIMA) return 'Berkas harus berformat PDF';
    if (f.size > MAKS_UKURAN) return `Ukuran berkas ${ukuranBerkas(f.size)}, maksimum 10 MB`;
    return null;
  };

  const terima = (f: File | undefined) => {
    if (!f) return;
    const pesan = periksa(f);
    setGalatLokal(pesan);
    onPilih(pesan ? null : f);
  };

  const pesan = galat ?? galatLokal;

  if (berkas) {
    return (
      <div className="rounded-control border border-line bg-surface px-4 py-3">
        <div className="flex items-center gap-3">
          <FileText size={18} className="shrink-0 text-ink-subtle" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-base text-ink">{berkas.name}</p>
            <p className="text-note text-ink-subtle">{ukuranBerkas(berkas.size)}</p>
          </div>
          <button
            type="button"
            onClick={() => {
              onPilih(null);
              setGalatLokal(null);
              if (inputRef.current) inputRef.current.value = '';
            }}
            aria-label="Hapus berkas"
            className="rounded-control p-1.5 text-ink-subtle transition-colors hover:bg-surface-muted hover:text-st-merah-fg"
          >
            <Trash2 size={15} />
          </button>
        </div>

        {typeof progress === 'number' ? (
          <div className="mt-3">
            <div className="h-1 overflow-hidden rounded-full bg-surface-muted">
              <div
                className="h-full rounded-full bg-accent transition-[width] duration-200"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-1.5 text-note text-ink-subtle">Mengunggah {progress}%</p>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        id={id}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setSeret(true);
        }}
        onDragLeave={() => setSeret(false)}
        onDrop={(e) => {
          e.preventDefault();
          setSeret(false);
          terima(e.dataTransfer.files[0]);
        }}
        className={cn(
          'flex w-full flex-col items-center justify-center gap-2 rounded-control border border-dashed px-6 py-8',
          'transition-colors duration-150',
          seret
            ? 'border-accent bg-st-amber-bg/40'
            : pesan
              ? 'border-st-merah-br bg-st-merah-bg/30'
              : 'border-line bg-surface hover:border-ink-subtle hover:bg-surface-muted/50',
        )}
      >
        <UploadCloud size={22} className="text-ink-subtle" />
        <span className="text-base text-ink-muted">
          Seret berkas ke sini atau klik untuk memilih
        </span>
        <span className="text-note text-ink-subtle">Format PDF, maksimum 10 MB</span>
      </button>

      {pesan ? <p className="mt-1.5 text-note text-st-merah-fg">{pesan}</p> : null}

      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={(e) => terima(e.target.files?.[0])}
      />
    </>
  );
}
