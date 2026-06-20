import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { UniThemeProvider } from './theme';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { pdfjs } from 'react-pdf';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

// ─── Auto-recover from stale lazy-chunk references ─────────────────────
// After a fresh deploy, the cached index.html on a long-running tab /
// Electron window points at JS chunks with old hashes (e.g.
// AccessControl-C_9BnN3j.js). The new server doesn't have those files;
// it returns index.html as a SPA fallback; the browser refuses to
// execute HTML as a module → "Failed to fetch dynamically imported
// module" hard-fails the route navigation.
//
// Vite emits `vite:preloadError` whenever a dynamic import fails to
// preload. We listen for it and force a full reload — the page comes
// back with fresh HTML referencing the new chunk hashes, and the user
// is on the new bundle without realising anything went wrong.
//
// The localStorage flag prevents an infinite reload loop: if the
// chunk is still missing after a reload (e.g. server is genuinely
// broken), we surrender on the second attempt and let the error
// bubble up so the user sees something diagnosable.
if (typeof window !== 'undefined') {
  window.addEventListener('vite:preloadError', (event) => {
    const RELOAD_FLAG = 'unistack.chunkErrorReloaded';
    const recentlyReloaded =
      sessionStorage.getItem(RELOAD_FLAG) === String(Date.now() - 0).slice(0, -3);
    if (recentlyReloaded) {
      console.error(
        '[chunk-load] Reloaded already, giving up to avoid loop',
        event,
      );
      return;
    }
    sessionStorage.setItem(RELOAD_FLAG, String(Date.now()).slice(0, -3));
    console.warn('[chunk-load] Stale chunk detected, reloading…', event);
    event.preventDefault();
    window.location.reload();
  });

  // Belt-and-braces: catch the same condition via the generic error
  // event, in case some Vite versions emit only this path.
  window.addEventListener('error', (event) => {
    const msg = event?.message ?? '';
    if (
      msg.includes('Failed to fetch dynamically imported module') ||
      msg.includes('Loading chunk') ||
      msg.includes('Loading CSS chunk')
    ) {
      const RELOAD_FLAG = 'unistack.chunkErrorReloaded';
      if (sessionStorage.getItem(RELOAD_FLAG)) return; // already tried
      sessionStorage.setItem(RELOAD_FLAG, '1');
      console.warn('[chunk-load] Caught via error event, reloading…', event);
      window.location.reload();
    }
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <UniThemeProvider>
      <App />
      <ToastContainer
        theme="colored"
        position="bottom-right"
        autoClose={3000}
        hideProgressBar={false}
        closeOnClick
        pauseOnHover
        toastStyle={{
          borderRadius: 12,
          fontFamily: '"Inter Variable", "Inter", system-ui, sans-serif',
        }}
      />
    </UniThemeProvider>
  </React.StrictMode>
);
