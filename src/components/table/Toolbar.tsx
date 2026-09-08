import { Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/cn';

/**
 * Baris pencarian + filter + tombol aksi di atas tabel (layar 02, 07, 13 …).
 * Kolom pencarian memuai mengisi ruang; filter dan tombol berukuran tetap.
 */
export function Toolbar({
  nilaiCari,
  onCari,
  placeholderCari,
  filter,
  aksi,
  className,
}: {
  nilaiCari: string;
  onCari: (nilai: string) => void;
  placeholderCari: string;
  filter?: React.ReactNode;
  aksi?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('mb-4 flex flex-wrap items-center gap-3', className)}>
      <div className="min-w-[280px] flex-1">
        <PencarianTertunda
          nilai={nilaiCari}
          onUbah={onCari}
          placeholder={placeholderCari}
        />
      </div>
      {filter ? <div className="flex items-center gap-3">{filter}</div> : null}
      {aksi ? <div className="ml-auto flex items-center gap-3">{aksi}</div> : null}
    </div>
  );
}

/**
 * Menunda pengiriman kata kunci 350 ms. Tanpa ini, mengetik "kerja praktik"
 * memicu empat belas permintaan ke server.
 */
function PencarianTertunda({
  nilai,
  onUbah,
  placeholder,
}: {
  nilai: string;
  onUbah: (v: string) => void;
  placeholder: string;
}) {
  const [lokal, setLokal] = useState(nilai);

  useEffect(() => setLokal(nilai), [nilai]);

  useEffect(() => {
    if (lokal === nilai) return;
    const t = setTimeout(() => onUbah(lokal), 350);
    return () => clearTimeout(t);
    // onUbah sengaja tidak diikutkan: ia berubah tiap render di pemanggil
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lokal]);

  return (
    <Input
      tinggi="toolbar"
      value={lokal}
      onChange={(e) => setLokal(e.target.value)}
      placeholder={placeholder}
      ikonKiri={<Search size={15} />}
      aria-label={placeholder}
    />
  );
}
