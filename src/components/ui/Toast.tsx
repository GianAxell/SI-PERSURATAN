import { createContext, use, useCallback, useMemo, useRef, useState } from 'react';
import { CheckCircle2, Info, TriangleAlert, X } from 'lucide-react';
import { cn } from '@/lib/cn';

/**
 * Pemberitahuan singkat di kanan atas, tepat di bawah topbar.
 *
 * Dipakai untuk mengabarkan hasil sebuah tindakan — tersimpan, terkirim,
 * gagal — bukan untuk memberi peringatan yang harus dibaca sebelum lanjut.
 * Yang harus dibaca lebih dulu tempatnya di ConfirmDialog, bukan di sini.
 *
 * Kabar gagal bertahan lebih lama daripada kabar berhasil: yang berhasil
 * sudah terlihat hasilnya di layar, sedangkan yang gagal memuat kalimat
 * yang perlu benar-benar dibaca.
 */

type Nada = 'sukses' | 'galat' | 'info';

interface Pesan {
  id: number;
  nada: Nada;
  judul: string;
  keterangan?: string;
}

interface NilaiToast {
  sukses: (judul: string, keterangan?: string) => void;
  galat: (judul: string, keterangan?: string) => void;
  info: (judul: string, keterangan?: string) => void;
}

const KonteksToast = createContext<NilaiToast | null>(null);

const DURASI: Record<Nada, number> = {
  sukses: 4500,
  info: 5000,
  galat: 8000,
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [daftar, setDaftar] = useState<Pesan[]>([]);
  const nomor = useRef(0);

  const buang = useCallback((id: number) => {
    setDaftar((d) => d.filter((p) => p.id !== id));
  }, []);

  const tambah = useCallback(
    (nada: Nada, judul: string, keterangan?: string) => {
      const id = ++nomor.current;
      /* Yang terbaru di posisi teratas, sesuai arah baca — kabar yang baru
         datang tidak boleh tersembunyi di bawah kabar yang sudah lewat.
         Maksimal tiga sekaligus; lebih dari itu yang terbawah sudah tidak
         sempat terbaca sebelum waktunya habis. */
      setDaftar((d) => [{ id, nada, judul, keterangan }, ...d.slice(0, 2)]);
      window.setTimeout(() => buang(id), DURASI[nada]);
    },
    [buang],
  );

  const nilai = useMemo<NilaiToast>(
    () => ({
      sukses: (judul, keterangan) => tambah('sukses', judul, keterangan),
      galat: (judul, keterangan) => tambah('galat', judul, keterangan),
      info: (judul, keterangan) => tambah('info', judul, keterangan),
    }),
    [tambah],
  );

  return (
    <KonteksToast value={nilai}>
      {children}
      <div
        /* Pembaca layar mengumumkan isinya tanpa memindahkan fokus, sehingga
           pengguna papan ketik tidak terlempar dari kolom yang sedang diisi. */
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed right-6 top-[76px] z-[60] flex w-[min(360px,calc(100vw-3rem))] flex-col gap-2"
      >
        {daftar.map((p) => (
          <Kartu key={p.id} pesan={p} onTutup={() => buang(p.id)} />
        ))}
      </div>
    </KonteksToast>
  );
}

const RAGAM: Record<Nada, { kelas: string; ikon: React.ReactNode }> = {
  sukses: {
    kelas: 'border-st-hijau-br bg-st-hijau-bg text-st-hijau-fg',
    ikon: <CheckCircle2 size={16} />,
  },
  galat: {
    kelas: 'border-st-merah-br bg-st-merah-bg text-st-merah-fg',
    ikon: <TriangleAlert size={16} />,
  },
  info: {
    kelas: 'border-line bg-surface text-ink-muted',
    ikon: <Info size={16} />,
  },
};

function Kartu({ pesan, onTutup }: { pesan: Pesan; onTutup: () => void }) {
  const ragam = RAGAM[pesan.nada];
  return (
    <div
      role={pesan.nada === 'galat' ? 'alert' : 'status'}
      className={cn(
        'pointer-events-auto flex items-start gap-2.5 rounded-card border px-3.5 py-3 shadow-pop',
        'animate-toast-in',
        ragam.kelas,
      )}
    >
      <span className="mt-px shrink-0">{ragam.ikon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-base font-semibold leading-snug">{pesan.judul}</p>
        {pesan.keterangan ? (
          <p className="mt-0.5 text-label leading-relaxed opacity-90">{pesan.keterangan}</p>
        ) : null}
      </div>
      <button
        type="button"
        onClick={onTutup}
        aria-label="Tutup pemberitahuan"
        className="-mr-1 -mt-0.5 shrink-0 rounded-control p-1 opacity-60 transition-opacity hover:opacity-100"
      >
        <X size={14} />
      </button>
    </div>
  );
}

export function useToast() {
  const nilai = use(KonteksToast);
  if (!nilai) throw new Error('useToast harus dipakai di dalam <ToastProvider>');
  return nilai;
}
