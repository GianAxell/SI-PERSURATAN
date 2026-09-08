import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardBody, CardFooter, CardHeader } from '@/components/ui/Card';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { pesanError } from '@/lib/api';
import { bulanRomawi, nomorUrut, waktuPanjang } from '@/lib/format';
import { usePenomoran, useSimpanPenomoran } from './api';

/** Layar 16 Data Master Aturan Penomoran (UC-13). */
export function PenomoranPage() {
  const { data, isPending } = usePenomoran();
  const simpan = useSimpanPenomoran();
  const toast = useToast();

  const [pola, setPola] = useState('');
  const [kodePerusahaan, setKodePerusahaan] = useState('');
  const [panjang, setPanjang] = useState(3);
  const [galat, setGalat] = useState<string | null>(null);
  const [tersimpan, setTersimpan] = useState(false);

  useEffect(() => {
    if (!data) return;
    setPola(data.format_nomor);
    setKodePerusahaan(data.kode_perusahaan);
    setPanjang(data.panjang_nomor_urut);
  }, [data]);

  if (isPending || !data) {
    return (
      <Card>
        <CardBody className="flex flex-col gap-3">
          <Skeleton className="h-5 w-56" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-2/3" />
        </CardBody>
      </Card>
    );
  }

  const berubah =
    pola !== data.format_nomor ||
    kodePerusahaan !== data.kode_perusahaan ||
    panjang !== data.panjang_nomor_urut;

  /*
   * Contoh dirangkai dari pola yang sedang diketik, memakai nomor berjalan
   * tahun ini. Bulan dan tahun diambil dari tanggal surat (K-6), di sini
   * diwakili tanggal hari ini sebagai gambaran.
   */
  const tahunIni = data.counter[0];
  const contoh = pola
    .replace('{urut}', nomorUrut((tahunIni?.nomor_terakhir ?? 0) + 1, panjang))
    .replace('{bagian}', 'FIN')
    .replace('{kode}', '03')
    .replace('{perusahaan}', kodePerusahaan || '—')
    .replace('{bulan_romawi}', bulanRomawi(new Date()))
    .replace('{tahun}', String(tahunIni?.tahun ?? new Date().getFullYear()));

  const kirim = async () => {
    setGalat(null);
    if (!pola.includes('{urut}') || !pola.includes('{tahun}')) {
      setGalat('Pola wajib memuat {urut} dan {tahun}');
      return;
    }
    try {
      await simpan.mutateAsync({
        format_nomor: pola,
        kode_perusahaan: kodePerusahaan,
        panjang_nomor_urut: panjang,
      });
      setTersimpan(true);
      setTimeout(() => setTersimpan(false), 2500);
      toast.sukses(
        'Aturan penomoran tersimpan',
        'Surat keluar berikutnya memakai format yang baru.',
      );
    } catch (e) {
      setGalat(pesanError(e));
      toast.galat('Aturan penomoran gagal disimpan', pesanError(e));
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <Card className="h-fit">
        <CardHeader
          judul="Format nomor surat keluar"
          keterangan="Pola disimpan sebagai data, sehingga mengubah format tidak perlu mengubah program."
        />
        <CardBody className="flex flex-col gap-5">
          <Field
            label="Pola"
            keterangan="Penanda yang tersedia: {urut} {bagian} {kode} {perusahaan} {bulan_romawi} {tahun}"
          >
            {(p) => (
              <Input
                {...p}
                value={pola}
                onChange={(e) => setPola(e.target.value)}
                className="font-mono text-sm"
                spellCheck={false}
              />
            )}
          </Field>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Field
              label="Kode perusahaan"
              keterangan="Pernah berubah: M9, lalu MI, kini Digitak"
            >
              {(p) => (
                <Input
                  {...p}
                  value={kodePerusahaan}
                  onChange={(e) => setKodePerusahaan(e.target.value)}
                />
              )}
            </Field>

            <Field label="Panjang nomor urut" keterangan="Jumlah digit, contoh 3 → 001">
              {(p) => (
                <Input
                  {...p}
                  type="number"
                  min={1}
                  max={6}
                  value={panjang}
                  onChange={(e) => setPanjang(Number(e.target.value))}
                />
              )}
            </Field>
          </div>

          <div className="rounded-control bg-surface-muted px-4 py-3">
            <p className="text-label font-medium text-ink-muted">Contoh hasil</p>
            <p className="tabular mt-1 text-card font-semibold text-ink">{contoh}</p>
            <p className="mt-2 text-note text-ink-subtle">
              Bulan dan tahun diambil dari tanggal surat, bukan tanggal sistem.
            </p>
          </div>

          {galat ? (
            <p
              role="alert"
              className="rounded-control border border-st-merah-br bg-st-merah-bg px-3 py-2 text-label text-st-merah-fg"
            >
              {galat}
            </p>
          ) : null}

          {tersimpan ? (
            <p className="rounded-control border border-st-hijau-br bg-st-hijau-bg px-3 py-2 text-label text-st-hijau-fg">
              Perubahan tersimpan.
            </p>
          ) : null}
        </CardBody>

        <CardFooter>
          <Button ragam="utama" onClick={kirim} disabled={!berubah || simpan.isPending}>
            {simpan.isPending ? 'Menyimpan…' : 'Simpan'}
          </Button>
        </CardFooter>
      </Card>

      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader
            judul="Nomor urut berjalan"
            keterangan="Satu urutan untuk seluruh bagian per tahun"
          />
          <CardBody className="flex flex-col gap-3">
            {data.counter.map((c) => (
              <div
                key={c.tahun}
                className="flex items-center justify-between border-b border-line pb-3 last:border-b-0 last:pb-0"
              >
                <span className="tabular text-base text-ink-muted">Tahun {c.tahun}</span>
                <span className="tabular text-card font-semibold text-ink">
                  {c.nomor_terakhir}
                </span>
              </div>
            ))}
            <p className="mt-1 text-note text-ink-subtle">
              Nomor diambil dalam satu transaksi terkunci, jadi dua Admin yang menyimpan
              bersamaan tidak dapat memperoleh nomor yang sama.
            </p>
          </CardBody>
        </Card>

        <Card>
          <CardHeader judul="Riwayat perubahan pengaturan" />
          <CardBody className="flex flex-col gap-4">
            {data.riwayat_perubahan.length === 0 ? (
              <p className="text-sm text-ink-subtle">Belum ada perubahan tercatat.</p>
            ) : (
              data.riwayat_perubahan.map((r, i) => (
                <div key={i}>
                  <p className="text-base text-ink">{r.ringkasan}</p>
                  <p className="mt-0.5 text-label text-ink-subtle">
                    {r.aktor} · {waktuPanjang(r.waktu)}
                  </p>
                </div>
              ))
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
