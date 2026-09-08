import { HttpResponse } from 'msw';
import { PENGGUNA } from './data';
import type { ApiFieldError, User } from '@/types';

/** Amplop response mengikuti §2.2 kontrak. */
export const sukses = <T,>(data: T, meta?: unknown, message = 'Berhasil') =>
  HttpResponse.json({ success: true, message, data, ...(meta ? { meta } : {}) });

export const gagal = (status: number, message: string, errors?: ApiFieldError[]) =>
  HttpResponse.json({ success: false, message, ...(errors ? { errors } : {}) }, { status });

/** Token palsu: "mock.<id>". Cukup untuk membedakan pengguna saat development. */
export const buatToken = (u: User) => `mock.${u.id}`;

export function penggunaDari(request: Request): User | null {
  const header = request.headers.get('Authorization');
  if (!header?.startsWith('Bearer mock.')) return null;
  const id = Number(header.replace('Bearer mock.', ''));
  const ditemukan = PENGGUNA.find((u) => u.id === id);
  if (!ditemukan) return null;
  const { password: _abaikan, ...tanpaPassword } = ditemukan;
  return tanpaPassword;
}

/** Menunda jawaban agar keadaan "memuat" di UI benar-benar terlihat. */
export const jeda = (ms = 220) => new Promise((r) => setTimeout(r, ms));

export function halaman<T>(semua: T[], page: number, limit: number) {
  const total = semua.length;
  const mulai = (page - 1) * limit;
  return {
    data: semua.slice(mulai, mulai + limit),
    meta: {
      page,
      limit,
      total,
      total_page: Math.max(1, Math.ceil(total / limit)),
    },
  };
}
