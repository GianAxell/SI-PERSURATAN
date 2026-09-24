import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ambil, ambilHalaman, kirim } from '@/lib/api';
import type { Halaman, SuratKeluar } from '@/types';

export interface FilterSuratKeluar {
  q: string;
  tahun: string | null;
  bagian_id: number | null;
  jenis_surat_id: number | null;
  page: number;
  limit: number;
}

export const filterAwalKeluar: FilterSuratKeluar = {
  q: '',
  tahun: null,
  bagian_id: null,
  jenis_surat_id: null,
  page: 1,
  limit: 10,
};

function bersih(f: FilterSuratKeluar) {
  return Object.fromEntries(
    Object.entries(f).filter(([, v]) => v !== null && v !== '' && v !== undefined),
  );
}

export function useSuratKeluar(filter: FilterSuratKeluar) {
  return useQuery({
    queryKey: ['surat-keluar', bersih(filter)],
    queryFn: () =>
      ambilHalaman<SuratKeluar>('/surat-keluar', bersih(filter)) as Promise<
        Halaman<SuratKeluar>
      >,
    placeholderData: (sebelumnya) => sebelumnya,
  });
}

export function useSuratKeluarDetail(id: string | undefined) {
  return useQuery({
    queryKey: ['surat-keluar', 'detail', id],
    queryFn: () => ambil<SuratKeluar>(`/surat-keluar/${id}`),
    enabled: Boolean(id),
  });
}

export interface IsianSuratKeluar {
  template_id: number;
  tanggal_surat: string;
  kepada: string;
  perihal: string;
  pic: string | null;
  data_dinamis: Record<string, unknown>;
}

/**
 * Nomor surat baru terbit di sini, bukan saat pratinjau (K-7). Karena itu
 * mutasi ini yang menandai akhir wizard — bukan langkah 3 yang membukanya.
 */
export function useBuatSuratKeluar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (isian: IsianSuratKeluar) => kirim<SuratKeluar>('/surat-keluar', isian),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['surat-keluar'] });
      /* Nomor urut berjalan ikut naik, jadi layar 16 perlu disegarkan. */
      queryClient.invalidateQueries({ queryKey: ['master', 'penomoran'] });
      queryClient.invalidateQueries({ queryKey: ['surat-masuk'] });
    },
  });
}
