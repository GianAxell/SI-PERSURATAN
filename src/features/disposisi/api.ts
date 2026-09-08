import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ambil, api, tambal } from '@/lib/api';
import type {
  ApiSuccess,
  DisposisiDetail,
  DisposisiSaya,
  MetaDisposisiSaya,
  RiwayatDisposisi,
  StatusDisposisi,
} from '@/types';

export interface FilterDisposisiSaya {
  q: string;
  status: StatusDisposisi | null;
  tanggal_dari: string | null;
  tanggal_sampai: string | null;
  page: number;
  limit: number;
}

export const filterSayaAwal: FilterDisposisiSaya = {
  q: '',
  status: null,
  tanggal_dari: null,
  tanggal_sampai: null,
  page: 1,
  limit: 10,
};

function bersih<T extends object>(f: T) {
  return Object.fromEntries(
    Object.entries(f).filter(([, v]) => v !== null && v !== '' && v !== undefined),
  );
}

/** Layar 17, 19, 36–38. meta membawa hitungan untuk angka pada tab. */
export function useDisposisiSaya(filter: FilterDisposisiSaya) {
  return useQuery({
    queryKey: ['disposisi', 'saya', bersih(filter)],
    queryFn: async () => {
      const res = await api.get<ApiSuccess<DisposisiSaya[]>>('/disposisi/saya', {
        params: bersih(filter),
      });
      return {
        data: res.data.data,
        meta: res.data.meta as MetaDisposisiSaya,
      };
    },
    placeholderData: (sebelumnya) => sebelumnya,
  });
}

export function useDisposisiDetail(id: string | undefined) {
  return useQuery({
    queryKey: ['disposisi', 'detail', id],
    queryFn: () => ambil<DisposisiDetail>(`/disposisi/${id}`),
    enabled: Boolean(id),
  });
}

export function useRiwayatDisposisi(id: number | string | undefined) {
  return useQuery({
    queryKey: ['disposisi', 'riwayat', String(id)],
    queryFn: () => ambil<RiwayatDisposisi[]>(`/disposisi/${id}/riwayat`),
    enabled: Boolean(id),
  });
}

/**
 * Menandai disposisi sudah dibaca (UC-06 langkah 4).
 *
 * Dipanggil sekali saat halaman detail dibuka. React StrictMode menjalankan
 * efek dua kali saat development, tetapi endpoint ini idempotent di server
 * (B-3), jadi tidak perlu penjaga useRef di sini.
 */
export function useTandaiDibaca() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => tambal(`/disposisi/${id}/baca`),
    onSuccess: () => {
      /* Termasuk riwayat: membaca disposisi menambah satu baris jejak (B-6),
         jadi timeline di halaman yang sama harus ikut disegarkan. */
      queryClient.invalidateQueries({ queryKey: ['disposisi'] });
      queryClient.invalidateQueries({ queryKey: ['surat-masuk'] });
      queryClient.invalidateQueries({ queryKey: ['notifikasi'] });
    },
  });
}

export function useUbahStatusDisposisi(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: { status: StatusDisposisi; hasil_tindak_lanjut?: string }) =>
      tambal<DisposisiDetail>(`/disposisi/${id}/status`, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['disposisi'] });
      queryClient.invalidateQueries({ queryKey: ['surat-masuk'] });
    },
  });
}

/* ---------- sisi Admin (layar 06) ---------- */

export interface DisposisiRingkasAdmin {
  id: number;
  status: StatusDisposisi;
  terlambat: boolean;
  instruksi: string;
  batas_waktu: string | null;
  dibuat_pada: string;
  penerima: { id: number; nama: string };
  pemberi: { id: number; nama: string };
  surat: { id: number; nomor_agenda: string; perihal: string };
}

export function useDaftarDisposisi(q: string, page: number, limit = 10) {
  return useQuery({
    queryKey: ['disposisi', 'admin', { q, page, limit }],
    queryFn: async () => {
      const res = await api.get<ApiSuccess<DisposisiRingkasAdmin[]>>('/disposisi', {
        params: bersih({ q, page, limit }),
      });
      return { data: res.data.data, meta: res.data.meta! };
    },
    placeholderData: (sebelumnya) => sebelumnya,
  });
}
