import { forwardRef } from 'react';
import { Input, type InputProps } from './Input';

/**
 * Kolom tanggal memakai <input type="date"> bawaan browser. Nilainya sudah
 * berformat YYYY-MM-DD, sama persis dengan yang diminta kontrak (§2.4),
 * sehingga tidak ada penerjemahan bolak-balik yang bisa salah.
 *
 * Tampilan placeholder "hh/bb/tttt" pada Figma adalah format bawaan browser
 * berbahasa Indonesia — halaman ini memang disetel <html lang="id">.
 */
export const DateInput = forwardRef<HTMLInputElement, InputProps>(function DateInput(
  props,
  ref,
) {
  return <Input ref={ref} type="date" {...props} />;
});
