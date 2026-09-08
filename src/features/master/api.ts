import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ambil, ambilHalaman, kirim, tambal, ubah } from '@/lib/api';
import type {
  AturanPenomoran,
  Bagian,
  JenisSurat,
  Pegawai,
  Role,
  StatusAktif,
  Template,
  TemplateField,
  User,
} from '@/types';

/*
 * Master data memakai pola CRUD yang seragam (§5.6 kontrak), jadi hook di
 * sini sengaja tipis dan berulang bentuknya. Yang membedakan hanya alamat
 * dan bentuk isiannya.
 */

function bersih<T extends object>(f: T) {
  return Object.fromEntries(
    Object.entries(f).filter(([, v]) => v !== null && v !== '' && v !== undefined),
  );
}

/** Semua perubahan master data menyegarkan seluruh cache master sekaligus —
 *  bagian, jenis surat, dan template saling merujuk. */
function useSegarkanMaster() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ['master'] });
}

/* ---------- pengguna (layar 13, 23, 24) ---------- */

export interface IsianUser {
  nama: string;
  username: string;
  role: Role;
  jabatan: string;
  bagian_id: number | null;
  status: StatusAktif;
  password_awal?: string;
}

export function useUsers(q: string, page: number, limit = 10) {
  return useQuery({
    queryKey: ['master', 'users', { q, page, limit }],
    queryFn: () => ambilHalaman<User>('/users', bersih({ q, page, limit })),
    placeholderData: (s) => s,
  });
}

export function useSimpanUser() {
  const segarkan = useSegarkanMaster();
  return useMutation({
    mutationFn: ({ id, isian }: { id?: number; isian: IsianUser }) =>
      id ? ubah<User>(`/users/${id}`, isian) : kirim<User>('/users', isian),
    onSuccess: segarkan,
  });
}

export function useUbahStatusUser() {
  const segarkan = useSegarkanMaster();
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: StatusAktif }) =>
      tambal<User>(`/users/${id}/status`, { status }),
    onSuccess: segarkan,
  });
}

/* ---------- pegawai (layar 21, 34) ---------- */

export interface IsianPegawai {
  nama: string;
  nip: string;
  jabatan: string;
  bagian_id: number | null;
  user_id: number | null;
  status: StatusAktif;
}

export function usePegawai(q: string, page: number, limit = 10) {
  return useQuery({
    queryKey: ['master', 'pegawai', { q, page, limit }],
    queryFn: () => ambilHalaman<Pegawai>('/pegawai', bersih({ q, page, limit })),
    placeholderData: (s) => s,
  });
}

export function useSimpanPegawai() {
  const segarkan = useSegarkanMaster();
  return useMutation({
    mutationFn: ({ id, isian }: { id?: number; isian: IsianPegawai }) =>
      id ? ubah<Pegawai>(`/pegawai/${id}`, isian) : kirim<Pegawai>('/pegawai', isian),
    onSuccess: segarkan,
  });
}

/** Akun yang belum dipakai pegawai lain — layar 34 kolom "Akun pengguna". */
export function useAkunTersedia(pegawaiId?: number) {
  return useQuery({
    queryKey: ['master', 'akun-tersedia', pegawaiId ?? null],
    queryFn: () =>
      ambil<{ id: number; username: string; nama: string }[]>(
        '/users/tersedia',
        bersih({ pegawai_id: pegawaiId }),
      ),
  });
}

/* ---------- bagian (layar 22, 32) ---------- */

export interface IsianBagian {
  kode: string;
  nama: string;
  urutan_tampil: number;
  status: StatusAktif;
}

export function useBagian(q = '') {
  return useQuery({
    queryKey: ['master', 'bagian', { q }],
    queryFn: () => ambil<Bagian[]>('/master/bagian', bersih({ q })),
  });
}

export function useSimpanBagian() {
  const segarkan = useSegarkanMaster();
  return useMutation({
    mutationFn: ({ id, isian }: { id?: number; isian: IsianBagian }) =>
      id
        ? ubah<Bagian>(`/master/bagian/${id}`, isian)
        : kirim<Bagian>('/master/bagian', isian),
    onSuccess: segarkan,
  });
}

/* ---------- jenis surat (layar 14, 31) ---------- */

export interface IsianJenisSurat {
  bagian_id: number;
  kode: string;
  nama: string;
  status: StatusAktif;
}

export function useJenisSurat(bagianId: number | null) {
  return useQuery({
    queryKey: ['master', 'jenis-surat', bagianId],
    queryFn: () =>
      ambil<JenisSurat[]>('/master/jenis-surat', bersih({ bagian_id: bagianId })),
    enabled: bagianId !== null,
  });
}

export function useSimpanJenisSurat() {
  const segarkan = useSegarkanMaster();
  return useMutation({
    mutationFn: ({ id, isian }: { id?: number; isian: IsianJenisSurat }) =>
      id
        ? ubah<JenisSurat>(`/master/jenis-surat/${id}`, isian)
        : kirim<JenisSurat>('/master/jenis-surat', isian),
    onSuccess: segarkan,
  });
}

/* ---------- template (layar 15, 33) ---------- */

export function useDaftarTemplate() {
  return useQuery({
    queryKey: ['master', 'template'],
    queryFn: () => ambil<Template[]>('/master/template'),
  });
}

export function useTemplate(id: number | null) {
  return useQuery({
    queryKey: ['master', 'template', id],
    queryFn: () => ambil<Template>(`/master/template/${id}`),
    enabled: id !== null,
  });
}

export function useSimpanTemplate(id: number) {
  const segarkan = useSegarkanMaster();
  return useMutation({
    mutationFn: (isian: { konten_html: string; format_nomor: string }) =>
      ubah<Template>(`/master/template/${id}`, isian),
    onSuccess: segarkan,
  });
}

export function useSimpanField(templateId: number) {
  const segarkan = useSegarkanMaster();
  return useMutation({
    mutationFn: ({ id, isian }: { id?: number; isian: Omit<TemplateField, 'id'> }) =>
      id
        ? ubah<TemplateField>(`/master/template/${templateId}/fields/${id}`, isian)
        : kirim<TemplateField>(`/master/template/${templateId}/fields`, isian),
    onSuccess: segarkan,
  });
}

/* ---------- aturan penomoran (layar 16) ---------- */

export function usePenomoran() {
  return useQuery({
    queryKey: ['master', 'penomoran'],
    queryFn: () => ambil<AturanPenomoran>('/master/penomoran'),
  });
}

export function useSimpanPenomoran() {
  const segarkan = useSegarkanMaster();
  return useMutation({
    mutationFn: (isian: {
      format_nomor: string;
      kode_perusahaan: string;
      panjang_nomor_urut: number;
    }) => ubah<AturanPenomoran>('/master/penomoran', isian),
    onSuccess: segarkan,
  });
}
