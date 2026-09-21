import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, FileText } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardBody, CardFooter, CardHeader } from '@/components/ui/Card';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { PdfPreview } from '@/components/ui/PdfPreview';
import { useToast } from '@/components/ui/Toast';
import { Skeleton } from '@/components/ui/Skeleton';
import { errorField, pesanError } from '@/lib/api';
import { cn } from '@/lib/cn';
import { rupiah, tanggalPanjang } from '@/lib/format';
import { useBagian, useDaftarTemplate, useJenisSurat, useTemplate } from '@/features/master/api';
import type { SuratKeluar, TemplateField } from '@/types';
import { useBuatSuratKeluar } from './api';
import { FieldDinamis, nilaiAwal, skemaDari, type NilaiDinamis } from './FieldDinamis';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { DateInput } from '@/components/ui/DateInput';

const LANGKAH = ['Pilih Jenis', 'Isi Data', 'Pratinjau'] as const;

/**
 * Layar 08 → 09 → 10 Buat Surat Keluar.
 *
 * Langkah dan pilihan template disimpan di query string, sehingga menekan
 * tombol kembali browser berpindah langkah, bukan meninggalkan wizard.
 * Nomor surat sengaja baru terbit setelah POST berhasil (K-7) — sebelum itu
 * kolomnya berbunyi "Dibuat otomatis saat disimpan", supaya surat yang batal
 * dibuat tidak memakan satu nomor.
 */
