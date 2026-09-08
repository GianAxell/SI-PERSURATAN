import { useEffect, useState } from 'react';
import { Outlet, useMatches } from 'react-router-dom';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { useAuth } from '@/features/auth/auth-context';
import { cn } from '@/lib/cn';

/** Judul topbar diambil dari `handle.judul` pada definisi route. */
interface HandleRoute {
  judul?: string;
}

const KUNCI_SIDEBAR = 'sip.sidebar-tertutup';
const BATAS_SEMPIT = 1280;

export function AppLayout() {
  const { user } = useAuth();
  const matches = useMatches();

  const [tertutup, setTertutup] = useState(() => {
    try {
      const tersimpan = localStorage.getItem(KUNCI_SIDEBAR);
      if (tersimpan !== null) return tersimpan === '1';
    } catch {
      /* abaikan */
    }
    return window.innerWidth < BATAS_SEMPIT;
  });

  /*
    Di bawah 1280px sidebar menutup sendiri (§3 Rencana Frontend). Pilihan
    manual pengguna tetap dihormati selama layarnya masih lebar — yang
    dipaksa hanyalah arah "menyempit".
  */
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth < BATAS_SEMPIT) setTertutup(true);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const toggle = () => {
    setTertutup((v) => {
      const baru = !v;
      try {
        localStorage.setItem(KUNCI_SIDEBAR, baru ? '1' : '0');
      } catch {
        /* abaikan */
      }
      return baru;
    });
  };

  if (!user) return null;

  const judul =
    [...matches].reverse().find((m) => (m.handle as HandleRoute | undefined)?.judul)
      ?.handle as HandleRoute | undefined;

  return (
    <div className="min-h-screen bg-bg">
      <Sidebar role={user.role} tertutup={tertutup} onToggle={toggle} />

      <div
        className={cn(
          'flex min-h-screen flex-col transition-[padding] duration-200 ease-out',
          tertutup ? 'pl-sidebar-mini' : 'pl-sidebar',
        )}
      >
        <Topbar
          judul={judul?.judul ?? 'Sistem Informasi Persuratan'}
          user={user}
          tertutup={tertutup}
          onToggle={toggle}
        />
        <main className="flex-1">
          <div className="konten">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
