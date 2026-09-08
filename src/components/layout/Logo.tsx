import { cn } from '@/lib/cn';

/**
 * Logo Metanouva, diekspor dari Figma (node 1:5 pada layar 01 Login).
 * Sudut membulatnya sudah menyatu di dalam berkas, jadi tidak perlu
 * border-radius tambahan — kalau ditambah, sudutnya akan terpotong dua kali.
 */
export function Logo({
  ukuran = 32,
  className,
}: {
  ukuran?: number;
  className?: string;
}) {
  return (
    <img
      src="/logo-metanouva.png"
      alt="Logo PT Metanouva Informatika"
      width={ukuran}
      height={ukuran}
      className={cn('shrink-0 select-none', className)}
      style={{ width: ukuran, height: ukuran }}
      draggable={false}
    />
  );
}
