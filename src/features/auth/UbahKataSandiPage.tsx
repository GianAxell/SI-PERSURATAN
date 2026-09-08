import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardBody, CardFooter, CardHeader } from '@/components/ui/Card';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { errorField, pesanError, tambal } from '@/lib/api';

const PANJANG_MINIMAL = 8;

/** Layar 30 Ubah Kata Sandi. */
export function UbahKataSandiPage() {
  const toast = useToast();

  const [lama, setLama] = useState('');
  const [baru, setBaru] = useState('');
  const [ulangi, setUlangi] = useState('');
  const [galat, setGalat] = useState<Record<string, string>>({});
  const [konfirmasi, setKonfirmasi] = useState(false);

  const simpan = useMutation({
    mutationFn: () =>
      tambal('/auth/password', { password_lama: lama, password_baru: baru }),
  });

  /** Pemeriksaan di klien; server tetap memeriksa ulang (B-13). */
  const periksa = () => {
    const g: Record<string, string> = {};
    if (!lama) g.password_lama = 'Kata sandi saat ini wajib diisi';
    if (!baru) g.password_baru = 'Kata sandi baru wajib diisi';
    else if (baru.length < PANJANG_MINIMAL) {
      g.password_baru = `Minimal ${PANJANG_MINIMAL} karakter`;
    } else if (baru === lama) {
      g.password_baru = 'Kata sandi baru harus berbeda dari yang sekarang';
    }
    if (baru && ulangi !== baru) g.ulangi = 'Ulangan kata sandi tidak sama';

    setGalat(g);
    return Object.keys(g).length === 0;
  };

  const kirim = () => {
    if (periksa()) setKonfirmasi(true);
  };

  const jalankan = async () => {
    try {
      await simpan.mutateAsync();
      setKonfirmasi(false);
      setLama('');
      setBaru('');
      setUlangi('');
      setGalat({});
      toast.sukses(
        'Kata sandi berhasil diubah',
        'Gunakan kata sandi baru pada saat masuk berikutnya.',
      );
    } catch (e) {
      setKonfirmasi(false);
      /*
       * "Kata sandi lama tidak sesuai" datang sebagai galat per kolom, jadi
       * ditempelkan ke kolomnya — bukan hanya lewat di pemberitahuan yang
       * hilang sendiri beberapa detik kemudian.
       */
      const perKolom = errorField(e);
      if (Object.keys(perKolom).length) {
        setGalat(perKolom);
        /* Pesan amplop untuk 400 berbunyi "Validasi gagal" — tidak menolong
           siapa pun sebagai judul pemberitahuan. Yang berguna justru sudah
           menempel di kolomnya, jadi pemberitahuan cukup menunjuk ke sana. */
        toast.galat('Kata sandi gagal diubah', 'Periksa kembali kolom yang ditandai merah.');
      } else {
        toast.galat('Kata sandi gagal diubah', pesanError(e));
      }
    }
  };

  return (
    <>
      <Link
        to="/profil"
        className="mb-4 inline-flex items-center gap-1 text-label text-ink-muted transition-colors hover:text-ink"
      >
        <ChevronLeft size={14} />
        Kembali ke profil
      </Link>

      <div className="max-w-[560px]">
        <Card>
          <CardHeader
            judul="Ubah kata sandi"
            keterangan="Demi keamanan, kata sandi saat ini perlu dimasukkan sebelum menetapkan yang baru."
          />
          <CardBody className="flex flex-col gap-5">
            <Field label="Kata sandi saat ini" wajib galat={galat.password_lama}>
              {(p) => (
                <Input
                  {...p}
                  type="password"
                  value={lama}
                  onChange={(e) => setLama(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
              )}
            </Field>

            <Field
              label="Kata sandi baru"
              wajib
              galat={galat.password_baru}
              keterangan={`Minimal ${PANJANG_MINIMAL} karakter, berbeda dari kata sandi sekarang`}
            >
              {(p) => (
                <Input
                  {...p}
                  type="password"
                  value={baru}
                  onChange={(e) => setBaru(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
              )}
            </Field>

            <Field label="Ulangi kata sandi baru" wajib galat={galat.ulangi}>
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
          </CardBody>

          <CardFooter className="justify-end">
            <Button asChild>
              <Link to="/profil">Batal</Link>
            </Button>
            <Button ragam="utama" onClick={kirim} disabled={simpan.isPending}>
              Simpan Kata Sandi
            </Button>
          </CardFooter>
        </Card>
      </div>

      <ConfirmDialog
        terbuka={konfirmasi}
        onTutup={() => setKonfirmasi(false)}
        onSetuju={jalankan}
        sedangProses={simpan.isPending}
        judul="Ubah kata sandi sekarang?"
        labelSetuju="Ya, Ubah Kata Sandi"
        labelBatal="Batal"
        keterangan={
          <>
            Kata sandi lama tidak berlaku lagi setelah perubahan ini disimpan. Pastikan
            kata sandi baru sudah Anda ingat atau catat di tempat yang aman.
          </>
        }
      />
    </>
  );
}
