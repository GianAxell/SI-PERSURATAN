import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardBody, CardFooter, CardHeader } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Field } from '@/components/ui/Field';
import { Input, Textarea } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { pesanError } from '@/lib/api';
import { cn } from '@/lib/cn';
import type { Template, TemplateField, TipeField } from '@/types';
import { useDaftarTemplate, useSimpanField, useSimpanTemplate, useTemplate } from './api';

const LABEL_TIPE: Record<TipeField, string> = {
  text: 'Teks',
  textarea: 'Teks panjang',
  date: 'Tanggal',
  number: 'Angka',
  select: 'Pilihan',
};

/**
 * Layar 15 Data Master Template, dengan layar 33 sebagai modal fieldnya.
 *
 * Ini bagian yang membuat "menambah jenis surat baru tidak perlu mengubah
 * program" (K-9): isi tetap template dan definisi field dinamis semuanya
 * data, bukan kode.
 */
export function TemplatePage() {
  const [params, setParams] = useSearchParams();
  const { data: daftar, isPending: daftarMemuat } = useDaftarTemplate();

  const idParam = params.get('template');
  const jenisParam = params.get('jenis');

  const terpilihId =
    (idParam && Number(idParam)) ||
    (jenisParam
      ? (daftar?.find((t) => t.jenis_surat?.id === Number(jenisParam))?.id ?? null)
      : null) ||
    daftar?.[0]?.id ||
    null;

  const { data: template, isPending } = useTemplate(terpilihId);

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[300px_minmax(0,1fr)]">
      <Card className="h-fit">
        <CardHeader judul="Template" keterangan="Dikelompokkan menurut jenis surat" />
        <div className="p-2">
          {daftarMemuat ? (
            Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="mb-1 h-12 w-full" />
            ))
          ) : !daftar?.length ? (
            <p className="px-4 py-6 text-center text-sm text-ink-subtle">
              Belum ada template
            </p>
          ) : (
            daftar.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setParams({ template: String(t.id) })}
                className={cn(
                  'flex w-full flex-col items-start gap-0.5 rounded-control px-3 py-2.5 text-left',
                  'transition-colors duration-150',
                  t.id === terpilihId ? 'bg-surface-muted' : 'hover:bg-surface-muted/60',
                )}
              >
                <span className="flex w-full items-center justify-between gap-2">
                  <span className="truncate text-base text-ink">{t.nama}</span>
                  {t.is_active ? <Badge nada="hijau">Aktif</Badge> : null}
                </span>
<span className="tabular text-note text-ink-subtle">
                    {t.jenis_surat?.kode ?? '—'} · {(t.fields?.length ?? 0)} field
                  </span>
              </button>
            ))
          )}
        </div>
      </Card>

      {isPending || !template ? (
        <Card>
          <CardBody className="flex flex-col gap-3">
            <Skeleton className="h-5 w-64" />
            <Skeleton className="h-40 w-full" />
          </CardBody>
        </Card>
      ) : (
        <PenyuntingTemplate template={template} />
      )}
    </div>
  );
}

