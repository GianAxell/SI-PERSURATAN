import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { Input, Textarea } from '@/components/ui/Input';
import { DateInput } from '@/components/ui/DateInput';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/cn';
import { pesanError } from '@/lib/api';
import { tanggalPanjang } from '@/lib/format';
import type { PegawaiRef, SuratMasukDetail } from '@/types';
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
  const toast = useToast();
  const [cari, setCari] = useState('');
  const [konfirmasi, setKonfirmasi] = useState(false);
  /* Yang disimpan objeknya, bukan id-nya saja: daftar pegawai menyusut saat
     kotak pencarian diketik, dan yang sudah terpilih bisa keluar dari daftar
     sehingga namanya tidak lagi bisa dicari balik untuk dialog konfirmasi. */
  const [penerima, setPenerima] = useState<PegawaiRef | null>(null);
  const [instruksi, setInstruksi] = useState('');
  const [batasWaktu, setBatasWaktu] = useState('');
  const [galat, setGalat] = useState<string | null>(null);

  const { data: pegawai, isPending } = usePegawaiPenerima(cari);
  const buat = useBuatDisposisi(surat.id);

  useEffect(() => {
    if (terbuka) return;
    setCari('');
    setPenerima(null);
    setInstruksi('');
    setBatasWaktu('');
    setGalat(null);
    setKonfirmasi(false);
  }, [terbuka]);

  /* Disposisi yang terkirim langsung muncul di layar pegawai dan tidak bisa
     ditarik kembali (O-3: pembatalan tidak ada di v1), jadi dikonfirmasi. */
  const periksa = () => {
    setGalat(null);
    if (!penerima) return setGalat('Pilih pegawai penerima terlebih dahulu');
    if (!instruksi.trim()) return setGalat('Instruksi wajib diisi');
    setKonfirmasi(true);
  };

  const simpan = async () => {
    if (!penerima) return;
    try {
      await buat.mutateAsync({
        pegawai_id: penerima.id,
        instruksi: instruksi.trim(),
        batas_waktu: batasWaktu || null,
      });
      await queryClient.invalidateQueries({
        queryKey: ['surat-masuk', 'detail', String(surat.id)],
      });
      setKonfirmasi(false);
      toast.sukses(
        'Disposisi berhasil dikirim',
        `${penerima.nama} akan menerima pemberitahuan surat ${surat.nomor_agenda}.`,
      );
      onTutup();
    } catch (e) {
      setKonfirmasi(false);
      setGalat(pesanError(e));
      toast.galat('Disposisi gagal dikirim', pesanError(e));
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
          <Button ragam="utama" onClick={periksa} disabled={buat.isPending}>
            Kirim Disposisi
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
                  onClick={() => setPenerima(p)}
                  className={cn(
                    'flex w-full items-center justify-between gap-3 border-b border-line px-4 py-2.5',
                    'text-left text-base last:border-b-0 transition-colors',
                    p.id === penerima?.id
                      ? 'bg-surface-muted font-medium text-ink'
                      : 'text-ink hover:bg-surface-muted',
                  )}
                >
                  <span className="truncate">{p.nama}</span>
                  {p.id === penerima?.id ? (
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

      <ConfirmDialog
        terbuka={konfirmasi}
        onTutup={() => setKonfirmasi(false)}
        onSetuju={simpan}
        sedangProses={buat.isPending}
        judul="Kirim disposisi ini?"
        labelSetuju="Ya, Kirim Disposisi"
        labelBatal="Periksa Lagi"
        keterangan={
          <>
            Pegawai yang dituju akan langsung melihat disposisi ini beserta
            pemberitahuannya. Disposisi yang sudah dikirim tidak dapat ditarik kembali.
          </>
        }
        rincian={[
          { label: 'Surat', nilai: `${surat.nomor_agenda} — ${surat.perihal}`, tabular: false },
          { label: 'Penerima', nilai: penerima?.nama },
          {
            label: 'Batas waktu',
            nilai: batasWaktu ? tanggalPanjang(batasWaktu) : 'Tanpa batas waktu',
            tabular: Boolean(batasWaktu),
          },
          { label: 'Instruksi', nilai: instruksi.trim() },
        ]}
      />
    </Modal>
  );
}
