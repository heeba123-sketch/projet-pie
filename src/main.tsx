import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { AdminDashboard } from './components/AdminDashboard.tsx';
import './index.css';

const isAdmin = window.location.pathname === '/admin' || window.location.pathname.startsWith('/admin/');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isAdmin ? <AdminDashboard /> : <App />}
  </StrictMode>,
);
