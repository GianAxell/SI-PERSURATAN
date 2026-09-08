import { Hammer } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';

/**
 * Penanda layar yang belum dibangun. Ditulis dengan nomor layar Figma-nya
 * supaya jelas apa yang akan mengisi tempat ini, bukan sekadar "coming soon".
 */
export function Placeholder({ layar, nama }: { layar: string; nama: string }) {
  return (
    <Card>
      <EmptyState
        ikon={<Hammer size={20} />}
        judul={nama}
        keterangan={`Layar ${layar} pada prototype Figma. Fondasi tampilan sudah siap; halaman ini dibangun pada tahap berikutnya.`}
      />
    </Card>
  );
}