function PenyuntingTemplate({ template }: { template: Template }) {
  const simpan = useSimpanTemplate(template.id);
  const [konten, setKonten] = useState(template.konten_html);
  const [formatNomor, setFormatNomor] = useState(template.format_nomor);
  const [sunting, setSunting] = useState<TemplateField | 'baru' | null>(null);
  const [galat, setGalat] = useState<string | null>(null);
  const [tersimpan, setTersimpan] = useState(false);

  useEffect(() => {
    setKonten(template.konten_html);
    setFormatNomor(template.format_nomor);
  }, [template]);

  const berubah =
    konten !== template.konten_html || formatNomor !== template.format_nomor;

  const kirim = async () => {
    setGalat(null);
    try {
      await simpan.mutateAsync({ konten_html: konten, format_nomor: formatNomor });
      setTersimpan(true);
      setTimeout(() => setTersimpan(false), 2500);
    } catch (e) {
      setGalat(pesanError(e));
    }
  };

  return (
    <>
      <Card>
        <CardHeader
          judul={`Template: ${template.nama} (${template.jenis_surat.kode})`}
          keterangan="Bagian tetap dan field dinamis disimpan sebagai data, bukan kode."
        />

        <CardBody className="flex flex-col gap-6">
          <Field
            label="Bagian tetap"
            keterangan="Penanda field ditulis dalam kurung kurawal, contoh {kepada}"
          >
            {(p) => (
              <Textarea
                {...p}
                value={konten}
                onChange={(e) => setKonten(e.target.value)}
                rows={14}
                className="font-mono text-sm"
                spellCheck={false}
              />
            )}
          </Field>

          <Field
            label="Format nomor surat"
            keterangan="Kode perusahaan diambil dari Aturan Penomoran"
          >
            {(p) => (
              <Input
                {...p}
                value={formatNomor}
                onChange={(e) => setFormatNomor(e.target.value)}
                className="font-mono text-sm"
              />
            )}
          </Field>

          <div>
            <div className="mb-3 flex items-center justify-between gap-4">
              <div>
                <p className="text-card font-semibold text-ink">Field dinamis</p>
                <p className="mt-0.5 text-label text-ink-subtle">
                  Urutan di sini menentukan urutan isian pada wizard surat keluar.
                </p>
              </div>
              <Button ukuran="kecil" onClick={() => setSunting('baru')}>
                <Plus size={13} />
                Field
              </Button>
            </div>

            {template.fields.length === 0 ? (
              <EmptyState
                judul="Belum ada field dinamis"
                keterangan="Tambahkan field agar isi surat dapat berbeda tiap penerbitan."
              />
            ) : (
              <ul className="divide-y divide-line rounded-control border border-line">
                {[...template.fields]
                  .sort((a, b) => a.urutan - b.urutan)
                  .map((f) => (
                    <li
                      key={f.id}
                      className="flex items-center justify-between gap-4 px-4 py-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-mono text-base text-ink">
                          {`{${f.field_key}}`}
                        </p>
                        <p className="mt-0.5 text-label text-ink-subtle">
                          {f.label} · {LABEL_TIPE[f.tipe]} ·{' '}
                          {f.is_required ? 'Wajib' : 'Opsional'}
                        </p>
                      </div>
                      <Button ukuran="kecil" onClick={() => setSunting(f)}>
                        Ubah
                      </Button>
                    </li>
                  ))}
              </ul>
            )}
          </div>

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
        </CardBody>

        <CardFooter>
          <Button
            onClick={() => {
              setKonten(template.konten_html);
              setFormatNomor(template.format_nomor);
            }}
            disabled={!berubah}
          >
            Batal
          </Button>
          <Button ragam="utama" onClick={kirim} disabled={!berubah || simpan.isPending}>
            {simpan.isPending ? 'Menyimpan…' : 'Simpan'}
          </Button>
        </CardFooter>
      </Card>

      <FormFieldModal
        terbuka={sunting !== null}
        onTutup={() => setSunting(null)}
        field={sunting === 'baru' ? null : sunting}
        templateId={template.id}
        urutanBerikutnya={template.fields.length + 1}
      />
    </>
  );
}

