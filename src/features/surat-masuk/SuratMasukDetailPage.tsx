import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ChevronLeft, Download, FileText, Link2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { PdfPreview } from '@/components/ui/PdfPreview';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { tanggalPanjang, ukuranBerkas } from '@/lib/format';
import { ambilToken } from '@/lib/api';
import { BuatDisposisiModal } from './BuatDisposisiModal';
import { TandaiBalasanModal } from './TandaiBalasanModal';
import { useSuratMasukDetail } from './api';

/** Layar 04 Detail Surat Masuk (UC-03). */
export function SuratMasukDetailPage() {
  const { id } = useParams();
  const { data: surat, isPending, isError } = useSuratMasukDetail(id);

  const [pratinjau, setPratinjau] = useState(false);
  const [disposisiBaru, setDisposisiBaru] = useState(false);
  const [tautkan, setTautkan] = useState(false);

  if (isPending) return <KerangkaDetail />;

  if (isError || !surat) {
    return (
      <Card>
        <EmptyState
          judul="Surat tidak ditemukan"
          keterangan="Surat mungkin sudah dihapus, atau tautannya salah."
          aksi={
            <Button asChild>
              <Link to="/surat-masuk">Kembali ke daftar</Link>
            </Button>
          }
        />
      </Card>
    );
  }

  return (
    <>
      <Link
        to="/surat-masuk"
        className="mb-4 inline-flex items-center gap-1 text-label text-ink-muted transition-colors hover:text-ink"
      >
        <ChevronLeft size={14} />
        Kembali ke daftar
      </Link>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex flex-col gap-6">
          <Card>
            <CardBody>
              <div className="flex flex-wrap items-center gap-3">
                <span className="tabular text-page font-semibold text-ink">
                  {surat.nomor_agenda}
                </span>
                <StatusBadge
                  status={surat.status_disposisi}
                  terlambat={surat.disposisi.some((d) => d.terlambat)}
                />
              </div>
              <p className="mt-1 text-card text-ink">{surat.perihal}</p>

              <dl className="mt-6 grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
                <Baris label="Nomor surat" nilai={surat.nomor_surat} tabular />
                <Baris label="Tanggal surat" nilai={tanggalPanjang(surat.tanggal_surat)} />
                <Baris label="Pengirim" nilai={surat.pengirim} />
                <Baris label="PIC" nilai={surat.pic} />
                <Baris
                  label="Keterangan"
                  nilai={surat.keterangan}
                  className="sm:col-span-2"
                />
                <Baris
                  label="Surat balasan"
                  className="sm:col-span-2"
                  nilai={
                    surat.surat_balasan ? (
                      <Link
                        to={`/surat-keluar/${surat.surat_balasan.id}`}
                        className="tabular text-ink underline decoration-line underline-offset-4 hover:decoration-ink"
                      >
                        {surat.surat_balasan.nomor_surat}
                      </Link>
                    ) : (
                      <Button ukuran="kecil" onClick={() => setTautkan(true)}>
                        <Link2 size={13} />
                        Tandai Surat Balasan
                      </Button>
                    )
                  }
                />
              </dl>
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              judul="Disposisi"
              keterangan="Satu disposisi ditujukan kepada satu pegawai."
              aksi={
                <Button ragam="utama" ukuran="kecil" onClick={() => setDisposisiBaru(true)}>
                  <Plus size={13} />
                  Disposisi
                </Button>
              }
            />

            {surat.disposisi.length === 0 ? (
              <EmptyState
                judul="Belum ada disposisi"
                keterangan="Surat ini belum diteruskan kepada pegawai mana pun."
                aksi={
                  <Button ragam="utama" ukuran="kecil" onClick={() => setDisposisiBaru(true)}>
                    <Plus size={13} />
                    Buat Disposisi
                  </Button>
                }
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] border-collapse text-base">
                  <thead>
                    <tr className="h-11 bg-surface-muted">
                      <th className="px-6 text-left text-label font-medium text-ink-muted">
                        Penerima
                      </th>
                      <th className="px-6 text-left text-label font-medium text-ink-muted">
                        Instruksi
                      </th>
                      <th className="w-[130px] px-6 text-left text-label font-medium text-ink-muted">
                        Batas waktu
                      </th>
                      <th className="w-[200px] px-6 text-left text-label font-medium text-ink-muted">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {surat.disposisi.map((d) => (
                      <tr key={d.id} className="border-t border-line align-top">
                        <td className="whitespace-nowrap px-6 py-3.5">
                          {d.penerima.nama}
                        </td>
                        <td className="px-6 py-3.5 text-ink-muted">
                          <span className="line-clamp-2 leading-snug">{d.instruksi}</span>
                        </td>
                        <td className="tabular whitespace-nowrap px-6 py-3.5 text-ink-muted">
                          {d.batas_waktu ? tanggalPanjang(d.batas_waktu) : '—'}
                        </td>
                        <td className="px-6 py-3.5">
                          <StatusBadge status={d.status} terlambat={d.terlambat} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

        <Card className="h-fit">
          <CardHeader judul="Dokumen Surat" />
          <CardBody>
            {surat.berkas ? (
              <>
                <div className="flex items-center gap-3 rounded-control border border-line px-4 py-3">
                  <FileText size={18} className="shrink-0 text-ink-subtle" />
                  <div className="min-w-0">
                    <p className="truncate text-base text-ink">{surat.berkas.nama}</p>
                    <p className="text-note text-ink-subtle">
                      {ukuranBerkas(surat.berkas.ukuran)}
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <Button ragam="utama" ukuran="kecil" onClick={() => setPratinjau(true)}>
                    Pratinjau PDF
                  </Button>
                  <Button ukuran="kecil" asChild>
                    <a href={`/api/surat-masuk/${surat.id}/file?token=${ambilToken() ?? ''}`} download>
                      <Download size={13} />
                      Unduh
                    </a>
                  </Button>
                </div>
              </>
            ) : (
              <p className="text-sm text-ink-subtle">Tidak ada dokumen terlampir.</p>
            )}

            <div className="mt-6 border-t border-line pt-4 text-label text-ink-subtle">
              <p>Diregistrasi oleh {surat.dibuat_oleh.nama}</p>
              <p className="mt-0.5">{tanggalPanjang(surat.dibuat_pada)}</p>
            </div>
          </CardBody>
        </Card>
      </div>

      {surat.berkas ? (
        <PdfPreview
          terbuka={pratinjau}
          onTutup={() => setPratinjau(false)}
          url={`/surat-masuk/${surat.id}/file`}
          judul={`${surat.nomor_agenda} — ${surat.perihal}`}
          namaBerkas={surat.berkas.nama}
        />
      ) : null}

      <BuatDisposisiModal
        terbuka={disposisiBaru}
        onTutup={() => setDisposisiBaru(false)}
        surat={surat}
      />

      <TandaiBalasanModal
        terbuka={tautkan}
        onTutup={() => setTautkan(false)}
        suratId={surat.id}
        nomorAgenda={surat.nomor_agenda}
      />
    </>
  );
}

function Baris({
  label,
  nilai,
  tabular,
  className,
}: {
  label: string;
  nilai: React.ReactNode;
  tabular?: boolean;
  className?: string;
}) {
  return (
    <div className={className}>
      <dt className="text-label font-medium text-ink-muted">{label}</dt>
      <dd className={`mt-1 text-base text-ink ${tabular ? 'tabular' : ''}`}>
        {nilai || <span className="text-ink-subtle">—</span>}
      </dd>
    </div>
  );
}

function KerangkaDetail() {
  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
      <Card>
        <CardBody className="flex flex-col gap-4">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-72" />
          <div className="mt-4 grid grid-cols-2 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-2">
                <Skeleton className="h-2.5 w-20" />
                <Skeleton className="h-3 w-40" />
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
      <Card className="h-fit">
        <CardBody className="flex flex-col gap-3">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-8 w-2/3" />
        </CardBody>
      </Card>
    </div>
  );
}
