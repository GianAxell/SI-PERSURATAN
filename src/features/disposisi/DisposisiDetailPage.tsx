import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ChevronLeft, Download, FileText } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Field } from '@/components/ui/Field';
import { PdfPreview } from '@/components/ui/PdfPreview';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Textarea } from '@/components/ui/Input';
import { Timeline } from '@/components/ui/Timeline';
import { pesanError } from '@/lib/api';
import { tanggalPanjang } from '@/lib/format';
import { STATUS_DISPOSISI } from '@/lib/status';
import type { StatusDisposisi } from '@/types';
import {
  useDisposisiDetail,
  useRiwayatDisposisi,
  useTandaiDibaca,
  useUbahStatusDisposisi,
} from './api';

/** Layar 18 Pegawai Detail Disposisi (UC-06, UC-07). */
export function DisposisiDetailPage() {
  const { id } = useParams();
  const { data: d, isPending, isError } = useDisposisiDetail(id);
  const { data: riwayat } = useRiwayatDisposisi(id);
  const tandaiDibaca = useTandaiDibaca();

  const [pratinjau, setPratinjau] = useState(false);

  /*
    Transisi Belum Dibaca → Diproses (UC-06 langkah 4). Ini efek samping yang
    disengaja dari membuka halaman, jadi dikirim sebagai PATCH tersendiri —
    bukan diselipkan ke dalam GET, yang akan melanggar sifat REST dan terpicu
    dua kali oleh React StrictMode.
  */
  const belumDibaca = d?.status === 'belum_dibaca';
  useEffect(() => {
    if (!d || !belumDibaca) return;
    tandaiDibaca.mutate(d.id);
    // hanya bergantung pada id dan status; mutate stabil dari TanStack Query
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [d?.id, belumDibaca]);

  if (isPending) return <Kerangka />;

  if (isError || !d) {
    return (
      <Card>
        <EmptyState
          judul="Disposisi tidak ditemukan"
          keterangan="Disposisi ini mungkin bukan ditujukan kepada Anda."
          aksi={
            <Button asChild>
              <Link to="/disposisi-saya">Kembali</Link>
            </Button>
          }
        />
      </Card>
    );
  }

  return (
    <>
      <Link
        to="/disposisi-saya"
        className="mb-4 inline-flex items-center gap-1 text-label text-ink-muted transition-colors hover:text-ink"
      >
        <ChevronLeft size={14} />
        Kembali
      </Link>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex flex-col gap-6">
          <Card>
            <CardBody>
              <StatusBadge status={d.status} terlambat={d.terlambat} />
              <p className="mt-3 text-page font-semibold text-ink">{d.surat.perihal}</p>
              <p className="mt-1 text-base text-ink-muted">
                Surat <span className="tabular">{d.surat.nomor_agenda}</span> dari{' '}
                {d.surat.pengirim}
              </p>

              <div className="mt-6">
                <p className="text-label font-medium text-ink-muted">Instruksi dari Admin</p>
                <p className="mt-1.5 rounded-control bg-surface-muted px-4 py-3 text-base leading-relaxed text-ink">
                  {d.instruksi}
                </p>
              </div>

              <dl className="mt-6 grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-3">
                <Baris label="Pemberi disposisi" nilai={d.pemberi.nama} />
                <Baris label="Tanggal disposisi" nilai={tanggalPanjang(d.dibuat_pada)} />
                <Baris
                  label="Batas waktu"
                  nilai={d.batas_waktu ? tanggalPanjang(d.batas_waktu) : '—'}
                />
              </dl>
            </CardBody>
          </Card>

          <FormulirTindakLanjut
            id={d.id}
            status={d.status}
            hasilAwal={d.hasil_tindak_lanjut ?? ''}
          />

          <Card>
            <CardHeader judul="Riwayat disposisi ini" />
            <CardBody>
              <Timeline riwayat={riwayat ?? []} />
            </CardBody>
          </Card>
        </div>

        <Card className="h-fit">
          <CardHeader judul="Dokumen surat" />
          <CardBody>
            {d.surat.berkas ? (
              <>
                <div className="flex items-center gap-3 rounded-control border border-line px-4 py-3">
                  <FileText size={18} className="shrink-0 text-ink-subtle" />
                  <p className="truncate text-base text-ink">{d.surat.berkas.nama}</p>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <Button ragam="utama" ukuran="kecil" onClick={() => setPratinjau(true)}>
                    Pratinjau PDF
                  </Button>
                  <Button ukuran="kecil" asChild>
                    <a href={`/api/surat-masuk/${d.surat.id}/file`} download>
                      <Download size={13} />
                      Unduh
                    </a>
                  </Button>
                </div>
              </>
            ) : (
              <p className="text-sm text-ink-subtle">Tidak ada dokumen terlampir.</p>
            )}
          </CardBody>
        </Card>
      </div>

      {d.surat.berkas ? (
        <PdfPreview
          terbuka={pratinjau}
          onTutup={() => setPratinjau(false)}
          url={`/surat-masuk/${d.surat.id}/file`}
          judul={`${d.surat.nomor_agenda} — ${d.surat.perihal}`}
          namaBerkas={d.surat.berkas.nama}
        />
      ) : null}
    </>
  );
}

/**
 * Alur status hanya maju: Belum Dibaca → Diproses → Selesai (B-5). Karena itu
 * pilihan yang ditawarkan hanya status di depan status sekarang; mundur
 * memang ditolak server, jadi tidak perlu ditawarkan lalu digagalkan.
 */
function FormulirTindakLanjut({
  id,
  status,
  hasilAwal,
}: {
  id: number;
  status: StatusDisposisi;
  hasilAwal: string;
}) {
  const [hasil, setHasil] = useState(hasilAwal);
  const [statusBaru, setStatusBaru] = useState<StatusDisposisi>('selesai');
  const [galat, setGalat] = useState<string | null>(null);
  const [tersimpan, setTersimpan] = useState(false);
  const ubah = useUbahStatusDisposisi(id);

  useEffect(() => setHasil(hasilAwal), [hasilAwal]);

  if (status === 'selesai') {
    return (
      <Card>
        <CardHeader judul="Tindak lanjut" />
        <CardBody>
          <p className="text-base leading-relaxed text-ink">
            {hasilAwal || (
              <span className="text-ink-subtle">
                Disposisi ditandai selesai tanpa catatan tindak lanjut.
              </span>
            )}
          </p>
        </CardBody>
      </Card>
    );
  }

  const simpan = async () => {
    setGalat(null);
    try {
      await ubah.mutateAsync({
        status: statusBaru,
        hasil_tindak_lanjut: hasil.trim() || undefined,
      });
      setTersimpan(true);
      setTimeout(() => setTersimpan(false), 2500);
    } catch (e) {
      setGalat(pesanError(e));
    }
  };

  return (
    <Card>
      <CardHeader
        judul="Selesaikan Disposisi"
        keterangan="Alur status: Belum Dibaca, Diproses, lalu Selesai."
      />
      <CardBody className="flex flex-col gap-5">
        <Field label="Hasil atau tindak lanjut" keterangan="Boleh dikosongkan">
          {(p) => (
            <Textarea
              {...p}
              value={hasil}
              onChange={(e) => setHasil(e.target.value)}
              rows={4}
              placeholder="Tuliskan hasil tindak lanjut"
            />
          )}
        </Field>

        <Field label="Ubah status menjadi" className="max-w-[260px]">
          {(p) => (
            <Select
              id={p.id}
              nilai={statusBaru}
              onUbah={(v) => setStatusBaru(v as StatusDisposisi)}
              opsi={(status === 'belum_dibaca'
                ? (['diproses', 'selesai'] as StatusDisposisi[])
                : (['selesai'] as StatusDisposisi[])
              ).map((s) => ({ nilai: s, label: STATUS_DISPOSISI[s].label }))}
            />
          )}
        </Field>

        {galat ? (
          <p
            role="alert"
            className="rounded-control border border-st-merah-br bg-st-merah-bg px-3 py-2 text-label text-st-merah-fg"
          >
            {galat}
          </p>
        ) : null}

        {tersimpan ? (
          <p className="rounded-control border border-st-hijau-br bg-st-hijau-bg px-3 py-2 text-label text-st-hijau-fg">
            Perubahan tersimpan.
          </p>
        ) : null}

        <div className="flex justify-end">
          <Button ragam="utama" ukuran="form" onClick={simpan} disabled={ubah.isPending}>
            {ubah.isPending ? 'Menyimpan…' : 'Simpan Perubahan'}
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}

function Baris({ label, nilai }: { label: string; nilai: React.ReactNode }) {
  return (
    <div>
      <dt className="text-label font-medium text-ink-muted">{label}</dt>
      <dd className="mt-1 text-base text-ink">{nilai}</dd>
    </div>
  );
}

function Kerangka() {
  return (
    <Card>
      <CardBody className="flex flex-col gap-4">
        <Skeleton className="h-5 w-28" />
        <Skeleton className="h-4 w-80" />
        <Skeleton className="mt-4 h-20 w-full" />
      </CardBody>
    </Card>
  );
}
