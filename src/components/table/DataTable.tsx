import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from '@tanstack/react-table';
import { cn } from '@/lib/cn';
import { Skeleton } from '@/components/ui/Skeleton';
import { Pagination } from '@/components/ui/Pagination';
import type { Meta } from '@/types';

/**
 * Tabel daftar (layar 02, 07, 13, 19, 21, 22 …).
 *
 * Lebar kolom ditulis sebagai persentase lewat `meta.lebar`, bukan piksel,
 * supaya tabel ikut lebar layar. Kolom yang isinya berukuran pasti — nomor
 * agenda, status, aksi — memakai `meta.tetap` agar tidak ikut memuai.
 */

export interface MetaKolom {
  lebar?: string;
  tetap?: number;
  rata?: 'kiri' | 'kanan' | 'tengah';
  /**
   * Sembunyikan kolom di bawah 1280px. Dipakai untuk kolom pelengkap saja —
   * di lebar kerja terkecil, jumlah kolom yang muat lebih sedikit daripada
   * yang enak dilihat di 1440px, dan tabel yang menggeser mendatar membuat
   * kolom terakhir terpotong tanpa tanda apa pun bahwa ia bisa digeser.
   */
  sembunyiSempit?: boolean;
}

declare module '@tanstack/react-table' {
  interface ColumnMeta<TData extends unknown, TValue> extends MetaKolom {}
}

export function DataTable<T>({
  kolom,
  data,
  meta,
  memuat,
  onPindahHalaman,
  onKlikBaris,
  satuan = 'data',
  kosong,
  jumlahBarisSkeleton = 9,
}: {
  kolom: ColumnDef<T, any>[];
  data: T[];
  meta?: Meta;
  memuat?: boolean;
  onPindahHalaman?: (halaman: number) => void;
  onKlikBaris?: (baris: T) => void;
  satuan?: string;
  kosong?: React.ReactNode;
  jumlahBarisSkeleton?: number;
}) {
  const table = useReactTable({
    data,
    columns: kolom,
    getCoreRowModel: getCoreRowModel(),
  });

  const kosongTampil = !memuat && data.length === 0;

  return (
    <div className="overflow-hidden rounded-card border border-line bg-surface shadow-card">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] border-collapse text-base">
          <thead>
            {table.getHeaderGroups().map((grup) => (
              <tr key={grup.id} className="h-11 bg-surface-muted">
                {grup.headers.map((header) => {
                  const m = header.column.columnDef.meta;
                  return (
                    <th
                      key={header.id}
                      style={{ width: m?.lebar, minWidth: m?.tetap }}
                      className={cn(
                        'whitespace-nowrap px-6 text-label font-medium text-ink-muted',
                        m?.sembunyiSempit && 'hidden xl:table-cell',
                        m?.rata === 'kanan'
                          ? 'text-right'
                          : m?.rata === 'tengah'
                            ? 'text-center'
                            : 'text-left',
                      )}
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>

          <tbody>
            {memuat
              ? Array.from({ length: jumlahBarisSkeleton }).map((_, i) => (
                  <tr key={i} className="h-[54px] border-t border-line">
                    {table.getAllLeafColumns().map((k) => (
                      <td
                        key={k.id}
                        className={cn(
                          'px-6',
                          k.columnDef.meta?.sembunyiSempit && 'hidden xl:table-cell',
                        )}
                      >
                        <Skeleton className="h-2.5 w-full max-w-[160px]" />
                      </td>
                    ))}
                  </tr>
                ))
              : table.getRowModel().rows.map((baris) => (
                  <tr
                    key={baris.id}
                    onClick={onKlikBaris ? () => onKlikBaris(baris.original) : undefined}
                    className={cn(
                      'h-[54px] border-t border-line transition-colors',
                      onKlikBaris && 'cursor-pointer hover:bg-surface-muted',
                    )}
                  >
                    {baris.getVisibleCells().map((sel) => {
                      const m = sel.column.columnDef.meta;
                      return (
                        <td
                          key={sel.id}
                          className={cn(
                            'px-6 py-2 text-ink',
                            m?.sembunyiSempit && 'hidden xl:table-cell',
                            m?.rata === 'kanan'
                              ? 'text-right'
                              : m?.rata === 'tengah'
                                ? 'text-center'
                                : 'text-left',
                          )}
                        >
                          {flexRender(sel.column.columnDef.cell, sel.getContext())}
                        </td>
                      );
                    })}
                  </tr>
                ))}
          </tbody>
        </table>
      </div>

      {kosongTampil ? <div className="border-t border-line">{kosong}</div> : null}

      {meta && onPindahHalaman && !kosongTampil ? (
        <Pagination meta={meta} onPindah={onPindahHalaman} satuan={satuan} />
      ) : null}
    </div>
  );
}
