import { useSearchParams } from 'react-router-dom';

/**
 * Pencarian + halaman untuk tabel master, disimpan di query string.
 * Dipakai berulang oleh halaman Pengguna, Pegawai, dan Bagian — bentuknya
 * sama, jadi tidak perlu ditulis tiga kali.
 */
export function useFilterTabel() {
  const [params, setParams] = useSearchParams();

  const q = params.get('q') ?? '';
  const page = Number(params.get('page') ?? 1);

  const setQ = (nilai: string) => {
    const baru = new URLSearchParams();
    if (nilai) baru.set('q', nilai);
    setParams(baru);
  };

  const setPage = (nilai: number) => {
    const baru = new URLSearchParams(params);
    if (nilai > 1) baru.set('page', String(nilai));
    else baru.delete('page');
    setParams(baru);
  };

  const bersihkan = () => setParams(new URLSearchParams());

  return { q, page, setQ, setPage, bersihkan };
}
