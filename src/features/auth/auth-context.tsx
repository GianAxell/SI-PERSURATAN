import { createContext, use, useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ambil, ambilToken, hapusToken, kirim, simpanToken } from '@/lib/api';
import type { User } from '@/types';

interface HasilLogin {
  token: string;
  user: User;
}

interface NilaiAuth {
  user: User | null;
  memuat: boolean;
  masuk: (username: string, password: string) => Promise<User>;
  keluar: () => Promise<void>;
}

const KonteksAuth = createContext<NilaiAuth | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();

  /*
   * Token ada di localStorage, tetapi identitas pengguna selalu ditanyakan
   * ulang ke server. Token yang sudah kedaluwarsa akan dijawab 401 oleh
   * interceptor dan pengguna dilempar ke halaman login — jadi tidak ada
   * keadaan "seolah masih masuk" yang bertahan di layar.
   */
  const { data, isPending } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => ambil<User>('/auth/me'),
    enabled: Boolean(ambilToken()),
    retry: false,
    staleTime: 5 * 60_000,
  });

  const masuk = useCallback(
    async (username: string, password: string) => {
      const hasil = await kirim<HasilLogin>('/auth/login', { username, password });
      simpanToken(hasil.token);
      queryClient.setQueryData(['auth', 'me'], hasil.user);
      return hasil.user;
    },
    [queryClient],
  );

  const keluar = useCallback(async () => {
    try {
      await kirim('/auth/logout');
    } catch {
      /* kalau server tidak menjawab, sesi lokal tetap harus dibersihkan */
    }
    hapusToken();
    queryClient.clear();
  }, [queryClient]);

  const nilai = useMemo<NilaiAuth>(
    () => ({
      user: data ?? null,
      memuat: Boolean(ambilToken()) && isPending,
      masuk,
      keluar,
    }),
    [data, isPending, masuk, keluar],
  );

  return <KonteksAuth value={nilai}>{children}</KonteksAuth>;
}

export function useAuth() {
  const nilai = use(KonteksAuth);
  if (!nilai) throw new Error('useAuth harus dipakai di dalam <AuthProvider>');
  return nilai;
}

/** Halaman awal setiap role (K-1: tidak ada dashboard). */
export function berandaRole(role: User['role']) {
  return role === 'admin' ? '/surat-masuk' : '/disposisi-saya';
}