export function SuratKeluarBaruPage() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();

  const langkah = Math.min(3, Math.max(1, Number(params.get('langkah') ?? 1)));
  const bagianId = params.get('bagian') ? Number(params.get('bagian')) : null;
  const jenisId = params.get('jenis') ? Number(params.get('jenis')) : null;
  const templateId = params.get('template') ? Number(params.get('template')) : null;

  const [isian, setIsian] = useState<NilaiDinamis>({});
  const [galatField, setGalatField] = useState<Record<string, string>>({});
  const [galat, setGalat] = useState<string | null>(null);
  const [hasil, setHasil] = useState<SuratKeluar | null>(null);
  const [pratinjauBerkas, setPratinjauBerkas] = useState(false);
  const [konfirmasi, setKonfirmasi] = useState(false);

  const { data: bagian } = useBagian();
  const { data: jenis } = useJenisSurat(bagianId);
  const { data: semuaTemplate } = useDaftarTemplate();
  const { data: template, isPending: memuatTemplate } = useTemplate(templateId);
  const buat = useBuatSuratKeluar();

  const templateJenis = useMemo(
    () =>
      (semuaTemplate ?? []).filter((t) => {
        if (!t.is_active) return false;
        if (!jenisId) return true; // Tampilkan semua aktif jika belum pilih jenis
        return t.jenis_surat?.id === jenisId;
      }),
    [semuaTemplate, jenisId],
  );

  const fields = useMemo(
    () => [...(template?.fields ?? [])].sort((a, b) => a.urutan - b.urutan),
    [template],
  );

  /* Isian disiapkan sekali per template, memakai nilai bawaan yang tersimpan. */
  useEffect(() => {
    if (!template) return;
    setIsian((sebelumnya) => nilaiAwal(template.fields, sebelumnya));
  }, [template]);

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
    /* Validasi kolom tetap manual (tidak di zod) */
    const galatTetap: Record<string, string> = {};
    if (!isian.tanggal?.trim()) galatTetap.tanggal = 'Tanggal surat wajib diisi';
    if (!isian.kepada?.trim()) galatTetap.kepada = 'Kepada wajib diisi';
    if (!isian.perihal?.trim()) galatTetap.perihal = 'Perihal wajib diisi';

    /* Validasi field dinamis dari template (zod) */
    const skema = skemaDari(fields);
    const periksa = skema.safeParse(isian);
    const galatDinamis: Record<string, string> = {};
    if (!periksa.success) {
      for (const m of periksa.error.issues) {
        const kunci = String(m.path[0]);
        if (!galatDinamis[kunci]) galatDinamis[kunci] = m.message;
      }
    }

    const semuaGagal = { ...galatTetap, ...galatDinamis };
    if (Object.keys(semuaGagal).length > 0) {
      setGalatField(semuaGagal);
      return;
    }
    setGalatField({});
    keLangkah(3);
  };

  /* Kolom tetap: selalu ada, tidak tergantung template */
  const kolomTetap = [
    { kunci: 'tanggal', label: 'Tanggal Surat', tipe: 'date' as const, wajib: true },
    { kunci: 'kepada', label: 'Kepada', tipe: 'text' as const, wajib: true },
    { kunci: 'perihal', label: 'Perihal', tipe: 'text' as const, wajib: true },
    { kunci: 'pic', label: 'PIC', tipe: 'text' as const, wajib: false },
  ];

  const simpan = async () => {
    if (!template) return;
    setGalat(null);
    try {
      const surat = await buat.mutateAsync({
        template_id: template.id,
        tanggal_surat: isian.tanggal ?? new Date().toISOString().slice(0, 10),
        kepada: isian.kepada ?? '',
        perihal: isian.perihal ?? '',
        pic: isian.pic || null,
        data_dinamis: isian,
      });
      setKonfirmasi(false);
      setHasil(surat);
      toast.sukses(
        'Surat keluar berhasil diterbitkan',
        `Nomor ${surat.nomor_surat} sudah tercatat dan dokumennya siap diunduh.`,
      );
    } catch (e) {
      setKonfirmasi(false);
      setGalat(pesanError(e));
      setGalatField(errorField(e));
      toast.galat('Surat keluar gagal diterbitkan', pesanError(e));
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <Stepper langkah={hasil ? 3 : langkah} selesai={Boolean(hasil)} />

      {hasil ? (
        <Selesai
          surat={hasil}
          onPratinjau={() => setPratinjauBerkas(true)}
          onBuatLagi={() => {
            setHasil(null);
            setIsian({});
            setParams(new URLSearchParams());
          }}
        />
      ) : langkah === 1 ? (
        <PilihJenis
          bagian={bagian}
          jenis={jenis}
          template={templateJenis}
          bagianId={bagianId}
          jenisId={jenisId}
          templateId={templateId}
          onPilihBagian={(id) => pindah({ bagian: String(id), jenis: null, template: null })}
          onPilihJenis={(id) => pindah({ jenis: String(id), template: null })}
          onPilihTemplate={(id) => pindah({ template: String(id) })}
          onLanjut={() => keLangkah(2)}
        />
      ) : langkah === 2 ? (
        <Card>
          <CardHeader
            judul={template ? `Isi data — ${template.nama}` : 'Isi data'}
            keterangan="Kolom di bawah datang dari template, bukan dari program. Menambah kolom cukup lewat Data Master Template."
          />
          <CardBody>
            {/* Kolom tetap: Tanggal, Kepada, Perihal, PIC — selalu ada */}
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-4 pt-2">
              {kolomTetap.map((kolom) => (
                <Field
                  key={kolom.kunci}
                  label={kolom.label}
                  wajib={kolom.wajib}
                  className="sm:col-span-1">
                  {(p) => {
                    const { tipe } = kolom;
                    return <KolomTetap
                      {...p}
                      tipe={tipe}
                      nilai={isian[kolom.kunci] ?? ''}
                      onUbah={(v) => setIsian((s) => ({ ...s, [kolom.kunci]: v }))}
                    />;
                  }}
                </Field>
              ))}
            </div>
            {memuatTemplate || !template ? (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                {Array.from({ length: 6 }, (_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                {fields.map((f) => (
                  <FieldDinamis
                    key={f.field_key}
                    field={f}
                    nilai={isian[f.field_key] ?? ''}
                    galat={galatField[f.field_key]}
                    onUbah={(v) => {
                      setIsian((s) => ({ ...s, [f.field_key]: v }));
                      setGalatField((g) => {
                        if (!g[f.field_key]) return g;
                        const { [f.field_key]: _dibuang, ...sisa } = g;
                        return sisa;
                      });
                    }}
                  />
                ))}
              </div>
            )}
          </CardBody>
          <CardFooter className="justify-between">
            <Button onClick={() => keLangkah(1)}>
              <ArrowLeft size={15} />
              Kembali
            </Button>
            <Button ragam="utama" onClick={lanjutDariIsian} disabled={!template}>
              Lanjut ke pratinjau
              <ArrowRight size={15} />
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <Pratinjau
          konten={template?.konten_html ?? ''}
          isian={isian}
          fields={fields}
          galat={galat}
          menyimpan={buat.isPending}
          onKembali={() => keLangkah(2)}
          onSimpan={() => setKonfirmasi(true)}
        />
      )}

      <ConfirmDialog
        terbuka={konfirmasi}
        onTutup={() => setKonfirmasi(false)}
        onSetuju={simpan}
        sedangProses={buat.isPending}
        judul="Terbitkan surat keluar ini?"
        labelSetuju="Ya, Terbitkan Surat"
        labelBatal="Periksa Lagi"
        keterangan={
          <>
            Nomor surat diambil dari urutan berjalan begitu tombol ini ditekan, dan nomor
            yang sudah terpakai tidak dapat dikembalikan. Pastikan isinya sudah sesuai.
          </>
        }
        rincian={
          template
            ? [
                {
                  label: 'Jenis surat',
                  nilai: `${template.jenis_surat.kode} — ${template.jenis_surat.nama}`,
                },
                { label: 'Template', nilai: template.nama },
                {
                  label: 'Tanggal surat',
                  nilai: isian.tanggal ? tanggalPanjang(isian.tanggal) : null,
                  tabular: true,
                },
                { label: 'Kepada', nilai: isian.kepada },
                { label: 'Perihal', nilai: isian.perihal },
                { label: 'PIC', nilai: isian.pic },
              ]
            : undefined
        }
      />

      {hasil ? (
        <PdfPreview
          terbuka={pratinjauBerkas}
          onTutup={() => setPratinjauBerkas(false)}
          url={`/surat-keluar/${hasil.id}/file`}
          judul={hasil.nomor_surat}
          namaBerkas={`${hasil.nomor_surat.replace(/\//g, '-')}.pdf`}
        />
      ) : null}

      {!hasil ? (
        <p className="text-center text-note text-ink-subtle">
          Batal?{' '}
          <button
            type="button"
            onClick={() => navigate('/surat-keluar')}
            className="underline underline-offset-2 hover:text-ink"
          >
            Kembali ke daftar surat keluar
          </button>
          . Tidak ada nomor yang terpakai sebelum surat disimpan.
        </p>
      ) : null}
    </div>
  );
}

/* ---------- langkah ---------- */

function Stepper({ langkah, selesai }: { langkah: number; selesai: boolean }) {
  return (
    <ol className="flex items-center gap-3">
      {LANGKAH.map((nama, i) => {
        const nomor = i + 1;
        const lewat = selesai || nomor < langkah;
        const kini = !selesai && nomor === langkah;
        return (
          <li key={nama} className="flex flex-1 items-center gap-3">
            <div className="flex items-center gap-2.5">
              <span
                className={cn(
                  'flex size-7 shrink-0 items-center justify-center rounded-full text-label font-semibold',
                  lewat
                    ? 'bg-st-hijau-bg text-st-hijau-fg'
                    : kini
                      ? 'bg-nav text-white'
                      : 'bg-surface-muted text-ink-subtle',
                )}
              >
                {lewat ? <Check size={14} /> : nomor}
              </span>
              <span
                className={cn(
                  'whitespace-nowrap text-base',
                  kini ? 'font-semibold text-ink' : 'text-ink-muted',
                )}
              >
                {nama}
              </span>
            </div>
            {i < LANGKAH.length - 1 ? <span className="h-px flex-1 bg-line" /> : null}
          </li>
        );
      })}
    </ol>
  );
}

function PilihJenis({
  bagian,
  jenis,
  template,
  bagianId,
  jenisId,
  templateId,
  onPilihBagian,
  onPilihJenis,
  onPilihTemplate,
  onLanjut,
}: {
  bagian?: { id: number; kode: string; nama: string; status: string }[];
  jenis?: { id: number; kode: string; nama: string }[];
  template: { id: number; nama: string; jenis_surat: { kode: string } }[];
  bagianId: number | null;
  jenisId: number | null;
  templateId: number | null;
  onPilihBagian: (id: number) => void;
  onPilihJenis: (id: number) => void;
  onPilihTemplate: (id: number) => void;
  onLanjut: () => void;
}) {
  return (
    <Card>
      <CardHeader
        judul="Pilih jenis surat"
        keterangan="Bagian menentukan kode perihal, dan kode perihal menentukan template yang tersedia."
      />
      <CardBody className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Kolom judul="Bagian">
          {(bagian ?? [])
            .filter((b) => b.status === 'aktif')
            .map((b) => (
              <Pilihan
                key={b.id}
                terpilih={b.id === bagianId}
                onClick={() => onPilihBagian(b.id)}
                judul={b.nama}
                keterangan={b.kode}
              />
            ))}
        </Kolom>

        <Kolom judul="Kode perihal" kosong={!bagianId ? 'Pilih bagian lebih dulu' : undefined}>
          {(jenis ?? []).map((j) => (
            <Pilihan
              key={j.id}
              terpilih={j.id === jenisId}
              onClick={() => onPilihJenis(j.id)}
              judul={j.nama}
              keterangan={j.kode}
            />
          ))}
        </Kolom>

        <Kolom
          judul="Template"
          kosong={
            !jenisId
              ? 'Pilih kode perihal lebih dulu'
              : template.length === 0
                ? 'Belum ada template aktif untuk kode ini'
                : undefined
          }
        >
          {template.map((t) => (
            <Pilihan
              key={t.id}
              terpilih={t.id === templateId}
              onClick={() => onPilihTemplate(t.id)}
              judul={t.nama}
              keterangan={t.jenis_surat.kode}
            />
          ))}
        </Kolom>
      </CardBody>
      <CardFooter className="justify-end">
        <Button ragam="utama" onClick={onLanjut} disabled={!templateId}>
          Lanjut isi data
          <ArrowRight size={15} />
        </Button>
      </CardFooter>
    </Card>
  );
}

function Kolom({
  judul,
  kosong,
  children,
}: {
  judul: string;
  kosong?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-label font-medium text-ink-muted">{judul}</p>
      {kosong ? (
        <p className="rounded-control border border-dashed border-line px-3 py-4 text-sm text-ink-subtle">
          {kosong}
        </p>
      ) : (
        <div className="flex max-h-[340px] flex-col gap-1.5 overflow-y-auto pr-1">
          {children}
        </div>
      )}
    </div>
  );
}

function Pilihan({
  terpilih,
  onClick,
  judul,
  keterangan,
}: {
  terpilih: boolean;
  onClick: () => void;
  judul: string;
  keterangan: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex items-center justify-between gap-3 rounded-control border px-3 py-2.5 text-left transition-colors',
        terpilih
          ? 'border-nav bg-surface-muted text-ink'
          : 'border-line bg-surface text-ink-muted hover:border-ink-subtle',
      )}
    >
      <span className="truncate text-base">{judul}</span>
      <span className="tabular shrink-0 text-label text-ink-subtle">{keterangan}</span>
    </button>
  );
}

/**
 * Pratinjau merangkai konten template dengan isian. Penanda yang tidak
 * terisi dibiarkan terlihat sebagai tanda kurung kurawal, bukan dihapus,
 * supaya kekurangan data ketahuan sebelum surat terbit.
 */
function Pratinjau({
  konten,
  isian,
  fields,
  galat,
  menyimpan,
  onKembali,
  onSimpan,
}: {
  konten: string;
  isian: NilaiDinamis;
  fields: TemplateField[];
  galat: string | null;
  menyimpan: boolean;
  onKembali: () => void;
  onSimpan: () => void;
}) {
  const teks = useMemo(() => {
    let hasil = konten.replace('{nomor_surat}', 'Dibuat otomatis saat disimpan');
    for (const f of fields) {
      const nilai = isian[f.field_key];
      /* Angka dan tanggal ditampilkan seperti nanti tercetak, bukan mentah —
         Rp 18.750.000, bukan 18750000. */
      const tampil =
        f.tipe === 'number'
          ? rupiah(Number(nilai))
          : f.tipe === 'date'
            ? tanggalPanjang(nilai)
            : nilai;

      hasil = hasil.replaceAll(
        `{${f.field_key}}`,
        nilai ? escapeHtml(tampil) : `<em class="text-ink-subtle">{${f.field_key}}</em>`,
      );
    }
    return hasil;
  }, [konten, fields, isian]);

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      <Card>
        <CardHeader
          judul="Pratinjau surat"
          keterangan="Tata letak akhir mengikuti template; yang ditampilkan di sini isinya."
        />
        <CardBody>
          <div
            className="prose-surat rounded-control border border-line bg-surface-muted px-6 py-8 text-base leading-relaxed text-ink"
            dangerouslySetInnerHTML={{ __html: teks }}
          />
        </CardBody>
        <CardFooter className="justify-between">
          <Button onClick={onKembali} disabled={menyimpan}>
            <ArrowLeft size={15} />
            Kembali
          </Button>
          <Button ragam="utama" onClick={onSimpan} disabled={menyimpan}>
            {menyimpan ? 'Menyimpan…' : 'Buat Surat'}
          </Button>
        </CardFooter>
      </Card>

      <Card className="h-fit">
        <CardHeader judul="Sebelum disimpan" />
        <CardBody className="flex flex-col gap-3 text-base text-ink-muted">
          <p>
            Nomor surat baru diambil ketika tombol <strong className="text-ink">Buat Surat</strong>{' '}
            ditekan. Membatalkan sekarang tidak menyisakan nomor yang kosong.
          </p>
          <p>
            Bulan dan tahun pada nomor mengikuti tanggal surat{' '}
            <span className="tabular text-ink">
              {isian.tanggal ? tanggalPanjang(isian.tanggal) : '—'}
            </span>
            , bukan tanggal hari ini.
          </p>
          {galat ? (
            <p
              role="alert"
              className="rounded-control border border-st-merah-br bg-st-merah-bg px-3 py-2 text-label text-st-merah-fg"
            >
              {galat}
            </p>
          ) : null}
        </CardBody>
      </Card>
    </div>
  );
}

