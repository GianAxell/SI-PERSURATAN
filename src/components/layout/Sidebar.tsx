import { NavLink } from 'react-router-dom';
import { Database, FileOutput, History, Inbox, PanelLeft, Send } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Logo } from './Logo';
import type { Role } from '@/types';

interface ItemMenu {
  ke: string;
  label: string;
  Ikon: typeof Inbox;
}

const MENU: Record<Role, ItemMenu[]> = {
  admin: [
    { ke: '/surat-masuk', label: 'Surat Masuk', Ikon: Inbox },
    { ke: '/disposisi', label: 'Disposisi', Ikon: Send },
    { ke: '/surat-keluar', label: 'Surat Keluar', Ikon: FileOutput },
    { ke: '/master', label: 'Data Master', Ikon: Database },
  ],
  pegawai: [
    { ke: '/disposisi-saya', label: 'Disposisi Saya', Ikon: Inbox },
    { ke: '/riwayat', label: 'Riwayat Disposisi', Ikon: History },
  ],
};

export function Sidebar({
  role,
  tertutup,
  onToggle,
}: {
  role: Role;
  tertutup: boolean;
  onToggle: () => void;
}) {
  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-30 flex flex-col bg-nav',
        'transition-[width] duration-200 ease-out',
        tertutup ? 'w-sidebar-mini' : 'w-sidebar',
      )}
    >
      {/* kepala */}
      <div
        className={cn(
          'flex h-[78px] items-center gap-3',
          tertutup ? 'justify-center px-0' : 'pl-[22px] pr-3',
        )}
      >
        <Logo ukuran={32} />
        {!tertutup ? (
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-bold leading-tight text-white">
              SI PERSURATAN
            </p>
            <p className="truncate text-note leading-tight text-nav-subtle">
              PT Metanouva Informatika
            </p>
          </div>
        ) : null}
        {!tertutup ? (
          <button
            type="button"
            onClick={onToggle}
            aria-label="Tutup menu"
            className="-mr-2 rounded-control p-1.5 text-nav-text transition-colors hover:bg-nav-active hover:text-white"
          >
            <PanelLeft size={16} />
          </button>
        ) : null}
      </div>

      <div className={cn('h-px bg-nav-active', tertutup ? 'mx-4' : 'mx-6')} />

      {/* menu */}
      <nav className="flex flex-col gap-2 py-3.5">
        {MENU[role].map((item) => (
          <ItemNav key={item.ke} item={item} tertutup={tertutup} />
        ))}
      </nav>

      {tertutup ? (
        <button
          type="button"
          onClick={onToggle}
          aria-label="Buka menu"
          className="mx-auto mt-auto mb-4 rounded-control p-2 text-nav-text transition-colors hover:bg-nav-active hover:text-white"
        >
          <PanelLeft size={16} />
        </button>
      ) : null}
    </aside>
  );
}

function ItemNav({ item, tertutup }: { item: ItemMenu; tertutup: boolean }) {
  const { ke, label, Ikon } = item;
  return (
    <NavLink
      to={ke}
      title={tertutup ? label : undefined}
      className={({ isActive }) =>
        cn(
          'relative mx-3 flex items-center gap-3 rounded-control transition-colors duration-150',
          tertutup ? 'h-11 justify-center' : 'h-9 px-4',
          isActive
            ? 'bg-nav-active text-white'
            : 'text-nav-text hover:bg-nav-active/60 hover:text-white',
        )
      }
    >
      {({ isActive }) => (
        <>
          {/*
            Penanda oranye menempel di tepi kiri sidebar, bukan di tepi item.
            Karena itu ia digeser keluar sejauh margin item (12px).
          */}
          {isActive ? (
            <span
              className="absolute -left-3 top-0 h-full w-[3px] rounded-r-[2px] bg-accent"
              aria-hidden
            />
          ) : null}
          {/*
            Figma memakai dua tampilan berbeda, bukan satu tampilan yang
            menyusut: sidebar terbuka menampilkan teks saja (layar 02),
            sidebar tertutup menampilkan ikon saja (layar 20 dan 28).
          */}
          {tertutup ? (
            <Ikon size={16} className="shrink-0" />
          ) : (
            <span className={cn('truncate text-sm', isActive && 'font-semibold')}>
              {label}
            </span>
          )}
        </>
      )}
    </NavLink>
  );
}
