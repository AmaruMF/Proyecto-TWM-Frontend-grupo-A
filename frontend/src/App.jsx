import { useState } from 'react';
import { CssBaseline, ThemeProvider } from '@mui/material';
import AppShell from './components/layout/AppShell';
import CrudModule from './components/crud/CrudModule';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';
import appTheme from './theme/appTheme';
import { clientFields, initialClients, initialServices, serviceFields } from './data/initialData';

function AppContent({ activeView }) {
  if (activeView === 'dashboard') {
    return <DashboardPage />;
  }

  if (activeView === 'clients') {
    return (
      <CrudModule
        key="clients"
        title="Gestion de clientes"
        description="Crea, consulta, edita y elimina clientes usando una tabla MUI y formularios en modal."
        entityName="cliente"
        fields={clientFields}
        initialRows={initialClients}
      />
    );
  }

  if (activeView === 'services') {
    return (
      <CrudModule
        key="services"
        title="Gestion de servicios"
        description="Administra los servicios del catalogo con el mismo componente reutilizable de CRUD."
        entityName="servicio"
        fields={serviceFields}
        initialRows={initialServices}
      />
    );
  }

  if (activeView === 'profile') {
    return <ProfilePage />;
  }

  return <DashboardPage />;
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeView, setActiveView] = useState('dashboard');

  const handleLogout = () => {
    console.log('Cierre de sesion', { closedAt: new Date().toISOString() });
    setIsAuthenticated(false);
    setActiveView('dashboard');
  };

  return (
    <ThemeProvider theme={appTheme}>
      <CssBaseline />
      {isAuthenticated ? (
        <AppShell activeView={activeView} onNavigate={setActiveView} onLogout={handleLogout}>
          <AppContent activeView={activeView} />
        </AppShell>
      ) : (
        <AuthPage onLogin={() => setIsAuthenticated(true)} />
      )}
    </ThemeProvider>
  );
}

export default App;
