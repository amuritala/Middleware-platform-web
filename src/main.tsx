import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import './index.css';
import App from './App.tsx';
import { AuthProvider } from './lib/AuthProvider';
import { AdminSessionProvider } from './lib/adminSession';

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <AuthProvider>
            <AdminSessionProvider>
                <BrowserRouter>
                    <App />
                </BrowserRouter>
            </AdminSessionProvider>
        </AuthProvider>
    </StrictMode>
);