import { NavLink, Outlet } from 'react-router-dom';
import { cn } from '@/lib/cn';

const TAB = [
  { ke: '/master/pengguna', label: 'Pengguna' },
  { ke: '/master/pegawai', label: 'Pegawai' },
  { ke: '/master/bagian', label: 'Bagian' },
  { ke: '/master/jenis-surat', label: 'Jenis Surat' },
  { ke: '/master/template', label: 'Template' },
  { ke: '/master/penomoran', label: 'Aturan Penomoran' },
];

/**
 * Enam halaman master berbagi satu baris tab (layar 13–16, 21, 22).
 * Tab berupa route sungguhan, bukan keadaan komponen, supaya setiap halaman
 * punya alamatnya sendiri dan bisa ditautkan langsung.
 */
export function MasterLayout() {
  return (
    <>
      <nav className="mb-6 flex flex-wrap items-center gap-1 border-b border-line">
        {TAB.map((t) => (
          <NavLink
            key={t.ke}
            to={t.ke}
            className={({ isActive }) =>
              cn(
                'relative -mb-px px-3.5 pb-3 pt-1 text-base transition-colors duration-150',
                isActive
                  ? 'font-semibold text-ink'
                  : 'text-ink-muted hover:text-ink',
              )
            }
          >
            {({ isActive }) => (
              <>
                {t.label}
                {isActive ? (
                  <span
                    className="absolute inset-x-2 bottom-0 h-0.5 rounded-t bg-accent"
                    aria-hidden
                  />
                ) : null}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <Outlet />
    </>
  );
}
