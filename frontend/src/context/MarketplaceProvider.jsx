import { useEffect, useState, useSyncExternalStore } from 'react';
import { Alert, Snackbar } from '@mui/material';
import MarketplaceContext from './MarketplaceContext';
import { loadStoredMarketplace } from '../data/createMarketplace';
import { createAccountActions } from './accountActions';
import { createCommerceActions } from './commerceActions';
import { createInteractionActions } from './interactionActions';
import { createQuoteActions } from './quoteActions';
import { createCatalogActions } from './catalogActions';
import { createReturnActions } from './returnActions';
import { mergeProjectedData, projectMarketplace } from '../utils/marketplace';
import { isAdult } from '../utils/validation';
import { today } from '../utils/commerce';
import { processQuoteLifecycle } from '../utils/quotes';
import ChatDialog from '../components/messages/ChatDialog';
import { navigate } from '../hooks/useNavigation';

function loadData() {
  return loadStoredMarketplace(localStorage);
}

function loadSession(state) {
  try {
    const saved = JSON.parse(sessionStorage.getItem('multiplaza.session') || localStorage.getItem('multiplaza.remembered-session'));
    const account = state.accounts.find(item => item.id === saved?.accountId);
    if (!account) return null;
    return { accountId: account.id, role: saved.role === 'seller' && account.sellerEnabled && isAdult(account.birthday, today()) ? 'seller' : 'client', remember: Boolean(saved.remember) };
  } catch { return null; }
}

function checkoutFor(state, accountId) {
  const address = state.accounts.find(item => item.id === accountId)?.addresses?.[0] || {};
  const defaults = { accountId, seller: '', companyId: '', delivery: true, shipping: 0, method: 'Tarjeta', ...address, addressId: address.id };
  try {
    const saved = JSON.parse(sessionStorage.getItem(`multiplaza.checkout:${accountId}`));
    return saved?.accountId === accountId ? { ...defaults, ...saved } : defaults;
  } catch { return defaults; }
}

export default function MarketplaceProvider({ children }) {
  const [store] = useState(() => {
    const market = loadData();
    const session = loadSession(market);
    let snapshot = { market, session, checkout: checkoutFor(market, session?.accountId) };
    const listeners = new Set();
    return {
      getSnapshot: () => snapshot,
      subscribe: callback => { listeners.add(callback); return () => listeners.delete(callback); },
      update: updater => { const next = updater(snapshot); if (next === snapshot) return; snapshot = next; listeners.forEach(listener => listener()); },
    };
  });
  const { market, session, checkout } = useSyncExternalStore(store.subscribe, store.getSnapshot);
  const [notice, setNotice] = useState(null);
  const [chatId, setChatId] = useState(null);
  const commit = update => store.update(snapshot => ({ ...snapshot, market: processQuoteLifecycle(typeof update === 'function' ? update(snapshot.market) : update, today()) }));
  const setSession = update => store.update(snapshot => ({ ...snapshot, session: typeof update === 'function' ? update(snapshot.session) : update }));
  const setCheckout = update => store.update(snapshot => ({ ...snapshot, checkout: typeof update === 'function' ? update(snapshot.checkout) : update }));
  useEffect(() => { try { localStorage.setItem('multiplaza.data', JSON.stringify(market)); } catch { /* La simulación sigue disponible en memoria. */ } }, [market]);
  useEffect(() => {
    try {
      if (session) sessionStorage.setItem('multiplaza.session', JSON.stringify(session)); else sessionStorage.removeItem('multiplaza.session');
      if (session?.remember) localStorage.setItem('multiplaza.remembered-session', JSON.stringify(session)); else localStorage.removeItem('multiplaza.remembered-session');
    } catch { /* La sesión sigue disponible en memoria. */ }
  }, [session]);
  useEffect(() => { if (checkout.accountId) { try { sessionStorage.setItem(`multiplaza.checkout:${checkout.accountId}`, JSON.stringify(checkout)); } catch { /* Sin persistencia de sesión. */ } } }, [checkout]);
  useEffect(() => {
    const refresh = () => store.update(snapshot => {
      const market = processQuoteLifecycle(snapshot.market, today());
      return market === snapshot.market ? snapshot : { ...snapshot, market };
    });
    const interval = window.setInterval(refresh, 60000);
    document.addEventListener('visibilitychange', refresh);
    window.addEventListener('focus', refresh);
    return () => { window.clearInterval(interval); document.removeEventListener('visibilitychange', refresh); window.removeEventListener('focus', refresh); };
  }, [store]);
  const notify = (message, severity = 'success') => setNotice({ message, severity });
  const fail = message => { notify(message, 'warning'); return false; };
  const api = { getState: () => store.getSnapshot().market, commit, getSession: () => store.getSnapshot().session, setSession, getCheckout: () => store.getSnapshot().checkout, setCheckout, checkoutFor, setChatId, notify, fail, navigate };
  const accountActions = createAccountActions(api);
  const commerceActions = createCommerceActions(api);
  const interactionActions = createInteractionActions(api);
  const quoteActions = createQuoteActions(api);
  const catalogActions = createCatalogActions(api);
  const returnActions = createReturnActions(api);
  const deleteAccount = async () => {
    const accountId = store.getSnapshot().session?.accountId;
    const deleted = await accountActions.deleteAccount();
    if (deleted && accountId) { try { sessionStorage.removeItem(`multiplaza.checkout:${accountId}`); } catch { /* Sin almacenamiento de sesión. */ } }
    return deleted;
  };
  const setData = update => commit(current => {
    const activeSession = store.getSnapshot().session;
    const visible = projectMarketplace(current, activeSession, today());
    return mergeProjectedData(current, activeSession, visible, typeof update === 'function' ? update(visible) : update);
  });
  const data = projectMarketplace(market, session, today());
  return <MarketplaceContext.Provider value={{ data, setData, session, notify, checkout, setCheckout, ...accountActions, ...commerceActions, ...interactionActions, ...quoteActions, ...catalogActions, ...returnActions, deleteAccount }}>
    {children}
    {session && chatId && <ChatDialog key={`${session.accountId}-${session.role}-${chatId}`} id={chatId} onClose={() => setChatId(null)} />}
    <Snackbar open={Boolean(notice)} autoHideDuration={4500} onClose={() => setNotice(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
      <Alert severity={notice?.severity || 'success'} onClose={() => setNotice(null)} variant="filled" sx={{ width: '100%' }}>{notice?.message}</Alert>
    </Snackbar>
  </MarketplaceContext.Provider>;
}
