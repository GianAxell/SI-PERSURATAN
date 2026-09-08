import { Button } from './Button';
import { Modal } from './Modal';

export interface BarisRincian {
  label: string;
  nilai: React.ReactNode;
  /* Nomor surat dan tanggal dibaca lebih enak dengan angka selebar sama. */
  tabular?: boolean;
}

/**
 * Konfirmasi sebelum tindakan yang sukar dibatalkan: registrasi surat masuk,
 * penerbitan surat keluar, pengiriman disposisi, penonaktifan pengguna, dan
 * penggantian kata sandi.
 *
 * `rincian` adalah bagian terpentingnya. Dialog yang hanya bertanya "Anda
 * yakin?" tidak menolong siapa pun — yang ditanya tidak punya bahan untuk
 * menjawab selain ingatannya sendiri. Dengan menampilkan nilai yang akan
 * disimpan, pertanyaan "sudah sesuai?" jadi benar-benar bisa dijawab, dan
 * salah ketik terakhir masih sempat tertangkap.
 *
 * Karena itu pula dialog ini tidak dipasang di setiap tombol Simpan. Kalau
 * semua penyimpanan minta konfirmasi, orang berhenti membaca dan menekan
 * "Ya" secara otomatis — persis pada saat konfirmasi paling dibutuhkan.
 */
export function ConfirmDialog({
  terbuka,
  onTutup,
  onSetuju,
  judul,
  keterangan,
  rincian,
  labelSetuju = 'Lanjutkan',
  labelBatal = 'Batal',
  bahaya,
  sedangProses,
}: {
  terbuka: boolean;
  onTutup: () => void;
  onSetuju: () => void;
  judul: string;
  keterangan: React.ReactNode;
  rincian?: BarisRincian[];
  labelSetuju?: string;
  labelBatal?: string;
  bahaya?: boolean;
  sedangProses?: boolean;
}) {
  return (
    <Modal
      terbuka={terbuka}
      onTutup={onTutup}
      judul={judul}
      lebar={rincian?.length ? 'sedang' : 'sempit'}
      footer={
        <>
          <Button onClick={onTutup} disabled={sedangProses}>
            {labelBatal}
          </Button>
          <Button
            ragam={bahaya ? 'bahaya' : 'utama'}
            onClick={onSetuju}
            disabled={sedangProses}
          >
            {sedangProses ? 'Memproses…' : labelSetuju}
          </Button>
        </>
      }
    >
      <div className="text-base leading-relaxed text-ink-muted">{keterangan}</div>

      {rincian?.length ? (
        <dl className="mt-4 divide-y divide-line overflow-hidden rounded-control border border-line">
          {rincian.map((r) => (
            <div key={r.label} className="grid grid-cols-[130px_minmax(0,1fr)] gap-3 px-3.5 py-2.5">
              <dt className="text-label font-medium text-ink-subtle">{r.label}</dt>
              <dd
                className={
                  r.tabular
                    ? 'tabular text-base leading-snug text-ink'
                    : 'whitespace-pre-line text-base leading-snug text-ink'
                }
              >
                {r.nilai || <span className="text-ink-subtle">—</span>}
              </dd>
            </div>
          ))}
        </dl>
      ) : null}
    </Modal>
  );
}
