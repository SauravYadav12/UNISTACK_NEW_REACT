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
