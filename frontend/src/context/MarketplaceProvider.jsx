import { useEffect, useState } from 'react';
import { Alert, Snackbar } from '@mui/material';
import MarketplaceContext from './MarketplaceContext';
import { initialMarketplace } from '../data/marketplaceData';
import { addCartItem, applyOffers, cartItems, checkoutError, completePurchase, today } from '../utils/commerce';
import { navigate } from '../hooks/useNavigation';

function loadData() {
  try {
    const saved = JSON.parse(localStorage.getItem('multiplaza.data'));
    return saved?.version === 1 && Array.isArray(saved.products) && Array.isArray(saved.cart) && Array.isArray(saved.wishlists) ? { ...initialMarketplace, ...saved } : initialMarketplace;
  } catch { return initialMarketplace; }
}

function loadSession() {
  try { return JSON.parse(sessionStorage.getItem('multiplaza.session') || localStorage.getItem('multiplaza.remembered-session')) || null; } catch { return null; }
}

export default function MarketplaceProvider({ children }) {
  const [data, setData] = useState(loadData);
  const [session, setSession] = useState(loadSession);
  const [notice, setNotice] = useState(null);
  const [checkout, setCheckout] = useState(() => {
    const defaults = { seller: '', delivery: true, shipping: 4990, region: 'Los Lagos', commune: 'Osorno', city: 'Osorno', street: 'Av. República', number: '1234', method: 'Tarjeta' };
    try { return { ...defaults, ...JSON.parse(sessionStorage.getItem('multiplaza.checkout')) }; } catch { return defaults; }
  });

  useEffect(() => {
    try { localStorage.setItem('multiplaza.data', JSON.stringify(data)); } catch { /* State remains available in memory if storage is unavailable. */ }
  }, [data]);
  useEffect(() => {
    try {
      if (session) sessionStorage.setItem('multiplaza.session', JSON.stringify(session)); else sessionStorage.removeItem('multiplaza.session');
      if (session?.remember) localStorage.setItem('multiplaza.remembered-session', JSON.stringify(session)); else localStorage.removeItem('multiplaza.remembered-session');
    } catch { /* Session still works in memory. */ }
  }, [session]);
  useEffect(() => { try { sessionStorage.setItem('multiplaza.checkout', JSON.stringify(checkout)); } catch { /* Checkout remains available in memory. */ } }, [checkout]);

  const notify = (message, severity = 'success') => setNotice({ message, severity });
  const login = (role = 'client', remember = false) => setSession({ role, remember });
  const logout = () => { setSession(null); navigate('/'); };
  const switchRole = () => { setSession((current) => ({ ...current, role: current?.role === 'seller' ? 'client' : 'seller' })); navigate('/inicio'); };
  const addToCart = (productId, quantity = 1) => {
    const product = data.products.find((item) => item.id === productId);
    if (!product?.stock) { notify('Este producto no tiene stock disponible.', 'warning'); return; }
    setData((current) => ({ ...current, cart: addCartItem(current.cart, product, quantity) }));
    notify('Producto agregado al carrito.');
  };
  const updateQuantity = (productId, quantity) => {
    const product = data.products.find((item) => item.id === productId);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > product.stock) return;
    setData((current) => ({ ...current, cart: current.cart.map((item) => item.productId === productId ? { ...item, quantity } : item) }));
  };
  const removeFromCart = (productId) => setData((current) => ({ ...current, cart: current.cart.filter((item) => item.productId !== productId) }));
  const toggleFavorite = (productId, listId = 'favorites') => {
    setData((current) => ({ ...current, wishlists: current.wishlists.map((list) => list.id === listId ? { ...list, productIds: list.productIds.includes(productId) ? list.productIds.filter((id) => id !== productId) : [...list.productIds, productId] } : list) }));
  };
  const startCheckout = (seller) => {
    const items = cartItems(data.cart, data.products).filter((item) => item.seller === seller);
    const error = checkoutError(items);
    if (error) { notify(error, 'warning'); return; }
    setCheckout((current) => ({ ...current, seller }));
    navigate('/resumen');
  };
  const purchase = (payment) => {
    const items = cartItems(data.cart, data.products).filter((item) => item.seller === checkout.seller);
    const error = checkoutError(items);
    if (error) { notify(error, 'warning'); return false; }
    const details = { ...checkout, ...payment, id: Date.now().toString(), date: today(), address: checkout.delivery ? `${checkout.street} ${checkout.number}, ${checkout.commune}, ${checkout.region}` : `Retiro en ${checkout.seller}` };
    setData((current) => {
      const result = completePurchase({ ...current, products: applyOffers(current.products, current.offers, today()) }, checkout.seller, details);
      return { ...result, products: current.products.map((product) => ({ ...product, stock: result.products.find((item) => item.id === product.id).stock })) };
    });
    notify('Compra de ejemplo registrada. Puedes revisarla en Mis pedidos.');
    navigate('/pedidos');
    return true;
  };
  const openChat = (seller, context = 'Consulta de producto') => {
    const existing = data.messages.find((thread) => thread.seller === seller && thread.context === context);
    const id = existing?.id || crypto.randomUUID();
    if (!existing) setData((current) => ({ ...current, messages: [...current.messages, { id, seller, context, messages: [{ id: crypto.randomUUID(), incoming: true, text: '¡Hola! Puedes dejar tu consulta aquí.', time: new Intl.DateTimeFormat('es-CL', { hour: '2-digit', minute: '2-digit' }).format(new Date()) }] }] }));
    navigate(`/mensajes/${id}`);
  };

  const visibleData = { ...data, products: applyOffers(data.products, data.offers, today()) };
  return <MarketplaceContext.Provider value={{ data: visibleData, setData, session, login, logout, switchRole, notify, checkout, setCheckout, addToCart, updateQuantity, removeFromCart, toggleFavorite, startCheckout, purchase, openChat }}>
    {children}
    <Snackbar open={Boolean(notice)} autoHideDuration={4500} onClose={() => setNotice(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
      <Alert severity={notice?.severity || 'success'} onClose={() => setNotice(null)} variant="filled" sx={{ width: '100%' }}>{notice?.message}</Alert>
    </Snackbar>
  </MarketplaceContext.Provider>;
}
