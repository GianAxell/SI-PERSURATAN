import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Card, CardBody, CardFooter, CardHeader } from '@/components/ui/Card';
import { Field } from '@/components/ui/Field';
import { FileUpload } from '@/components/ui/FileUpload';
import { Input, Textarea } from '@/components/ui/Input';
import { DateInput } from '@/components/ui/DateInput';
import { errorField, pesanError } from '@/lib/api';
import { PilihSuratKeluar } from './PilihSuratKeluar';
import { useBuatSuratMasuk } from './api';

const skema = z.object({
  nomor_surat: z.string().min(1, 'Nomor surat wajib diisi'),
  tanggal_surat: z.string().min(1, 'Tanggal surat wajib diisi'),
  perihal: z.string().min(1, 'Perihal wajib diisi'),
  pic: z.string().min(1, 'PIC wajib diisi'),
  pengirim: z.string().min(1, 'Pengirim wajib diisi'),
  keterangan: z.string().optional(),
});

type Isian = z.infer<typeof skema>;

/** Layar 03 Registrasi Surat Masuk (UC-02). */
export function SuratMasukBaruPage() {
  const navigate = useNavigate();
  const [berkas, setBerkas] = useState<File | null>(null);
  const [galatBerkas, setGalatBerkas] = useState<string | undefined>();
  const [progress, setProgress] = useState<number | null>(null);
  const [galatUmum, setGalatUmum] = useState<string | null>(null);
  const [suratKeluarId, setSuratKeluarId] = useState<number | null>(null);

  const buat = useBuatSuratMasuk(setProgress);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<Isian>({ resolver: zodResolver(skema) });

  const kirim = handleSubmit(async (isian) => {
    setGalatUmum(null);
    setGalatBerkas(undefined);

    if (!berkas) {
      setGalatBerkas('Dokumen surat wajib diunggah');
      return;
    }

    try {
      const hasil = await buat.mutateAsync({
        isian: { ...isian, surat_keluar_id: suratKeluarId },
        berkas,
      });
      navigate(`/surat-masuk/${hasil.id}`, { replace: true });
    } catch (e) {
      /* 400/422 membawa galat per field — pasang di kolomnya masing-masing
         supaya pengguna tidak perlu menebak mana yang salah. */
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
  });

  return (
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

          <Field label="Nomor surat" wajib galat={errors.nomor_surat?.message}>
            {(p) => (
              <Input
                {...p}
                {...register('nomor_surat')}
                placeholder="421.3/35/Hubin/SMK/2026"
                autoFocus
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
          <Button type="submit" ragam="utama" disabled={isSubmitting}>
            {isSubmitting ? 'Menyimpan…' : 'Simpan Surat'}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