/** Layar 33 Form Field Template. */
function FormFieldModal({
  terbuka,
  onTutup,
  field,
  templateId,
  urutanBerikutnya,
}: {
  terbuka: boolean;
  onTutup: () => void;
  field: TemplateField | null;
  templateId: number;
  urutanBerikutnya: number;
}) {
  const simpan = useSimpanField(templateId);
  const [isian, setIsian] = useState<Omit<TemplateField, 'id'>>(kosong(urutanBerikutnya));
  const [galat, setGalat] = useState<Record<string, string>>({});
  const [galatUmum, setGalatUmum] = useState<string | null>(null);

  useEffect(() => {
    if (!terbuka) return;
    setIsian(field ? { ...field } : kosong(urutanBerikutnya));
    setGalat({});
    setGalatUmum(null);
  }, [terbuka, field, urutanBerikutnya]);

  const kirim = async () => {
    const g: Record<string, string> = {};
    if (!/^[a-z][a-z0-9_]*$/.test(isian.field_key)) {
      g.field_key = 'Huruf kecil, angka, dan garis bawah; diawali huruf';
    }
    if (!isian.label.trim()) g.label = 'Label tampilan wajib diisi';
    setGalat(g);
    if (Object.keys(g).length) return;

    setGalatUmum(null);
    try {
      await simpan.mutateAsync({ id: field?.id, isian });
      onTutup();
    } catch (e) {
      setGalatUmum(pesanError(e));
    }
  };

  return (
    <Modal
      terbuka={terbuka}
      onTutup={onTutup}
      judul={field ? 'Ubah Field Template' : 'Tambah Field Template'}
      keterangan="Nama field dipakai di dalam bagian tetap template, ditulis dalam kurung kurawal."
      lebar="sempit"
      footer={
        <>
          <Button onClick={onTutup}>Batal</Button>
          <Button ragam="utama" onClick={kirim} disabled={simpan.isPending}>
            {simpan.isPending ? 'Menyimpan…' : 'Simpan'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        <Field
          label="Nama field"
          wajib
          galat={galat.field_key}
          keterangan={`Ditulis di template sebagai {${isian.field_key || 'nama_field'}}`}
        >
          {(p) => (
            <Input
              {...p}
              value={isian.field_key}
              onChange={(e) =>
                setIsian((s) => ({
                  ...s,
                  field_key: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''),
                }))
              }
              placeholder="kepada"
              className="font-mono"
            />
          )}
        </Field>

        <Field label="Label tampilan" wajib galat={galat.label}>
          {(p) => (
            <Input
              {...p}
              value={isian.label}
              onChange={(e) => setIsian((s) => ({ ...s, label: e.target.value }))}
              placeholder="Kepada"
            />
          )}
        </Field>

        <Field label="Tipe data">
          {(p) => (
            <Select
              id={p.id}
              nilai={isian.tipe}
              onUbah={(v) => setIsian((s) => ({ ...s, tipe: v as TipeField }))}
              opsi={(Object.keys(LABEL_TIPE) as TipeField[]).map((t) => ({
                nilai: t,
                label: LABEL_TIPE[t],
              }))}
            />
          )}
        </Field>

        <Field label="Wajib diisi">
          {(p) => (
            <Select
              id={p.id}
              nilai={isian.is_required ? 'ya' : 'tidak'}
              onUbah={(v) => setIsian((s) => ({ ...s, is_required: v === 'ya' }))}
              opsi={[
                { nilai: 'ya', label: 'Ya' },
                { nilai: 'tidak', label: 'Tidak' },
              ]}
            />
          )}
        </Field>

        <Field label="Nilai bawaan" keterangan="Kosongkan bila tidak ada">
          {(p) => (
            <Input
              {...p}
              value={isian.nilai_bawaan ?? ''}
              onChange={(e) =>
                setIsian((s) => ({ ...s, nilai_bawaan: e.target.value || null }))
              }
            />
          )}
        </Field>

        <Field label="Urutan tampil">
          {(p) => (
            <Input
              {...p}
              type="number"
              min={1}
              value={isian.urutan}
              onChange={(e) => setIsian((s) => ({ ...s, urutan: Number(e.target.value) }))}
            />
          )}
        </Field>

        {galatUmum ? (
          <p
            role="alert"
            className="rounded-control border border-st-merah-br bg-st-merah-bg px-3 py-2 text-label text-st-merah-fg"
          >
            {galatUmum}
          </p>
        ) : null}
      </div>
    </Modal>
  );
}

function kosong(urutan: number): Omit<TemplateField, 'id'> {
  return {
    field_key: '',
    label: '',
    tipe: 'text',
    is_required: true,
    nilai_bawaan: null,
    urutan,
    opsi: null,
  };
}
