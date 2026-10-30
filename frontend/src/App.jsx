import { lazy, Suspense } from 'react';
import { Box, CircularProgress, CssBaseline, ThemeProvider, Typography } from '@mui/material';
import AppShell from './components/layout/AppShell';
import EmptyState from './components/common/EmptyState';
import MarketplaceProvider from './context/MarketplaceProvider';
import useNavigation from './hooks/useNavigation';
import useMarketplace from './hooks/useMarketplace';
import appTheme from './theme/appTheme';
import { clientFields, initialClients } from './data/initialData';

const CrudModule = lazy(() => import('./components/crud/CrudModule'));
const AuthPage = lazy(() => import('./pages/AuthPage'));
const HomePage = lazy(() => import('./pages/storefront/HomePage'));
const CatalogPage = lazy(() => import('./pages/storefront/CatalogPage'));
const ProductDetailPage = lazy(() => import('./pages/storefront/ProductDetailPage'));
const RegistrationPage = lazy(() => import('./pages/account/RegistrationPage'));
const ProfilePage = lazy(() => import('./pages/account/ProfilePage'));
const WishlistPage = lazy(() => import('./pages/account/WishlistPage'));
const QuotesPage = lazy(() => import('./pages/account/QuotesPage'));
const MessagesPage = lazy(() => import('./pages/account/MessagesPage'));
const CartPage = lazy(() => import('./pages/checkout/CartPage'));
const CheckoutPage = lazy(() => import('./pages/checkout/CheckoutPage'));
const PaymentPage = lazy(() => import('./pages/checkout/PaymentPage'));
const OrdersPage = lazy(() => import('./pages/orders/OrdersPage'));
const TrackingPage = lazy(() => import('./pages/orders/TrackingPage'));
const ReturnsPage = lazy(() => import('./pages/orders/ReturnsPage'));
const TransactionsPage = lazy(() => import('./pages/orders/TransactionsPage'));
const InventoryPage = lazy(() => import('./pages/seller/InventoryPage'));
const PublicationEditorPage = lazy(() => import('./pages/seller/PublicationEditorPage'));
const PublicationsPage = lazy(() => import('./pages/seller/PublicationsPage'));
const OfferPage = lazy(() => import('./pages/seller/OfferPage'));

const accountViews = new Set(['cuenta', 'carrito', 'pedidos', 'devoluciones', 'transacciones', 'cotizaciones', 'deseos', 'mensajes', 'seguimiento', 'postventa', 'inventario', 'publicaciones', 'oferta', 'gestion', 'servicios-vendedor', 'nuevo-producto', 'nuevo-servicio', 'editar-producto', 'editar-servicio', 'clientes']);
const publicViews = new Set(['', 'inicio', 'productos', 'servicios', 'ofertas', 'buscar', 'producto', 'servicio', 'registro']);

function AppContent({ view, id }) {
  switch (view) {
    case '': case 'inicio': return <HomePage />;
    case 'productos': return <CatalogPage key={view} />;
    case 'servicios': return <CatalogPage key={view} type="services" />;
    case 'ofertas': return <CatalogPage key={view} type="offers" />;
    case 'buscar': {
      let search; try { search = decodeURIComponent(id || ''); } catch { search = id || ''; }
      return <CatalogPage key={`${view}-${id}`} search={search} />;
    }
    case 'producto': return <ProductDetailPage key={id} id={id} />;
    case 'servicio': return <ProductDetailPage key={id} id={id} service />;
    case 'registro': return <RegistrationPage key="personal" />;
    case 'registro-empresa': return <RegistrationPage key="company" company />;
    case 'cuenta': return <ProfilePage />;
    case 'carrito': return <CartPage />;
    case 'resumen': return <CheckoutPage />;
    case 'pago': return <PaymentPage />;
    case 'pedidos': return <OrdersPage />;
    case 'seguimiento': return <TrackingPage id={id} />;
    case 'postventa': return <TrackingPage id={id} postSale />;
    case 'devoluciones': return <ReturnsPage />;
    case 'transacciones': return <TransactionsPage />;
    case 'cotizaciones': return <QuotesPage />;
    case 'gestion': return <QuotesPage management />;
    case 'deseos': return <WishlistPage />;
    case 'mensajes': return <MessagesPage id={id} />;
    case 'inventario': return <InventoryPage />;
    case 'nuevo-producto': return <PublicationEditorPage key="new-product" />;
    case 'editar-producto': return <PublicationEditorPage key={id} id={id} />;
    case 'nuevo-servicio': return <PublicationEditorPage key="new-service" service />;
    case 'editar-servicio': return <PublicationEditorPage key={id} id={id} service />;
    case 'publicaciones': return <PublicationsPage />;
    case 'servicios-vendedor': return <PublicationsPage servicesOnly />;
    case 'oferta': return <OfferPage />;
    case 'clientes': return <CrudModule title="Gestión de clientes" description="Administra la información de tus clientes." entityName="cliente" fields={clientFields} initialRows={initialClients} />;
    default: return <EmptyState title="Página no encontrada" actionLabel="Volver al inicio" onAction={() => { window.location.hash = '/'; }} />;
  }
}

function MarketplaceApp() {
  const { view, id, navigate } = useNavigation();
  const { session } = useMarketplace();
  if (view === 'acceso' || (!session && !publicViews.has(view))) return <AuthPage onLogin={() => view === 'acceso' ? navigate('/inicio') : undefined} />;
  return <AppShell activeView={view || 'inicio'} accountLayout={accountViews.has(view)}><AppContent view={view} id={id} /></AppShell>;
}

export default function App() {
  return <ThemeProvider theme={appTheme}><CssBaseline /><MarketplaceProvider><Suspense fallback={<Box role="status" sx={{ p: 6, textAlign: 'center' }}><CircularProgress size={32} /><Typography sx={{ mt: 2 }}>Cargando…</Typography></Box>}><MarketplaceApp /></Suspense></MarketplaceProvider></ThemeProvider>;
}
