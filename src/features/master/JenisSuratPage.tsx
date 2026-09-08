import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { errorField, pesanError } from '@/lib/api';
import { cn } from '@/lib/cn';
import { STATUS_AKTIF } from '@/lib/status';
import type { JenisSurat, StatusAktif } from '@/types';
import {
  useBagian,
  useJenisSurat,
  useSimpanJenisSurat,
  type IsianJenisSurat,
} from './api';

/**
 * Layar 14 Data Master Jenis Surat, dengan layar 31 sebagai modalnya.
 *
 * Master bersifat dua tingkat: bagian di kiri, kode perihal miliknya di
 * kanan. Bagian yang sedang dibuka disimpan di URL agar bisa ditautkan.
 */
export function JenisSuratPage() {
  const [params, setParams] = useSearchParams();
  const { data: bagian, isPending: bagianMemuat } = useBagian();

  const bagianId = params.get('bagian') ? Number(params.get('bagian')) : null;
  const terpilih = bagian?.find((b) => b.id === bagianId) ?? bagian?.[0] ?? null;

  const { data: jenis, isPending } = useJenisSurat(terpilih?.id ?? null);
  const [sunting, setSunting] = useState<JenisSurat | 'baru' | null>(null);

  const pilih = (id: number) => setParams({ bagian: String(id) });

  return (
    <>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
        <Card className="h-fit">
          <CardHeader judul="Bagian" keterangan="Enam bagian penerbit surat" />
          <div className="p-2">
            {bagianMemuat
              ? Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="mb-1 h-11 w-full" />
                ))
              : bagian?.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => pilih(b.id)}
                    className={cn(
                      'flex w-full items-center justify-between gap-2 rounded-control px-3 py-2.5',
                      'text-left transition-colors duration-150',
                      b.id === terpilih?.id
                        ? 'bg-surface-muted'
                        : 'hover:bg-surface-muted/60',
                    )}
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-base text-ink">
                        <span className="tabular font-medium">{b.kode}</span> {b.nama}
                      </span>
                      <span className="tabular text-note text-ink-subtle">
                        {b.jumlah_kode_surat} kode
                      </span>
                    </span>
                    {b.status === 'nonaktif' ? <Badge nada="abu">Nonaktif</Badge> : null}
                  </button>
                ))}
          </div>
        </Card>

        <Card>
          <CardHeader
            judul={
              terpilih
                ? `Kode jenis surat — ${terpilih.kode} ${terpilih.nama}`
                : 'Kode jenis surat'
            }
            keterangan="Kode ini menjadi segmen kedua pada nomor surat keluar."
            aksi={
              <Button
                ragam="utama"
                ukuran="kecil"
                onClick={() => setSunting('baru')}
                disabled={!terpilih}
              >
                <Plus size={13} />
                Tambah Kode
              </Button>
            }
          />

          {isPending ? (
            <CardBody className="flex flex-col gap-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </CardBody>
          ) : !jenis?.length ? (
            <EmptyState
              judul="Belum ada kode jenis surat"
              keterangan="Tambahkan kode perihal untuk bagian ini."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] border-collapse text-base">
                <thead>
                  <tr className="h-11 bg-surface-muted">
                    <th className="w-[120px] px-6 text-left text-label font-medium text-ink-muted">
                      Kode
                    </th>
                    <th className="px-6 text-left text-label font-medium text-ink-muted">
                      Nama Perihal
                    </th>
                    <th className="w-[140px] px-6 text-left text-label font-medium text-ink-muted">
                      Template
                    </th>
                    <th className="w-[110px] px-6 text-left text-label font-medium text-ink-muted">
                      Status
                    </th>
                    <th className="w-[100px] px-6 text-left text-label font-medium text-ink-muted">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {jenis.map((j) => {
                    const s = STATUS_AKTIF[j.status];
                    return (
                      <tr key={j.id} className="h-[54px] border-t border-line">
                        <td className="tabular px-6 font-medium">{j.kode}</td>
                        <td className="px-6">{j.nama}</td>
                        <td className="px-6">
                          {j.jumlah_template > 0 ? (
                            <Link
                              to={`/master/template?jenis=${j.id}`}
                              className="tabular text-ink-muted underline decoration-line underline-offset-4 hover:text-ink"
                            >
                              {j.jumlah_template} template
                            </Link>
                          ) : (
                            <span className="tabular text-ink-subtle">0 template</span>
                          )}
                        </td>
                        <td className="px-6">
                          <Badge nada={s.nada}>{s.label}</Badge>
                        </td>
                        <td className="px-6">
                          <Button ukuran="kecil" onClick={() => setSunting(j)}>
                            Ubah
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {terpilih ? (
        <FormJenisSuratModal
          terbuka={sunting !== null}
          onTutup={() => setSunting(null)}
          jenis={sunting === 'baru' ? null : sunting}
          bagianId={terpilih.id}
        />
      ) : null}
    </>
  );
}

/** Layar 31 Form Kode Jenis Surat. */
function FormJenisSuratModal({
  terbuka,
  onTutup,
  jenis,
  bagianId,
}: {
  terbuka: boolean;
  onTutup: () => void;
  jenis: JenisSurat | null;
  bagianId: number;
}) {
  const { data: bagian } = useBagian();
  const simpan = useSimpanJenisSurat();
  const toast = useToast();

  const [isian, setIsian] = useState<IsianJenisSurat>({
    bagian_id: bagianId,
    kode: '',
    nama: '',
    status: 'aktif',
  });
  const [galat, setGalat] = useState<Record<string, string>>({});
  const [galatUmum, setGalatUmum] = useState<string | null>(null);

  useEffect(() => {
    if (!terbuka) return;
    setIsian(
      jenis
        ? {
            bagian_id: jenis.bagian.id,
            /* Yang disunting hanya dua digit di belakang titik; awalannya
               mengikuti bagian dan tidak diketik ulang. */
            kode: jenis.kode.split('.')[1] ?? '',
            nama: jenis.nama,
            status: jenis.status,
          }
        : { bagian_id: bagianId, kode: '', nama: '', status: 'aktif' },
    );
    setGalat({});
    setGalatUmum(null);
  }, [terbuka, jenis, bagianId]);

  const kodeBagian = bagian?.find((b) => b.id === isian.bagian_id)?.kode ?? '';

  const kirim = async () => {
    const g: Record<string, string> = {};
    if (!/^\d{2}$/.test(isian.kode)) g.kode = 'Kode berupa dua angka, contoh 03';
    if (!isian.nama.trim()) g.nama = 'Nama perihal wajib diisi';
    setGalat(g);
    if (Object.keys(g).length) return;

    setGalatUmum(null);
    try {
      await simpan.mutateAsync({ id: jenis?.id, isian });
      toast.sukses(jenis ? 'Kode perihal diperbarui' : 'Kode perihal baru ditambahkan');
      onTutup();
    } catch (e) {
      const perField = errorField(e);
      if (Object.keys(perField).length) setGalat(perField);
      else setGalatUmum(pesanError(e));
      toast.galat('Kode perihal gagal disimpan', pesanError(e));
    }
  };

  return (
    <Modal
      terbuka={terbuka}
      onTutup={onTutup}
      judul={jenis ? 'Ubah Kode Jenis Surat' : 'Tambah Kode Jenis Surat'}
      keterangan="Kode ini menjadi segmen kedua pada nomor surat keluar."
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
        <Field label="Bagian" wajib>
          {(p) => (
            <Select
              id={p.id}
              nilai={String(isian.bagian_id)}
              onUbah={(v) => setIsian((s) => ({ ...s, bagian_id: Number(v) }))}
              opsi={(bagian ?? []).map((b) => ({
                nilai: String(b.id),
                label: `${b.kode} — ${b.nama}`,
              }))}
            />
          )}
        </Field>

        <Field
          label="Kode"
          wajib
          galat={galat.kode}
          keterangan={`Hasil: ${kodeBagian}.${isian.kode || 'NN'}`}
        >
          {(p) => (
            <Input
              {...p}
              value={isian.kode}
              onChange={(e) =>
                setIsian((s) => ({ ...s, kode: e.target.value.replace(/\D/g, '').slice(0, 2) }))
              }
              placeholder="03"
              className="tabular"
              inputMode="numeric"
            />
          )}
        </Field>

        <Field label="Nama perihal" wajib galat={galat.nama}>
          {(p) => (
            <Input
              {...p}
              value={isian.nama}
              onChange={(e) => setIsian((s) => ({ ...s, nama: e.target.value }))}
              placeholder="Invoice"
            />
          )}
        </Field>

        <Field label="Status">
          {(p) => (
            <Select
              id={p.id}
              nilai={isian.status}
              onUbah={(v) => setIsian((s) => ({ ...s, status: v as StatusAktif }))}
              opsi={[
                { nilai: 'aktif', label: 'Aktif' },
                { nilai: 'nonaktif', label: 'Nonaktif' },
              ]}
            />
          )}
        </Field>

        <p className="text-note text-ink-subtle">
          Kode yang pernah dipakai pada surat lama sebaiknya dinonaktifkan, bukan diubah —
          nomor surat yang sudah terbit merujuk kode tersebut.
        </p>

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
