import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { QueryProvider } from '@/providers/query-provider';
import { router } from '@/router';
// Self-hosted, like next/font was: an air-gapped edge box cannot reach
// Google Fonts at runtime.
import '@fontsource/geist-sans/400.css';
import '@fontsource/geist-sans/500.css';
import '@fontsource/geist-sans/600.css';
import '@fontsource/geist-sans/700.css';
import '@/globals.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryProvider>
      <RouterProvider router={router} future={{ v7_startTransition: true }} />
    </QueryProvider>
  </StrictMode>,
);
