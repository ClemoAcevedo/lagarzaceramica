import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { CatalogProvider } from './context/CatalogContext.jsx';
import './styles/index.css';

document.documentElement.classList.add('js');

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <CatalogProvider>
        <App />
      </CatalogProvider>
    </AuthProvider>
  </StrictMode>,
);
