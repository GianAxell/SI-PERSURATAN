import { useEffect, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Download, X } from 'lucide-react';
import { api, pesanError } from '@/lib/api';
import { Button } from './Button';

/**
 * Layar 35 Pratinjau Dokumen.
 *
 * Berkas surat terproteksi (NFR-08), jadi <embed src="/uploads/..."> tidak
 * bisa dipakai — URL-nya butuh header Authorization. Berkas diambil sebagai
 * blob lebih dulu, lalu blob URL itu yang dipasang ke <iframe>.
 */
export function PdfPreview({
  terbuka,
  onTutup,
  url,
  judul,
  namaBerkas,
}: {
  terbuka: boolean;
  onTutup: () => void;
  url: string;
  judul: string;
  namaBerkas: string;
}) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [galat, setGalat] = useState<string | null>(null);

  useEffect(() => {
    if (!terbuka) return;
    let dibatalkan = false;
    let dibuat: string | null = null;

    setGalat(null);
    api
      .get(url, { responseType: 'blob' })
      .then((res) => {
        if (dibatalkan) return;
        dibuat = URL.createObjectURL(res.data as Blob);
        setBlobUrl(dibuat);
      })
      .catch((e) => !dibatalkan && setGalat(pesanError(e, 'Dokumen tidak dapat dibuka')));

    /* Blob URL menahan berkas di memori sampai dilepas. */
    return () => {
      dibatalkan = true;
      if (dibuat) URL.revokeObjectURL(dibuat);
      setBlobUrl(null);
    };
  }, [terbuka, url]);

  const unduh = () => {
    if (!blobUrl) return;
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = namaBerkas;
    a.click();
  };

  return (
    <Dialog.Root open={terbuka} onOpenChange={(o) => !o && onTutup()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-ink/40 animate-fade-in" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 flex h-[calc(100vh-4rem)] w-[calc(100vw-4rem)] max-w-[1100px] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-card border border-line bg-surface shadow-pop animate-pop-in">
          <div className="flex items-center justify-between gap-4 border-b border-line px-6 py-3.5">
            <Dialog.Title className="min-w-0 truncate text-card font-semibold text-ink">
              {judul}
            </Dialog.Title>
            <div className="flex shrink-0 items-center gap-2">
              <Button ukuran="kecil" onClick={unduh} disabled={!blobUrl}>
                <Download size={13} />
                Unduh
              </Button>
              <Dialog.Close
                aria-label="Tutup"
                className="rounded-control p-1.5 text-ink-subtle transition-colors hover:bg-surface-muted hover:text-ink"
              >
                <X size={16} />
              </Dialog.Close>
            </div>
          </div>

          <div className="min-h-0 flex-1 bg-surface-muted">
            {galat ? (
              <p className="flex h-full items-center justify-center px-6 text-center text-base text-st-merah-fg">
                {galat}
              </p>
            ) : blobUrl ? (
              <iframe src={blobUrl} title={judul} className="h-full w-full border-0" />
            ) : (
              <p className="flex h-full items-center justify-center text-sm text-ink-subtle">
                Memuat dokumen…
              </p>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
