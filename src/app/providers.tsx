import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/features/auth/auth-context';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Daftar surat berubah pelan; menyegarkan tiap kali jendela difokuskan
      // hanya menambah beban tanpa mengubah apa yang dilihat pengguna.
      refetchOnWindowFocus: false,
      staleTime: 30_000,
      retry: (jumlahGagal, error) => {
        // 4xx tidak akan berubah hasilnya kalau diulang
        const status = (error as { response?: { status?: number } })?.response?.status;
        if (status && status >= 400 && status < 500) return false;
        return jumlahGagal < 2;
      },
    },
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>
  );
}