function Selesai({
  surat,
  onPratinjau,
  onBuatLagi,
}: {
  surat: SuratKeluar;
  onPratinjau: () => void;
  onBuatLagi: () => void;
}) {
  return (
    <Card>
      <CardBody className="flex flex-col items-center gap-4 py-10 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-st-hijau-bg text-st-hijau-fg">
          <Check size={22} />
        </span>
        <div>
          <p className="text-card font-semibold text-ink">Surat keluar berhasil dibuat</p>
          <p className="mt-1 text-base text-ink-muted">
            Dokumen dihasilkan dalam format PDF dan sudah tercatat di daftar surat keluar.
          </p>
        </div>

        <p className="tabular rounded-control bg-surface-muted px-4 py-2.5 text-card font-semibold text-ink">
          {surat.nomor_surat}
        </p>

        <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
          <Button onClick={onPratinjau}>
            <FileText size={15} />
            Lihat dokumen
          </Button>
          <Button asChild>
            <Link to={`/surat-keluar/${surat.id}`}>Buka detail surat</Link>
          </Button>
          <Button ragam="utama" onClick={onBuatLagi}>
            Buat surat lagi
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}

function escapeHtml(v: string) {
  return v
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br />');
}

function KolomTetap({
  tipe,
  nilai,
  onUbah,
  ...p
}: {
  tipe: 'text' | 'date';
  nilai: string;
  onUbah: (nilai: string) => void;
  id: string;
  'aria-invalid': boolean;
  'aria-describedby'?: string;
}) {
  if (tipe === 'date') {
    return <DateInput {...p} value={nilai} onChange={(e) => onUbah(e.target.value)} />;
  }
  return (
    <Input
      {...p}
      value={nilai}
      onChange={(e) => onUbah(e.target.value)}
      placeholder="Tulis"
    />
  );
}
