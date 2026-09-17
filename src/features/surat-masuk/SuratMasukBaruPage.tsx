import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, FileText } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardBody, CardFooter, CardHeader } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { PdfPreview } from '@/components/ui/PdfPreview';
import { useToast } from '@/components/ui/Toast';
import { Skeleton } from '@/components/ui/Skeleton';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { errorField, pesanError } from '@/lib/api';
import { cn } from '@/lib/cn';
import { rupiah, tanggalPanjang, ukuranBerkas } from '@/lib/format';
import { PilihSuratKeluar } from './PilihSuratKeluar';
import { useBuatSuratMasuk } from './api';
import { FieldDinamis, nilaiAwal, skemaDari, type NilaiDinamis } from '../surat-keluar/FieldDinamis';
import { Field } from '@/components/ui/Field';
import { Input, Textarea } from '@/components/ui/Input';
import { DateInput } from '@/components/ui/DateInput';
import { FileUpload } from '@/components/ui/FileUpload';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const skema = z.object({
  nomor_surat: z.string().optional(),
  tanggal_surat: z.string().min(1, 'Tanggal surat wajib diisi'),
  perihal: z.string().min(1, 'Perihal wajib diisi'),
  pic: z.string().min(1, 'PIC wajib diisi'),
  pengirim: z.string().min(1, 'Pengirim wajib diisi'),
  keterangan: z.string().nullable().optional(),
  jenis_input: z.enum(['otomatis', 'manual']).default('manual'),
});

type Isian = z.infer<typeof skema>;

const LANGKAH = ['Pilih Jenis', 'Isi Data', 'Pratinjau'] as const;

