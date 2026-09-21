import { Link } from 'react-router-dom';
import { KeyRound, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { dapatkanInisial, waktuPanjang } from '@/lib/format';
import { STATUS_AKTIF } from '@/lib/status';
import { useAuth } from './auth-context';

/**
 * Layar 29 Profil Saya.
 *
 * Hanya menampilkan, tidak mengubah. Kontrak tidak menyediakan endpoint
 * untuk pengguna menyunting datanya sendiri — nama, jabatan, bagian, dan
 * role dikelola Admin lewat Data Master Pengguna (K-11). Itu disebutkan
 * terang-terangan di halaman ini supaya pengguna tidak mencari-cari tombol
 * Ubah yang memang tidak ada.
 */
export function ProfilPage() {
  const { user, memuat } = useAuth();

  if (memuat || !user) return <Kerangka />;

  const inisial = dapatkanInisial(user.nama);

  const status = STATUS_AKTIF[user.status];

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      <Card>
        <CardBody>
          <div className="flex items-center gap-4">
            <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-surface-muted text-card font-semibold text-ink-muted">
              {inisial}
            </span>
            <div className="min-w-0">
              <p className="text-page font-semibold text-ink">{user.nama}</p>
              <p className="mt-0.5 text-base text-ink-muted">
                {user.jabatan ?? (user.role === 'admin' ? 'Admin' : 'Pegawai')}
                {user.bagian ? ` · ${user.bagian.nama}` : ''}
              </p>
            </div>
          </div>

          <dl className="mt-7 grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
            <Baris label="Nama lengkap" nilai={user.nama} />
            <Baris label="Nama pengguna" nilai={user.username} tabular />
            <Baris
              label="Role"
              nilai={user.role === 'admin' ? 'Admin' : 'Pegawai'}
            />
            <Baris label="Jabatan" nilai={user.jabatan} />
            <Baris
              label="Bagian"
              nilai={user.bagian ? `${user.bagian.kode} — ${user.bagian.nama}` : null}
            />
            <Baris label="Status akun" nilai={<Badge nada={status.nada}>{status.label}</Badge>} />
            <Baris
              label="Terakhir masuk"
              nilai={user.terakhir_masuk ? waktuPanjang(user.terakhir_masuk) : 'Baru pertama kali'}
              className="sm:col-span-2"
            />
          </dl>
        </CardBody>
      </Card>

      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader judul="Keamanan akun" />
          <CardBody className="flex flex-col gap-4">
            <div className="flex items-start gap-3 rounded-control bg-surface-muted px-3.5 py-3">
              <ShieldCheck size={16} className="mt-px shrink-0 text-ink-subtle" />
              <p className="text-label leading-relaxed text-ink-muted">
                Ganti kata sandi secara berkala, dan jangan memakai kata sandi yang sama
                dengan akun lain.
              </p>
            </div>
            <Button penuh asChild>
              <Link to="/ubah-kata-sandi">
                <KeyRound size={15} />
                Ubah Kata Sandi
              </Link>
            </Button>
          </CardBody>
        </Card>

        <Card>
          <CardHeader judul="Perlu mengubah data?" />
          <CardBody>
            <p className="text-base leading-relaxed text-ink-muted">
              Nama, jabatan, bagian, dan role dikelola oleh Admin melalui menu{' '}
              <span className="text-ink">Data Master › Pengguna</span>. Hubungi Admin bila
              ada data pada halaman ini yang keliru.
            </p>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

function Baris({
  label,
  nilai,
  tabular,
  className,
}: {
  label: string;
  nilai: React.ReactNode;
  tabular?: boolean;
  className?: string;
}) {
  return (
    <div className={className}>
      <dt className="text-label font-medium text-ink-subtle">{label}</dt>
      <dd className={tabular ? 'tabular mt-1 text-base text-ink' : 'mt-1 text-base text-ink'}>
        {nilai || <span className="text-ink-subtle">—</span>}
      </dd>
    </div>
  );
}

function Kerangka() {
  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      <Card>
        <CardBody className="flex flex-col gap-5">
          <div className="flex items-center gap-4">
            <Skeleton className="size-14 rounded-full" />
            <div className="flex flex-col gap-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-5">
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardBody>
      </Card>
      <Card>
        <CardBody className="flex flex-col gap-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardBody>
      </Card>
    </div>
  );
}
