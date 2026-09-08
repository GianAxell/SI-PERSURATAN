import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { useToast } from '@/components/ui/Toast';
import { errorField, pesanError } from '@/lib/api';
import type { Pegawai, StatusAktif } from '@/types';
import {
  useAkunTersedia,
  useBagian,
  useSimpanPegawai,
  type IsianPegawai,
} from './api';

/**
 * Layar 34 Form Pegawai.
 *
 * Pegawai dan akun pengguna adalah dua entitas terpisah (K-11), jadi kolom
 * "Akun pengguna" boleh dikosongkan. Daftar akun yang ditawarkan hanya yang
 * belum dipakai pegawai lain — satu akun untuk satu pegawai.
 */
export function FormPegawaiModal({
  terbuka,
  onTutup,
  pegawai,
}: {
  terbuka: boolean;
  onTutup: () => void;
  pegawai: Pegawai | null;
}) {
  const { data: bagian } = useBagian();
  const { data: akun } = useAkunTersedia(pegawai?.id);
  const simpan = useSimpanPegawai();
  const toast = useToast();

  const [isian, setIsian] = useState<IsianPegawai>(kosong());
  const [galat, setGalat] = useState<Record<string, string>>({});
  const [galatUmum, setGalatUmum] = useState<string | null>(null);

  useEffect(() => {
    if (!terbuka) return;
    setIsian(
      pegawai
        ? {
            nama: pegawai.nama,
            nip: pegawai.nip ?? '',
            jabatan: pegawai.jabatan ?? '',
            bagian_id: pegawai.bagian?.id ?? null,
            user_id: pegawai.user?.id ?? null,
            status: pegawai.status,
          }
        : kosong(),
    );
    setGalat({});
    setGalatUmum(null);
  }, [terbuka, pegawai]);

  const set = <K extends keyof IsianPegawai>(k: K, v: IsianPegawai[K]) =>
    setIsian((s) => ({ ...s, [k]: v }));

  const kirim = async () => {
    const g: Record<string, string> = {};
    if (!isian.nama.trim()) g.nama = 'Nama lengkap wajib diisi';
    if (!isian.bagian_id) g.bagian_id = 'Bagian wajib dipilih';
    setGalat(g);
    if (Object.keys(g).length) return;

    setGalatUmum(null);
    try {
      await simpan.mutateAsync({ id: pegawai?.id, isian });
      toast.sukses(pegawai ? 'Data pegawai diperbarui' : 'Pegawai baru ditambahkan');
      onTutup();
    } catch (e) {
      const perField = errorField(e);
      if (Object.keys(perField).length) setGalat(perField);
      else setGalatUmum(pesanError(e));
      toast.galat('Data pegawai gagal disimpan', pesanError(e));
    }
  };

  /* Akun yang sedang terpasang harus tetap muncul walau sudah "terpakai". */
  const opsiAkun = [
    { nilai: '', label: 'Tanpa akun pengguna' },
    ...(pegawai?.user
      ? [{ nilai: String(pegawai.user.id), label: pegawai.user.username }]
      : []),
    ...(akun ?? [])
      .filter((a) => a.id !== pegawai?.user?.id)
      .map((a) => ({ nilai: String(a.id), label: a.username, keterangan: a.nama })),
  ];

  return (
    <Modal
      terbuka={terbuka}
      onTutup={onTutup}
      judul={pegawai ? 'Ubah Pegawai' : 'Tambah Pegawai'}
      keterangan="Data pegawai menjadi sumber daftar penerima disposisi dan PIC surat."
      footer={
        <>
          <Button onClick={onTutup}>Batal</Button>
          <Button ragam="utama" onClick={kirim} disabled={simpan.isPending}>
            {simpan.isPending ? 'Menyimpan…' : 'Simpan'}
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field label="Nama lengkap" wajib galat={galat.nama} className="sm:col-span-2">
          {(p) => (
            <Input
              {...p}
              value={isian.nama}
              onChange={(e) => set('nama', e.target.value)}
              placeholder="Budi Santoso"
            />
          )}
        </Field>

        <Field label="NIP" galat={galat.nip}>
          {(p) => (
            <Input
              {...p}
              value={isian.nip}
              onChange={(e) => set('nip', e.target.value)}
              placeholder="20190114"
              inputMode="numeric"
            />
          )}
        </Field>

        <Field label="Jabatan" galat={galat.jabatan}>
          {(p) => (
            <Input
              {...p}
              value={isian.jabatan}
              onChange={(e) => set('jabatan', e.target.value)}
              placeholder="Staf Keuangan"
            />
          )}
        </Field>

        <Field label="Bagian" wajib galat={galat.bagian_id}>
          {(p) => (
            <Select
              id={p.id}
              aria-invalid={Boolean(galat.bagian_id)}
              nilai={isian.bagian_id ? String(isian.bagian_id) : undefined}
              onUbah={(v) => set('bagian_id', Number(v))}
              placeholder="Pilih bagian"
              opsi={(bagian ?? []).map((b) => ({
                nilai: String(b.id),
                label: `${b.kode} — ${b.nama}`,
              }))}
            />
          )}
        </Field>

        <Field
          label="Akun pengguna"
          keterangan="Hanya pegawai berakun aktif yang dapat menerima disposisi"
        >
          {(p) => (
            <Select
              id={p.id}
              nilai={isian.user_id ? String(isian.user_id) : ''}
              onUbah={(v) => set('user_id', v ? Number(v) : null)}
              opsi={opsiAkun}
            />
          )}
        </Field>

        <Field label="Status">
          {(p) => (
            <Select
              id={p.id}
              nilai={isian.status}
              onUbah={(v) => set('status', v as StatusAktif)}
              opsi={[
                { nilai: 'aktif', label: 'Aktif' },
                { nilai: 'nonaktif', label: 'Nonaktif' },
              ]}
            />
          )}
        </Field>

        {galatUmum ? (
          <p
            role="alert"
            className="rounded-control border border-st-merah-br bg-st-merah-bg px-3 py-2 text-label text-st-merah-fg sm:col-span-2"
          >
            {galatUmum}
          </p>
        ) : null}
      </div>
    </Modal>
  );
}

function kosong(): IsianPegawai {
  return { nama: '', nip: '', jabatan: '', bagian_id: null, user_id: null, status: 'aktif' };
}
