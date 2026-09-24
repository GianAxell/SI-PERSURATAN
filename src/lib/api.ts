import axios, { AxiosError, type AxiosInstance } from 'axios';
import type { ApiError, ApiSuccess, Halaman, Meta } from '@/types';

export const KUNCI_TOKEN = 'sip.token';

export function ambilToken() {
  try {
    return localStorage.getItem(KUNCI_TOKEN);
  } catch {
    return null;
  }
}

export function simpanToken(token: string) {
  try {
    localStorage.setItem(KUNCI_TOKEN, token);
  } catch {
   
  }
}

export function hapusToken() {
  try {
    localStorage.removeItem(KUNCI_TOKEN);
  } catch {
    /* abaikan */
  }
}

export const api: AxiosInstance = axios.create({
  baseURL: 'https://sao-secretary-karen-permissions.trycloudflare.com/api',
  headers: { Accept: 'application/json' },
});

/* Sisipkan token pada setiap permintaan. */
api.interceptors.request.use((config) => {
  const token = ambilToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/*
 * 401 berarti token tidak ada atau kedaluwarsa (§2.3 kontrak).
 * Token dibuang lalu pengguna dilempar ke halaman login — kecuali kalau
 * yang gagal justru permintaan login itu sendiri, karena di sana 401
 * berarti "nama pengguna atau kata sandi tidak sesuai" dan harus
 * ditampilkan di formulir, bukan memicu pengalihan.
 */
api.interceptors.response.use(
  (res) => res,
  (error: AxiosError<ApiError>) => {
    const status = error.response?.status;
    const urlLogin = error.config?.url?.includes('/auth/login');

    if (status === 401 && !urlLogin) {
      hapusToken();
      if (window.location.pathname !== '/login') {
        window.location.assign('/login');
      }
    }
    return Promise.reject(error);
  },
);

/** Pesan yang layak ditampilkan, apa pun bentuk kegagalannya. */
export function pesanError(error: unknown, bawaan = 'Terjadi kesalahan pada sistem') {
  if (axios.isAxiosError<ApiError>(error)) {
    if (error.response?.data?.message) return error.response.data.message;
    if (error.code === 'ERR_NETWORK') return 'Tidak dapat terhubung ke server';
  }
  return bawaan;
}

/** Error per field dari 400/422, siap dipasang ke react-hook-form. */
export function errorField(error: unknown): Record<string, string> {
  if (!axios.isAxiosError<ApiError>(error)) return {};
  const daftar = error.response?.data?.errors ?? [];
  return Object.fromEntries(daftar.map((e) => [e.field, e.message]));
}

/* ---------- pembungkus tipis agar amplop response tidak berceceran ---------- */

export async function ambil<T>(url: string, params?: unknown): Promise<T> {
  const res = await api.get<ApiSuccess<T>>(url, { params: params as object });
  return res.data.data;
}

export async function ambilHalaman<T>(url: string, params?: unknown): Promise<Halaman<T>> {
  const res = await api.get<ApiSuccess<T[]>>(url, { params: params as object });
  return {
    data: res.data.data,
    meta: res.data.meta ?? { page: 1, limit: res.data.data.length, total: res.data.data.length, total_page: 1 },
  };
}

export async function kirim<T>(url: string, body?: unknown): Promise<T> {
  const res = await api.post<ApiSuccess<T>>(url, body);
  return res.data.data;
}

export async function ubah<T>(url: string, body?: unknown): Promise<T> {
  const res = await api.put<ApiSuccess<T>>(url, body);
  return res.data.data;
}

export async function tambal<T>(url: string, body?: unknown): Promise<T> {
  const res = await api.patch<ApiSuccess<T>>(url, body);
  return res.data.data;
}

export type { Meta };
