import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { KeyRound, LogOut, User as UserIkon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/auth-context';
import type { User } from '@/types';

/**
 * Overlay Menu Akun. Di Figma sempat digambar sebagai layar tersendiri
 * (layar 25) lalu dipensiunkan menjadi overlay, supaya avatar berfungsi
 * di semua layar — itu yang ditiru di sini.
 */
export function MenuAkun({ user }: { user: User }) {
  const navigate = useNavigate();
  const { keluar } = useAuth();

  const inisial = user.nama
    .split(' ')
    .slice(0, 2)
    .map((k) => k[0])
    .join('')
    .toUpperCase();

  const panggilan = `${user.nama.split(' ')[0]} (${user.role === 'admin' ? 'Admin' : 'Pegawai'})`;

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger className="flex items-center gap-2.5 rounded-control py-1 pl-1 pr-2 transition-colors hover:bg-surface-muted">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-muted text-label font-semibold text-ink-muted">
          {inisial}
        </span>
        <span className="text-label text-ink-muted">{panggilan}</span>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className="z-50 w-[240px] overflow-hidden rounded-card border border-line bg-surface p-1 shadow-pop animate-pop-in"
        >
          <div className="px-3 py-2.5">
            <p className="truncate text-sm font-semibold text-ink">{user.nama}</p>
            <p className="mt-0.5 truncate text-note text-ink-subtle">
              {user.role === 'admin' ? 'Admin' : 'Pegawai'}
              {user.bagian ? ` · Bagian ${user.bagian.nama}` : ''}
            </p>
          </div>
          <div className="my-1 h-px bg-line" />

          <Item ikon={<UserIkon size={14} />} onPilih={() => navigate('/profil')}>
            Profil Saya
          </Item>
          <Item ikon={<KeyRound size={14} />} onPilih={() => navigate('/ubah-kata-sandi')}>
            Ubah Kata Sandi
          </Item>

          <div className="my-1 h-px bg-line" />
          <Item
            ikon={<LogOut size={14} />}
            bahaya
            onPilih={async () => {
              await keluar();
              navigate('/login', { replace: true });
            }}
          >
            Keluar
          </Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

function Item({
  ikon,
  children,
  onPilih,
  bahaya,
}: {
  ikon: React.ReactNode;
  children: React.ReactNode;
  onPilih: () => void;
  bahaya?: boolean;
}) {
  return (
    <DropdownMenu.Item
      onSelect={onPilih}
      className={[
        'flex cursor-pointer items-center gap-2.5 rounded-control px-3 py-2 text-base outline-none',
        'transition-colors data-[highlighted]:bg-surface-muted',
        bahaya ? 'text-st-merah-fg' : 'text-ink',
      ].join(' ')}
    >
      {ikon}
      {children}
    </DropdownMenu.Item>
  );
}
