import { StrictMode, Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter, Route, Routes } from 'react-router-dom';
import './index.css';
import { AppProvider } from './estado/AppContext';
import { Marco } from './componentes/Marco';
import { Cargando } from './componentes/ui';
import Inicio from './paginas/Inicio';

// División de código: cada página se carga bajo demanda.
const Mapa = lazy(() => import('./paginas/Mapa'));
const Nivel = lazy(() => import('./paginas/Nivel'));
const Laboratorio = lazy(() => import('./paginas/Laboratorio'));
const Perfil = lazy(() => import('./paginas/Perfil'));
const Aula = lazy(() => import('./paginas/Aula'));
const Dashboard = lazy(() => import('./paginas/Dashboard'));
const Ingresar = lazy(() => import('./paginas/Ingresar'));

// HashRouter: funciona en GitHub Pages y Render static sin reglas de reescritura.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <AppProvider>
        <Marco>
          <Suspense fallback={<div className="mx-auto max-w-7xl px-4"><Cargando /></div>}>
            <Routes>
              <Route path="/" element={<Inicio />} />
              <Route path="/mapa" element={<Mapa />} />
              <Route path="/nivel/:codigo" element={<Nivel />} />
              <Route path="/laboratorio" element={<Laboratorio />} />
              <Route path="/perfil" element={<Perfil />} />
              <Route path="/aula" element={<Aula />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/ingresar" element={<Ingresar />} />
              <Route path="*" element={<div className="mx-auto max-w-7xl px-4 py-16"><h1 className="text-3xl">Esta página no existe</h1></div>} />
            </Routes>
          </Suspense>
        </Marco>
      </AppProvider>
    </HashRouter>
  </StrictMode>,
);
