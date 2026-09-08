import { Navigate } from 'react-router-dom';
import { berandaRole, useAuth } from '@/features/auth/auth-context';

/**
 * Tidak ada dashboard (K-1). Setelah masuk, Admin diarahkan ke daftar surat
 * masuk dan Pegawai ke disposisi miliknya.
 */
export function BerandaRedirect() {
  const { user } = useAuth();
  if (!user) return null;
  return <Navigate to={berandaRole(user.role)} replace />;
}
