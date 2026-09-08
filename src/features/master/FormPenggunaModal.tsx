import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { useToast } from '@/components/ui/Toast';
import { errorField, pesanError } from '@/lib/api';
import { useAuth } from '@/features/auth/auth-context';
import type { Role, StatusAktif, User } from '@/types';
import { useBagian, useSimpanUser, useUbahStatusUser, type IsianUser } from './api';

/** Layar 23 Form Tambah / Ubah Pengguna, dan layar 24 konfirmasinya. */
export function FormPenggunaModal({
  terbuka,
  onTutup,
  user,
}: {
  terbuka: boolean;
  onTutup: () => void;
  user: User | null;
}) {
  const { user: sayaSendiri } = useAuth();
  const toast = useToast();
  const { data: bagian } = useBagian();
  const simpan = useSimpanUser();
  const ubahStatus = useUbahStatusUser();

  const [isian, setIsian] = useState<IsianUser>(kosong());
  const [password, setPassword] = useState('');
  const [ulangi, setUlangi] = useState('');
  const [galat, setGalat] = useState<Record<string, string>>({});
  const [galatUmum, setGalatUmum] = useState<string | null>(null);
  const [konfirmasi, setKonfirmasi] = useState(false);

  /*
   * Admin tidak boleh menonaktifkan atau menurunkan role akunnya sendiri —
   * server menolaknya (409). Aturan itu sudah bisa diketahui sebelum tombol
   * ditekan, jadi kolomnya dikunci di sini, bukan dibiarkan dicoba lalu
   * ditolak. Penguncian di klien hanya kenyamanan; server tetap penjaganya.
   */
  const akunSendiri = Boolean(user && sayaSendiri && user.id === sayaSendiri.id);

  useEffect(() => {
    if (!terbuka) return;
    setIsian(
      user
        ? {
            nama: user.nama,
            username: user.username,
            role: user.role,
            jabatan: user.jabatan ?? '',
            bagian_id: user.bagian?.id ?? null,
            status: user.status,
          }
        : kosong(),
    );
    setPassword('');
    setUlangi('');
    setGalat({});
    setGalatUmum(null);
  }, [terbuka, user]);

  const set = <K extends keyof IsianUser>(kunci: K, nilai: IsianUser[K]) =>
    setIsian((v) => ({ ...v, [kunci]: nilai }));

  const kirim = async () => {
    const g: Record<string, string> = {};
    if (!isian.nama.trim()) g.nama = 'Nama lengkap wajib diisi';
    if (!isian.username.trim()) g.username = 'Nama pengguna wajib diisi';

    /* Pada pengguna baru password wajib; saat mengubah, kosong berarti
       kata sandi lama dipertahankan (layar 23). */
    if (!user && !password) g.password_awal = 'Kata sandi awal wajib diisi';
    if (password && password.length < 8) g.password_awal = 'Minimal delapan karakter';
    if (password && password !== ulangi) g.ulangi = 'Ulangan kata sandi tidak sama';

    setGalat(g);
    if (Object.keys(g).length) return;

    setGalatUmum(null);
    try {
      await simpan.mutateAsync({
        id: user?.id,
        isian: { ...isian, password_awal: password || undefined },
      });
      toast.sukses(user ? 'Data pengguna diperbarui' : 'Pengguna baru ditambahkan');
      onTutup();
    } catch (e) {
      const perField = errorField(e);
      if (Object.keys(perField).length) setGalat(perField);
      else setGalatUmum(pesanError(e));
      toast.galat('Data pengguna gagal disimpan', pesanError(e));
    }
  };

  const nonaktifkan = async () => {
    if (!user) return;
    try {
      await ubahStatus.mutateAsync({ id: user.id, status: 'nonaktif' });
      setKonfirmasi(false);
      toast.sukses(
        'Pengguna dinonaktifkan',
        `${user.nama} tidak dapat masuk lagi. Surat dan disposisi lamanya tetap tersimpan.`,
      );
      onTutup();
    } catch (e) {
      setGalatUmum(pesanError(e));
      setKonfirmasi(false);
      toast.galat('Pengguna gagal dinonaktifkan', pesanError(e));
    }
  };

  return (
    <>
      <Modal
        terbuka={terbuka}
        onTutup={onTutup}
        judul={user ? 'Ubah Pengguna' : 'Tambah Pengguna'}
        keterangan="Akun dipakai untuk masuk ke sistem. Role menentukan menu yang terlihat."
        footer={
          <>
            {user && user.status === 'aktif' && !akunSendiri ? (
              <Button
                ragam="bahaya"
                className="mr-auto"
                onClick={() => setKonfirmasi(true)}
              >
                Nonaktifkan pengguna
              </Button>
            ) : null}
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

          <Field label="Nama pengguna" wajib galat={galat.username}>
            {(p) => (
              <Input
                {...p}
                value={isian.username}
                onChange={(e) => set('username', e.target.value)}
                placeholder="budi.santoso"
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

          <Field
            label={user ? 'Kata sandi baru' : 'Kata sandi awal'}
            wajib={!user}
            galat={galat.password_awal}
            keterangan={user ? 'Kosongkan bila tidak diubah' : 'Minimal delapan karakter'}
          >
            {(p) => (
              <Input
                {...p}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
              />
            )}
          </Field>

          <Field label="Ulangi kata sandi" galat={galat.ulangi}>
            {(p) => (
              <Input
                {...p}
                type="password"
                value={ulangi}
                onChange={(e) => setUlangi(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
              />
            )}
          </Field>

          <Field label="Role" wajib>
            {(p) => (
              <Select
                id={p.id}
                nilai={isian.role}
                onUbah={(v) => set('role', v as Role)}
                disabled={akunSendiri}
                opsi={[
                  { nilai: 'admin', label: 'Admin' },
                  { nilai: 'pegawai', label: 'Pegawai' },
                ]}
              />
            )}
          </Field>

          <Field label="Bagian">
            {(p) => (
              <Select
                id={p.id}
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
            label="Status"
            keterangan={
              akunSendiri ? 'Akun yang sedang dipakai tidak dapat dinonaktifkan' : undefined
            }
          >
            {(p) => (
              <Select
                id={p.id}
                nilai={isian.status}
                onUbah={(v) => set('status', v as StatusAktif)}
                disabled={akunSendiri}
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

      <ConfirmDialog
        terbuka={konfirmasi}
        onTutup={() => setKonfirmasi(false)}
        onSetuju={nonaktifkan}
        judul="Nonaktifkan pengguna ini?"
        labelSetuju="Nonaktifkan"
        bahaya
        sedangProses={ubahStatus.isPending}
        keterangan={
          <>
            <p>
              Akun <span className="font-medium text-ink">{user?.nama}</span> tidak lagi
              dapat masuk ke sistem.
            </p>
            <p className="mt-2">
              Surat dan disposisi yang pernah dibuat tetap tersimpan — menonaktifkan bukan
              menghapus.
            </p>
          </>
        }
      />
    </>
  );
}

function kosong(): IsianUser {
  return {
    nama: '',
    username: '',
    role: 'pegawai',
    jabatan: '',
    bagian_id: null,
    status: 'aktif',
  };
}
