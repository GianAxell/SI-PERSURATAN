import { z } from 'zod';
import { DateInput } from '@/components/ui/DateInput';
import { Field } from '@/components/ui/Field';
import { Input, Textarea } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import type { TemplateField, TipeField } from '@/types';

/**
 * Layar 09 Isi Data.
 *
 * Formulir tidak boleh dikodekan per jenis surat — kalau begitu, menambah
 * jenis surat baru berarti mengubah program, dan janji layar 15 batal.
 * Yang dilakukan di sini: satu peta tipe → komponen, lalu daftar field dari
 * `GET /master/template/:id` dirender lewat peta itu.
 */

export type NilaiDinamis = Record<string, string>;

/** Skema zod dirakit saat berjalan, bukan ditulis tangan per template. */
export function skemaDari(fields: TemplateField[]) {
  const bentuk: Record<string, z.ZodTypeAny> = {};

  for (const f of fields) {
    let aturan: z.ZodTypeAny = z.string();

    if (f.tipe === 'number') {
      aturan = z
        .string()
        .refine((v) => v === '' || !Number.isNaN(Number(v)), 'Harus berupa angka');
    }
    if (f.is_required) {
      aturan = (aturan as z.ZodString).refine(
        (v: string) => v.trim() !== '',
        `${f.label} wajib diisi`,
      );
    }
    bentuk[f.field_key] = aturan;
  }

  return z.object(bentuk);
}

/** Nilai awal: bawaan template kalau ada, selain itu kosong. */
export function nilaiAwal(fields: TemplateField[], sudahAda?: NilaiDinamis): NilaiDinamis {
  return Object.fromEntries(
    fields.map((f) => [f.field_key, sudahAda?.[f.field_key] ?? f.nilai_bawaan ?? '']),
  );
}

/**
 * Empat field ini dikirim sebagai kolom tetap sekaligus masuk data_dinamis
 * (§3.9 kontrak), jadi nilainya diambil dari isian yang sama.
 */
export const KOLOM_TETAP = ['kepada', 'perihal', 'tanggal', 'pic'] as const;

export function FieldDinamis({
  field,
  nilai,
  galat,
  onUbah,
}: {
  field: TemplateField;
  nilai: string;
  galat?: string;
  onUbah: (nilai: string) => void;
}) {
  return (
    <Field
      label={field.label}
      wajib={field.is_required}
      galat={galat}
      className={field.tipe === 'textarea' ? 'sm:col-span-2' : undefined}
    >
      {(p) => <Kolom {...p} tipe={field.tipe} field={field} nilai={nilai} onUbah={onUbah} />}
    </Field>
  );
}

function Kolom({
  tipe,
  field,
  nilai,
  onUbah,
  ...p
}: {
  tipe: TipeField;
  field: TemplateField;
  nilai: string;
  onUbah: (nilai: string) => void;
  id: string;
  'aria-invalid': boolean;
  'aria-describedby'?: string;
}) {
  switch (tipe) {
    case 'textarea':
      return (
        <Textarea
          {...p}
          rows={5}
          value={nilai}
          onChange={(e) => onUbah(e.target.value)}
          placeholder={`Tulis ${field.label.toLowerCase()}`}
        />
      );

    case 'date':
      return <DateInput {...p} value={nilai} onChange={(e) => onUbah(e.target.value)} />;

    case 'number':
      return (
        <Input
          {...p}
          type="number"
          inputMode="numeric"
          value={nilai}
          onChange={(e) => onUbah(e.target.value)}
        />
      );

    case 'select':
      return (
        <Select
          {...p}
          nilai={nilai || undefined}
          onUbah={onUbah}
          opsi={(field.opsi ?? []).map((o) => ({ nilai: o, label: o }))}
          placeholder={`Pilih ${field.label.toLowerCase()}`}
        />
      );

    default:
      return (
        <Input
          {...p}
          value={nilai}
          onChange={(e) => onUbah(e.target.value)}
          placeholder={`Tulis ${field.label.toLowerCase()}`}
        />
      );
  }
}
