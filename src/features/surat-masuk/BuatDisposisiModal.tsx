import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { Input, Textarea } from '@/components/ui/Input';
import { DateInput } from '@/components/ui/DateInput';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { cn } from '@/lib/cn';
import { pesanError } from '@/lib/api';
import type { SuratMasukDetail } from '@/types';
import { useBuatDisposisi, usePegawaiPenerima } from './api';

/**
 * Layar 05 Buat Disposisi.
 *
 * Satu disposisi hanya punya satu penerima (K-2). Untuk meneruskan surat ke
 * beberapa pegawai, dibuat beberapa disposisi terpisah — itu sebabnya daftar
 * di sini memakai pilihan tunggal, bukan kotak centang.
 */
export function BuatDisposisiModal({
  terbuka,
  onTutup,
  surat,
}: {
  terbuka: boolean;
  onTutup: () => void;
  surat: SuratMasukDetail;
}) {
  const queryClient = useQueryClient();
  const [cari, setCari] = useState('');
  const [pegawaiId, setPegawaiId] = useState<number | null>(null);
  const [instruksi, setInstruksi] = useState('');
  const [batasWaktu, setBatasWaktu] = useState('');
  const [galat, setGalat] = useState<string | null>(null);

  const { data: pegawai, isPending } = usePegawaiPenerima(cari);
  const buat = useBuatDisposisi(surat.id);

  useEffect(() => {
    if (terbuka) return;
    setCari('');
    setPegawaiId(null);
    setInstruksi('');
    setBatasWaktu('');
    setGalat(null);
  }, [terbuka]);

  const simpan = async () => {
    setGalat(null);
    if (!pegawaiId) return setGalat('Pilih pegawai penerima terlebih dahulu');
    if (!instruksi.trim()) return setGalat('Instruksi wajib diisi');

    try {
      await buat.mutateAsync({
        pegawai_id: pegawaiId,
        instruksi: instruksi.trim(),
        batas_waktu: batasWaktu || null,
      });
      await queryClient.invalidateQueries({
        queryKey: ['surat-masuk', 'detail', String(surat.id)],
      });
      onTutup();
    } catch (e) {
      setGalat(pesanError(e));
    }
  };

  return (
    <Modal
      terbuka={terbuka}
      onTutup={onTutup}
      judul="Buat Disposisi"
      keterangan={`Surat ${surat.nomor_agenda} — ${surat.perihal}`}
      footer={
        <>
          <Button onClick={onTutup}>Batal</Button>
          <Button ragam="utama" onClick={simpan} disabled={buat.isPending}>
            {buat.isPending ? 'Menyimpan…' : 'Simpan'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        <div>
          <p className="mb-1.5 text-label font-medium text-ink-muted">
            Pegawai penerima <span className="text-st-merah-fg">*</span>
          </p>
          <Input
            value={cari}
            onChange={(e) => setCari(e.target.value)}
            placeholder="Cari nama pegawai"
            ikonKiri={<Search size={15} />}
          />

          <div className="mt-2 max-h-[220px] overflow-y-auto rounded-control border border-line">
            {isPending ? (
              <div className="flex flex-col gap-2 p-3">
                <Skeleton className="h-3 w-2/3" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ) : !pegawai?.length ? (
              <p className="px-4 py-6 text-center text-sm text-ink-subtle">
                Tidak ada pegawai yang cocok
              </p>
            ) : (
              pegawai.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPegawaiId(p.id)}
                  className={cn(
                    'flex w-full items-center justify-between gap-3 border-b border-line px-4 py-2.5',
                    'text-left text-base last:border-b-0 transition-colors',
                    p.id === pegawaiId
                      ? 'bg-surface-muted font-medium text-ink'
                      : 'text-ink hover:bg-surface-muted',
                  )}
                >
                  <span className="truncate">{p.nama}</span>
                  {p.id === pegawaiId ? (
                    <span className="shrink-0 text-label text-accent">Dipilih</span>
                  ) : null}
                </button>
              ))
            )}
          </div>

          <p className="mt-1.5 text-note text-ink-subtle">
            Satu disposisi hanya memiliki satu penerima. Untuk beberapa pegawai, buat
            disposisi terpisah.
          </p>
        </div>

        <Field label="Instruksi" wajib>
          {(p) => (
            <Textarea
              {...p}
              value={instruksi}
              onChange={(e) => setInstruksi(e.target.value)}
              rows={4}
              placeholder="Tuliskan instruksi yang harus dilakukan pegawai"
            />
          )}
        </Field>

        <Field label="Batas waktu penyelesaian" keterangan="Boleh dikosongkan">
          {(p) => (
            <DateInput
              {...p}
              value={batasWaktu}
              onChange={(e) => setBatasWaktu(e.target.value)}
            />
          )}
        </Field>

        <p className="rounded-control bg-surface-muted px-3 py-2 text-label text-ink-muted">
          Status awal disposisi: <span className="font-medium">Belum Dibaca</span>
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
