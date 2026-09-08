import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { Providers } from './app/providers';
import { router } from './app/router';
import './index.css';

/**
 * Selama backend belum jalan, permintaan dilayani mock MSW. Matikan dengan
 * menaruh VITE_MOCK=off di .env.local — setelah itu permintaan diteruskan
 * ke http://localhost:3000 lewat proxy Vite.
 */
async function siapkanMock() {
  if (!import.meta.env.DEV) return;
  if (import.meta.env.VITE_MOCK === 'off') return;

  const { worker } = await import('./mocks/browser');
  await worker.start({
    onUnhandledRequest: 'bypass',
    quiet: true,
  });
}

siapkanMock().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <Providers>
        <RouterProvider router={router} />
      </Providers>
    </StrictMode>,
  );
});
