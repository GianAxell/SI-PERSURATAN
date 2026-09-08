import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Navigate, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Logo } from '@/components/layout/Logo';
import { pesanError } from '@/lib/api';
import { berandaRole, useAuth } from './auth-context';

const skema = z.object({
  username: z.string().min(1, 'Nama pengguna wajib diisi'),
  password: z.string().min(1, 'Kata sandi wajib diisi'),
});

type Isian = z.infer<typeof skema>;

/** Layar 01 (Login) dan 27 (Data Tidak Sesuai). */
export function LoginPage() {
  const { user, masuk } = useAuth();
  const navigate = useNavigate();
  const [galatMasuk, setGalatMasuk] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Isian>({ resolver: zodResolver(skema) });

  if (user) return <Navigate to={berandaRole(user.role)} replace />;

  const kirim = handleSubmit(async (isian) => {
    setGalatMasuk(null);
    try {
      const hasil = await masuk(isian.username, isian.password);
      navigate(berandaRole(hasil.role), { replace: true });
    } catch (e) {
      setGalatMasuk(pesanError(e, 'Nama pengguna atau kata sandi tidak sesuai'));
    }
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-6 py-12">
      <div className="w-full max-w-[400px] rounded-card border border-line bg-surface px-10 py-10 shadow-card">
        <div className="flex flex-col items-center text-center">
          <Logo ukuran={64} />
          <h1 className="mt-4 text-page font-semibold text-ink">
            Sistem Informasi Persuratan
          </h1>
          <p className="mt-1 text-sm text-ink-muted">PT Metanouva Informatika</p>
        </div>

        <form onSubmit={kirim} className="mt-7 flex flex-col gap-4" noValidate>
          <Field label="Nama pengguna" galat={errors.username?.message}>
            {(p) => (
              <Input
                {...p}
                {...register('username')}
                autoComplete="username"
                autoFocus
                placeholder="nama.pengguna"
              />
            )}
          </Field>

          <Field label="Kata sandi" galat={errors.password?.message}>
            {(p) => (
              <Input
                {...p}
                {...register('password')}
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
              />
            )}
          </Field>

          {/*
            Layar 27. Pesan galat ditaruh di atas tombol, bukan sebagai toast,
            supaya tetap terbaca saat pengguna mengulang isian.
          */}
          {galatMasuk ? (
            <p
              role="alert"
              className="rounded-control border border-st-merah-br bg-st-merah-bg px-3 py-2 text-label text-st-merah-fg"
            >
              {galatMasuk}
            </p>
          ) : null}

          <Button
            type="submit"
            ragam="utama"
            ukuran="form"
            penuh
            disabled={isSubmitting}
            className="mt-2"
          >
            {isSubmitting ? 'Memeriksa…' : 'Masuk'}
          </Button>
        </form>

        <p className="mt-5 text-center text-note text-ink-subtle">
          Akun dibuat oleh Admin melalui menu Data Master
        </p>
      </div>
    </div>
  );
}
