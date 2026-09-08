import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

/*
 * Skala huruf pada proyek ini bernama sendiri (text-label, text-card, …)
 * karena diambil dari Figma. tailwind-merge tidak mengenalinya dan akan
 * mengiranya kelas WARNA, sehingga `text-white text-label` membuat
 * `text-white` terbuang — teks tombol gelap di atas latar gelap.
 *
 * Daftar di bawah memberi tahu tailwind-merge bahwa nama-nama itu ukuran
 * huruf. Setiap kali skala di tailwind.config.js bertambah, tambahkan juga
 * di sini.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [{ text: ['badge', 'note', 'label', 'sm', 'base', 'card', 'page'] }],
    },
  },
});

/** Gabungkan kelas Tailwind; kelas yang belakangan menang. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
