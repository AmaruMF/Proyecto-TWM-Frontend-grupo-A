import { canAccessThread, canManageCompany, fullName } from './identity.js';
import { applyOffers } from './commerce.js';
import { categories } from './categories.js';

export function projectMarketplace(state, session, date) {
  const account = state.accounts.find(item => item.id === session?.accountId);
  const company = state.companies.find(item => item.ownerId === account?.id) || null;
  const user = state.userData[account?.id] || { cart: [], wishlists: [], clients: [] };
  const { passwordHash: _hash, passwordSalt: _salt, ...profile } = account || {};
  // Credenciales excluidas de todos los datos expuestos a los componentes.
  void _hash; void _salt;
  const decorate = item => {
    const customer = state.accounts.find(record => record.id === item.customerId);
    return { ...item, seller: state.companies.find(record => record.id === item.companyId)?.name || item.seller, ...(customer ? { customer: fullName(customer) } : {}) };
  };
  const products = applyOffers(state.products, state.offers, date).map(decorate);
  const services = applyOffers(state.services, state.offers, date).map(decorate);
  const mine = records => account ? records.filter(item => item.customerId === account.id) : [];
  const owned = records => records.filter(item => canManageCompany(state, session, item.companyId));
  const myQuotes = mine(state.quotes).map(decorate);
  const receivedQuotes = owned(state.quotes).map(decorate);
  return {
    version: 3, profile, company, ...user, categories,
    companies: state.companies.map(({ id, name, ownerId, address, physical, shippingRates, defaultShipping }) => ({ id, name, ownerId, address, physical, shippingRates, defaultShipping })),
    products, services, offers: state.offers, ownedProducts: owned(products), ownedServices: owned(services), ownedOffers: owned(state.offers),
    orders: mine(state.orders).map(decorate), sales: owned(state.orders).map(decorate), transactions: (session?.role === 'seller' ? owned(state.transactions) : mine(state.transactions)).map(decorate),
    quotes: session?.role === 'seller' ? receivedQuotes : myQuotes, myQuotes, receivedQuotes,
    returns: (session?.role === 'seller' ? owned(state.returns) : mine(state.returns)).map(decorate),
    refunds: (session?.role === 'seller' ? owned(state.refunds || []) : mine(state.refunds || [])).map(decorate),
    messages: state.messages.filter(thread => canAccessThread(state, session, thread)).map(decorate),
    questions: state.questions.map(decorate), reviews: state.reviews, ratings: {},
  };
}

export function mergeProjectedData(state, session, previous, next) {
  if (!session || !state.accounts.some(account => account.id === session.accountId)) return state;
  const result = { ...state };
  const user = { ...state.userData[session.accountId] };
  for (const field of ['cart', 'wishlists', 'clients']) if (next[field] !== previous[field] && Array.isArray(next[field])) user[field] = next[field];
  result.userData = { ...state.userData, [session.accountId]: user };
  for (const field of ['products', 'services']) {
    if (next[field] === previous[field] || !Array.isArray(next[field])) continue;
    // Los formularios usan acciones específicas. Aquí solo se permite cambiar visibilidad.
    result[field] = state[field].map(item => {
      const updated = next[field].find(record => record.id === item.id);
      return updated && canManageCompany(state, session, item.companyId) ? { ...item, hidden: Boolean(updated.hidden) } : item;
    });
  }
  if (next.offers !== previous.offers && Array.isArray(next.offers)) result.offers = state.offers.flatMap(offer => {
    if (!canManageCompany(state, session, offer.companyId)) return [offer];
    const updated = next.offers.find(item => item.id === offer.id);
    return updated ? [{ ...offer, enabled: Boolean(updated.enabled) }] : [];
  });
  // Las devoluciones y reembolsos solo cambian mediante acciones autorizadas.
  return result;
}
