import { PanelLeft } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { cn } from '@/lib/cn';
import type { ApiSuccess, Notifikasi, User } from '@/types';
import { MenuAkun } from './MenuAkun';
import { NotifikasiPanel } from './NotifikasiPanel';

export function Topbar({
  judul,
  user,
  tertutup,
  onToggle,
}: {
  judul: string;
  user: User;
  tertutup: boolean;
  onToggle: () => void;
}) {
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ['notifikasi'],
    queryFn: async () => {
      const res = await api.get<ApiSuccess<Notifikasi[]> & { meta?: { belum_dibaca?: number } }>(
        '/notifikasi',
        { params: { limit: 10 } },
      );
      return {
        daftar: res.data.data,
        belumDibaca: res.data.meta?.belum_dibaca ?? 0,
      };
    },
    refetchInterval: 60_000,
  });

  const tandaiSemua = useMutation({
    mutationFn: () => api.patch('/notifikasi/baca-semua'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifikasi'] }),
  });

  const pegawai = user.role === 'pegawai';

  return (
    <header
      className={cn(
        'sticky top-0 z-20 flex h-topbar items-center gap-4',
        'border-b border-line bg-surface px-8',
      )}
    >
      {tertutup ? (
        <button
          type="button"
          onClick={onToggle}
          aria-label="Buka menu"
          className="-ml-2 rounded-control p-2 text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink"
        >
          <PanelLeft size={16} />
        </button>
      ) : null}

      <h1 className="min-w-0 flex-1 truncate text-page font-semibold text-ink">{judul}</h1>

      <div className="flex shrink-0 items-center gap-1">
        <NotifikasiPanel
          daftar={data?.daftar ?? []}
          belumDibaca={data?.belumDibaca ?? 0}
          onTandaiSemua={() => tandaiSemua.mutate()}
          tautanSemua={pegawai ? '' : '/surat-masuk'}
          labelSemua={pegawai ? '' : 'Lihat semua surat masuk'}
        />
        <MenuAkun user={user} />
      </div>
    </header>
  );
}
