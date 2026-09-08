import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { pesanError } from '@/lib/api';
import { PilihSuratKeluar } from './PilihSuratKeluar';
import { useTautkanBalasan } from './api';

/** Layar 12 Tandai Surat Balasan (UC-12). */
export function TandaiBalasanModal({
  terbuka,
  onTutup,
  suratId,
  nomorAgenda,
}: {
  terbuka: boolean;
  onTutup: () => void;
  suratId: number;
  nomorAgenda: string;
}) {
  const queryClient = useQueryClient();
  const [pilihan, setPilihan] = useState<number | null>(null);
  const [galat, setGalat] = useState<string | null>(null);
  const tautkan = useTautkanBalasan(suratId);

  useEffect(() => {
    if (terbuka) return;
    setPilihan(null);
    setGalat(null);
  }, [terbuka]);

  const simpan = async () => {
    if (!pilihan) return setGalat('Pilih surat keluar terlebih dahulu');
    setGalat(null);
    try {
      await tautkan.mutateAsync(pilihan);
      await queryClient.invalidateQueries({
        queryKey: ['surat-masuk', 'detail', String(suratId)],
      });
      onTutup();
    } catch (e) {
      /* 409 berarti surat keluar itu sudah menjadi balasan surat lain (B-9). */
      setGalat(pesanError(e));
    }
  };

  return (
    <Modal
      terbuka={terbuka}
      onTutup={onTutup}
      judul="Tandai Surat Balasan"
      keterangan={`Menautkan surat keluar sebagai balasan atas surat masuk ${nomorAgenda}`}
      footer={
        <>
          <Button onClick={onTutup}>Batal</Button>
          <Button ragam="utama" onClick={simpan} disabled={tautkan.isPending}>
            {tautkan.isPending ? 'Menautkan…' : 'Tautkan'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <PilihSuratKeluar terpilihId={pilihan} onPilih={setPilihan} />

        <p className="text-note text-ink-subtle">
          Satu surat keluar hanya dapat menjadi balasan untuk satu surat masuk, jadi
          daftar di atas tidak memuat surat yang sudah tertaut.
        </p>

        {galat ? (
          <p
            role="alert"
            className="rounded-control border border-st-merah-br bg-st-merah-bg px-3 py-2 text-label text-st-merah-fg"
          >
            {galat}
          </p>
        ) : null}
      </div>
    </Modal>
  );
}
