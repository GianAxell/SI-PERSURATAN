import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ambil, ambilHalaman, api, kirim, tambal } from '@/lib/api';
import type {
  Halaman,
  PegawaiRef,
  StatusDisposisi,
  SuratMasukDetail,
  SuratMasukRingkas,
} from '@/types';

export interface FilterSuratMasuk {
  q: string;
  status: StatusDisposisi | 'belum_didisposisi' | null;
  tanggal_dari: string | null;
  tanggal_sampai: string | null;
  page: number;
  limit: number;
}

export const filterAwal: FilterSuratMasuk = {
  q: '',
  status: null,
  tanggal_dari: null,
  tanggal_sampai: null,
  page: 1,
  limit: 10, // O-1 kontrak
};

/** Membuang nilai kosong agar URL tidak dipenuhi parameter null. */
function bersih(f: FilterSuratMasuk) {
  return Object.fromEntries(
    Object.entries(f).filter(([, v]) => v !== null && v !== '' && v !== undefined),
  );
}

export function useSuratMasuk(filter: FilterSuratMasuk) {
  return useQuery({
    queryKey: ['surat-masuk', bersih(filter)],
    queryFn: () =>
      ambilHalaman<SuratMasukRingkas>('/surat-masuk', bersih(filter)) as Promise<
        Halaman<SuratMasukRingkas>
      >,
    placeholderData: (sebelumnya) => sebelumnya, // tabel tidak berkedip saat pindah halaman
  });
}

export function useSuratMasukDetail(id: string | undefined) {
  return useQuery({
    queryKey: ['surat-masuk', 'detail', id],
    queryFn: () => ambil<SuratMasukDetail>(`/surat-masuk/${id}`),
    enabled: Boolean(id),
  });
}

export interface IsianSuratMasuk {
  nomor_surat?: string;
  tanggal_surat: string;
  perihal: string;
  pic: string;
  pengirim: string;
  keterangan?: string;
  surat_keluar_id?: number | null;
  jenis_input: 'otomatis' | 'manual';
}

export function useBuatSuratMasuk(onProgress?: (persen: number) => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ isian, berkas }: { isian: IsianSuratMasuk; berkas: File }) => {
      const form = new FormData();
      Object.entries(isian).forEach(([kunci, nilai]) => {
        if (nilai !== undefined && nilai !== null && nilai !== '') {
          form.append(kunci, String(nilai));
        }
      });
      form.append('file', berkas);

      const res = await api.post('/surat-masuk', form, {
        onUploadProgress: (e) => {
          if (!onProgress || !e.total) return;
          onProgress(Math.round((e.loaded / e.total) * 100));
        },
      });
      return res.data.data as SuratMasukDetail;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['surat-masuk'] }),
  });
}

/** Penerima disposisi: pegawai berakun aktif (B-11). */
export function usePegawaiPenerima(q: string) {
  return useQuery({
    queryKey: ['pegawai', 'penerima-disposisi', q],
    queryFn: () =>
      ambil<PegawaiRef[]>('/pegawai/penerima-disposisi', q ? { q } : undefined),
  });
}

export function useBuatDisposisi(suratId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      pegawai_id: number;
      instruksi: string;
      batas_waktu: string | null;
    }) => kirim(`/surat-masuk/${suratId}/disposisi`, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['surat-masuk'] }),
  });
}

export interface SuratKeluarTersedia {
  id: number;
  nomor_surat: string;
  tanggal_surat: string;
  perihal: string;
  kepada: string;
}

export function useSuratKeluarTersedia(q: string) {
  return useQuery({
    queryKey: ['surat-keluar', 'tersedia', q],
    queryFn: () => ambil<SuratKeluarTersedia[]>('/surat-keluar/tersedia', q ? { q } : undefined),
  });
}

export function useTautkanBalasan(suratId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (surat_keluar_id: number) =>
      tambal(`/surat-masuk/${suratId}/surat-balasan`, { surat_keluar_id }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['surat-masuk'] }),
  });
}