/** Layar 03 Registrasi Surat Masuk (UC-02). */
export function SuratMasukBaruPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [berkas, setBerkas] = useState<File | null>(null);
  const [konfirmasi, setKonfirmasi] = useState<Isian | null>(null);
  const [galatBerkas, setGalatBerkas] = useState<string | undefined>();
  const [progress, setProgress] = useState<number | null>(null);
  const [galatUmum, setGalatUmum] = useState<string | null>(null);
  const [suratKeluarId, setSuratKeluarId] = useState<number | null>(null);
  const [jenisInput, setJenisInput] = useState<'otomatis' | 'manual'>('manual');

  const buat = useBuatSuratMasuk(setProgress);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<Isian>({ resolver: zodResolver(skema) });

  const kirim = handleSubmit((isian) => {
    setGalatUmum(null);
    setGalatBerkas(undefined);

    if (!berkas) {
      setGalatBerkas('Dokumen surat wajib diunggah');
      return;
    }

    if (jenisInput === 'manual' && !isian.nomor_surat?.trim()) {
      setError('nomor_surat', { message: 'Nomor surat wajib diisi saat mode manual' });
      return;
    }

    setKonfirmasi({ ...isian, jenis_input: jenisInput });
  });
  const pindah = (bagianBaru: Record<string, string | null>) => {
    const baru = new URLSearchParams(params);
    for (const [kunci, nilai] of Object.entries(bagianBaru)) {
      if (nilai === null) baru.delete(kunci);
      else baru.set(kunci, nilai);
    }
    setParams(baru);
  };

  const keLangkah = (n: number) => pindah({ langkah: String(n) });

  const lanjutDariIsian = () => {
    if (jenisInput === 'manual' && !isian.nomor_surat?.trim()) {
      setError('nomor_surat', { message: 'Nomor surat wajib diisi saat mode manual' });
      return;
    }
    setGalatField({});
    keLangkah(3);
  };

  const simpan = async (isian: Isian) => {
    if (!berkas) return;
    try {
      const hasil = await buat.mutateAsync({
        isian: { ...isian, surat_keluar_id: suratKeluarId, jenis_input: isian.jenis_input },
        berkas,
      });
      setKonfirmasi(null);
      toast.sukses(
        'Surat masuk berhasil diregistrasi',
        `Nomor agenda ${hasil.nomor_agenda} sudah diterbitkan sistem.`,
      );
      navigate(`/surat-masuk/${hasil.id}`, { replace: true });
    } catch (e) {
      setKonfirmasi(null);
      toast.galat('Surat masuk gagal disimpan', pesanError(e));
      const perField = errorField(e);
      const kunci = Object.keys(perField);
      if (kunci.length) {
        kunci.forEach((k) => {
          if (k === 'file') setGalatBerkas(perField[k]);
          else setError(k as keyof Isian, { message: perField[k] });
        });
      } else {
        setGalatUmum(pesanError(e));
      }
      setProgress(null);
    }
  };

  return (
    <>
      <form onSubmit={kirim} noValidate className="mx-auto max-w-[900px]">
      <Card>
        <CardHeader
          judul="Data Surat"
          keterangan="Nomor agenda dibuat otomatis oleh sistem saat surat disimpan."
        />

        <CardBody className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <Field label="Nomor agenda" keterangan="Dibuat otomatis oleh sistem">
            {() => (
              <Input
                value="Otomatis, mis. 0135/2026"
                readOnly
                disabled
                className="tabular"
              />
            )}
          </Field>

          <Field label="Mode nomor surat" keterangan="Pilih cara pengisian nomor surat" className="lg:col-span-2">
            {(p) => (
              <div className="flex items-center gap-6" {...p}>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="jenis_input"
                    value="otomatis"
                    checked={jenisInput === 'otomatis'}
                    onChange={() => setJenisInput('otomatis')}
                    className="w-4 h-4 accent-accent"
                  />
                  <span className="text-base text-ink">Otomatis (generate dari sistem)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="jenis_input"
                    value="manual"
                    checked={jenisInput === 'manual'}
                    onChange={() => setJenisInput('manual')}
                    className="w-4 h-4 accent-accent"
                  />
                  <span className="text-base text-ink">Manual (isi sendiri)</span>
                </label>
              </div>
            )}
          </Field>

          <Field label="Nomor surat" wajib={jenisInput === 'manual'} galat={errors.nomor_surat?.message}>
            {(p) => (
              <Input
                {...p}
                {...register('nomor_surat')}
                placeholder="Contoh: 0001/2026/DIR.01/Digitak/IX/2026"
                autoFocus
                disabled={jenisInput === 'otomatis'}
                value={jenisInput === 'otomatis' ? '' : undefined}
              />
            )}
          </Field>

          <Field label="Tanggal surat" wajib galat={errors.tanggal_surat?.message}>
            {(p) => <DateInput {...p} {...register('tanggal_surat')} />}
          </Field>

          <Field label="PIC" wajib galat={errors.pic?.message}>
            {(p) => (
              <Input {...p} {...register('pic')} placeholder="Nama penanggung jawab" />
            )}
          </Field>

          <Field
            label="Perihal"
            wajib
            galat={errors.perihal?.message}
            className="lg:col-span-2"
          >
            {(p) => (
              <Input {...p} {...register('perihal')} placeholder="Ringkasan isi surat" />
            )}
          </Field>

          <Field
            label="Pengirim"
            wajib
            galat={errors.pengirim?.message}
            className="lg:col-span-2"
          >
            {(p) => (
              <Input
                {...p}
                {...register('pengirim')}
                placeholder="Nama pihak pengirim"
              />
            )}
          </Field>

          <Field label="Keterangan" className="lg:col-span-2">
            {(p) => (
              <Textarea
                {...p}
                {...register('keterangan')}
                rows={3}
                placeholder="Informasi tambahan (opsional)"
              />
            )}
          </Field>
        </CardBody>

        <div className="border-t border-line" />

        <CardBody>
          <p className="mb-3 text-card font-semibold text-ink">Dokumen Surat</p>
          <FileUpload
            berkas={berkas}
            onPilih={(f) => {
              setBerkas(f);
              setGalatBerkas(undefined);
            }}
            progress={progress}
            galat={galatBerkas}
          />
        </CardBody>

        <div className="border-t border-line" />

        <CardBody>
          <p className="mb-1 text-card font-semibold text-ink">
            Surat Balasan <span className="font-normal text-ink-subtle">(opsional)</span>
          </p>
          <p className="mb-3 text-label text-ink-subtle">
            Diisi bila surat ini sudah memiliki balasan. Dapat juga ditautkan kemudian
            dari halaman detail.
          </p>
          <PilihSuratKeluar terpilihId={suratKeluarId} onPilih={setSuratKeluarId} />
        </CardBody>

        {galatUmum ? (
          <div className="px-6 pb-2">
            <p
              role="alert"
              className="rounded-control border border-st-merah-br bg-st-merah-bg px-3 py-2 text-label text-st-merah-fg"
            >
              {galatUmum}
            </p>
          </div>
        ) : null}

        <CardFooter>
          <Button asChild>
            <Link to="/surat-masuk">Batal</Link>
          </Button>
          <Button type="submit" ragam="utama" disabled={isSubmitting || buat.isPending}>
            {'Simpan Surat'}
          </Button>
        </CardFooter>
      </Card>
      </form>

      <ConfirmDialog
        terbuka={konfirmasi !== null}
        onTutup={() => setKonfirmasi(null)}
        onSetuju={() => konfirmasi && simpan(konfirmasi)}
        sedangProses={buat.isPending}
        judul="Simpan surat masuk ini?"
        labelSetuju="Ya, Simpan Surat"
        labelBatal="Periksa Lagi"
        keterangan={
          <>
            Periksa kembali rincian di bawah. Nomor agenda diterbitkan sistem saat surat
            tersimpan dan tidak dapat diubah setelahnya.
          </>
        }
        rincian={
          konfirmasi
            ? [
                { label: 'Mode', nilai: konfirmasi.jenis_input === 'otomatis' ? 'Otomatis' : 'Manual', tabular: true },
                { label: 'Nomor surat', nilai: konfirmasi.nomor_surat, tabular: true },
                {
                  label: 'Tanggal surat',
                  nilai: tanggalPanjang(konfirmasi.tanggal_surat),
                  tabular: true,
                },
                { label: 'Pengirim', nilai: konfirmasi.pengirim },
                { label: 'Perihal', nilai: konfirmasi.perihal },
                { label: 'PIC', nilai: konfirmasi.pic },
                {
                  label: 'Dokumen',
                  nilai: berkas ? `${berkas.name} · ${ukuranBerkas(berkas.size)}` : null,
                },
                {
                  label: 'Surat balasan',
                  nilai: suratKeluarId ? 'Ditautkan' : 'Belum ditautkan',
                  tabular: true,
                },
              ]
            : undefined
        }
      />
    </>
  );
}

function Kosong(): Isian {
  return {
    nomor_surat: '',
    tanggal_surat: '',
    perihal: '',
    pic: '',
    pengirim: '',
    keterangan: null,
    jenis_input: 'manual',
  };
}