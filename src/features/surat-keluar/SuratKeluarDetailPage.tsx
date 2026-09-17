import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowRight, ChevronLeft, Download, FileText } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { PdfPreview } from '@/components/ui/PdfPreview';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ambilToken } from '@/lib/api';
import { rupiah, tanggalPanjang, waktuPanjang } from '@/lib/format';
import { useSuratMasukDetail } from '@/features/surat-masuk/api';
import { useTemplate } from '@/features/master/api';
import { useSuratKeluarDetail } from './api';

/** Layar 11 Detail Surat Keluar. */
export function SuratKeluarDetailPage() {
  const { id } = useParams();
  const { data: surat, isPending, isError } = useSuratKeluarDetail(id);
  const { data: template } = useTemplate(surat?.template.id ?? null);
  const { data: suratMasuk } = useSuratMasukDetail(
    surat?.membalas_surat_masuk ? String(surat.membalas_surat_masuk.id) : undefined,
  );
  const [pratinjau, setPratinjau] = useState(false);

  if (isPending) return <KerangkaDetail />;

  if (isError || !surat) {
    return (
      <Card>
        <EmptyState
          judul="Surat keluar tidak ditemukan"
          keterangan="Surat mungkin sudah dihapus, atau tautannya salah."
          aksi={
            <Button asChild>
              <Link to="/surat-keluar">Kembali ke daftar</Link>
            </Button>
          }
        />
      </Card>
    );
  }

  const namaBerkas = `${surat.nomor_surat.replace(/\//g, '-')}.pdf`;

  /* Field tetap sudah tampil di kartu atas, jadi tidak diulang di bawah. */
  const fieldTambahan = (template?.fields ?? [])
    .filter((f) => !['kepada', 'perihal', 'tanggal', 'pic'].includes(f.field_key))
    .sort((a, b) => a.urutan - b.urutan);

  return (
    <>
      <Link
        to="/surat-keluar"
        className="mb-4 inline-flex items-center gap-1 text-label text-ink-muted transition-colors hover:text-ink"
      >
        <ChevronLeft size={14} />
        Kembali ke daftar
      </Link>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex flex-col gap-6">
          <Card>
            <CardBody>
              <p className="tabular text-page font-semibold text-ink">{surat.nomor_surat}</p>
              <p className="mt-1 text-card text-ink">{surat.perihal}</p>

              <dl className="mt-6 grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
                <Baris label="Tanggal surat" nilai={tanggalPanjang(surat.tanggal_surat)} />
                <Baris label="Nomor urut" nilai={String(surat.nomor_urut)} tabular />
                <Baris label="Kepada" nilai={surat.kepada} className="sm:col-span-2" />
                <Baris label="PIC" nilai={surat.pic} />
                <Baris
                  label="Bagian"
                  nilai={`${surat.bagian.kode} — ${surat.bagian.nama}`}
                />
                <Baris
                  label="Jenis surat"
                  nilai={`${surat.jenis_surat.kode} — ${surat.jenis_surat.nama}`}
                />
                <Baris label="Template" nilai={surat.template.nama} />
                <Baris
                  label="Membalas surat masuk"
                  className="sm:col-span-2"
                  nilai={
                    surat.membalas_surat_masuk ? (
                      <Link
                        to={`/surat-masuk/${surat.membalas_surat_masuk.id}`}
                        className="text-accent underline underline-offset-2"
                      >
                        <span className="tabular">
                          {surat.membalas_surat_masuk.nomor_agenda}
                        </span>{' '}
                        — {surat.membalas_surat_masuk.perihal}
                      </Link>
                    ) : null
                  }
                />
              </dl>
            </CardBody>
          </Card>

          {fieldTambahan.length > 0 ? (
            <Card>
              <CardHeader
                judul="Isi surat"
                keterangan="Kolom di bawah datang dari template, jadi tiap jenis surat menampilkan isinya sendiri."
              />
              <CardBody>
                <dl className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
                  {fieldTambahan.map((f) => {
                    const nilai = surat.data_dinamis[f.field_key];
                    return (
                      <Baris
                        key={f.field_key}
                        label={f.label}
                        className={f.tipe === 'textarea' ? 'sm:col-span-2' : undefined}
                        nilai={
                          nilai === null || nilai === undefined || nilai === ''
                            ? null
                            : f.tipe === 'number'
                              ? rupiah(Number(nilai))
                              : String(nilai)
                        }
                      />
                    );
                  })}
                </dl>
              </CardBody>
            </Card>
          ) : null}
        </div>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader judul="Dokumen" />
            <CardBody className="flex flex-col gap-3">
              <div className="flex items-center gap-3 rounded-control border border-line px-3 py-2.5">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-control bg-surface-muted text-ink-muted">
                  <FileText size={16} />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-base text-ink">{namaBerkas}</p>
                  <p className="text-note text-ink-subtle">PDF · dihasilkan sistem</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button penuh onClick={() => setPratinjau(true)}>
                  Pratinjau
                </Button>
                <Button
                  penuh
                  asChild
                  title="Berkas terproteksi — unduhan memakai sesi yang sedang aktif"
                >
                  <a
                    href={`/api/surat-keluar/${surat.id}/file?token=${ambilToken() ?? ''}`}
                    download={namaBerkas}
                  >
                    <Download size={15} />
                    Unduh
                  </a>
                </Button>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader judul="Catatan" />
            <CardBody className="flex flex-col gap-4">
              <Baris label="Dibuat pada" nilai={waktuPanjang(surat.dibuat_pada)} />
              <Baris label="Tahun penomoran" nilai={String(surat.tahun)} tabular />
              <p className="text-note leading-relaxed text-ink-subtle">
                Nomor surat tidak dapat diubah setelah terbit. Bila ada kekeliruan isi,
                terbitkan surat baru dan tandai surat lama sebagai tidak berlaku pada
                catatan internal.
              </p>
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              judul="Disposisi"
              keterangan={
                surat.membalas_surat_masuk
                  ? `Dari surat masuk ${surat.membalas_surat_masuk.nomor_agenda}`
                  : 'Surat ini bukan balasan surat masuk.'
              }
            />
            <CardBody className="flex flex-col gap-3">
              {surat.membalas_surat_masuk ? (
                suratMasuk ? (
                  suratMasuk.disposisi.length > 0 ? (
                    <>
                      {suratMasuk.disposisi.map((d) => (
                        <div
                          key={d.id}
                          className="rounded-control border border-line px-3 py-2.5"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-base font-medium text-ink">
                              {d.penerima.nama}
                            </span>
                            <StatusBadge status={d.status} terlambat={d.terlambat} />
                          </div>
                          <p className="mt-1 line-clamp-2 text-label leading-snug text-ink-muted">
                            {d.instruksi}
                          </p>
                          {d.batas_waktu ? (
                            <p className="mt-1 text-note text-ink-subtle">
                              Batas: {tanggalPanjang(d.batas_waktu)}
                            </p>
                          ) : null}
                        </div>
                      ))}

                      <Button asChild penuh>
                        <Link to="/disposisi">
                          Lihat Disposisi
                          <ArrowRight size={15} />
                        </Link>
                      </Button>
                    </>
                  ) : (
                    <p className="text-label text-ink-subtle">
                      Belum ada disposisi pada surat masuk ini.
                    </p>
                  )
                ) : (
                  <div className="flex flex-col gap-2">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                  </div>
                )
              ) : (
                <>
                  <p className="text-label leading-relaxed text-ink-muted">
                    Disposisi dibuat pada surat masuk yang dibalas. Surat keluar ini tidak
                    membalas surat masuk mana pun, jadi tidak ada disposisi yang bisa
                    ditampilkan di sini.
                  </p>
                  <Button asChild penuh>
                    <Link to="/disposisi">
                      Lihat Disposisi
                      <ArrowRight size={15} />
                    </Link>
                  </Button>
                </>
              )}
            </CardBody>
          </Card>
        </div>
      </div>

      <PdfPreview
        terbuka={pratinjau}
        onTutup={() => setPratinjau(false)}
        url={`/surat-keluar/${surat.id}/file`}
        judul={surat.nomor_surat}
        namaBerkas={namaBerkas}
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
      <dt className="text-label font-medium text-ink-subtle">{label}</dt>
      <dd
        className={
          tabular
            ? 'tabular mt-1 text-base text-ink'
            : 'mt-1 whitespace-pre-line text-base text-ink'
        }
      >
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
          <Skeleton className="h-7 w-72" />
          <Skeleton className="h-5 w-96" />
          <div className="mt-4 grid grid-cols-2 gap-5">
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardBody>
      </Card>
      <Card>
        <CardBody className="flex flex-col gap-3">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardBody>
      </Card>
    </div>
  );
}
