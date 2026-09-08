import { Navigate, useLocation } from 'react-router-dom';
import { berandaRole, useAuth } from '@/features/auth/auth-context';
import type { Role } from '@/types';

/**
 * Penjaga route. Ini hanya untuk kenyamanan tampilan — otorisasi yang
 * sesungguhnya ada di backend (B-8 kontrak), karena penjaga di sisi klien
 * bisa dilewati lewat DevTools.
 */
export function ProtectedRoute({
  roles,
  children,
}: {
  roles?: Role[];
  children: React.ReactNode;
}) {
  const { user, memuat } = useAuth();
  const lokasi = useLocation();

  if (memuat) return <LayarMemuat />;

  if (!user) return <Navigate to="/login" state={{ dari: lokasi.pathname }} replace />;

  if (roles && !roles.includes(user.role)) {
    return <Navigate to={berandaRole(user.role)} replace />;
  }

  return <>{children}</>;
}

function LayarMemuat() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg">
      <p className="text-sm text-ink-subtle">Memuat…</p>
    </div>
  );
}
