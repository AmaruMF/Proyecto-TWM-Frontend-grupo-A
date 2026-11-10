import accounts from './accounts.json' with { type: 'json' };
import { initialMarketplace } from './marketplaceData.js';
import { normalizeItemCategory } from '../utils/categories.js';
import { normalizeWishlist } from '../context/catalogActions.js';
import { normalizeFinancialRecord } from '../utils/financial.js';
import { processQuoteLifecycle } from '../utils/quotes.js';
import { today } from '../utils/commerce.js';

const address = id => ({ id, label: 'Casa', region: 'Los Lagos', commune: 'Osorno', city: 'Osorno', street: 'Av. República', number: '1234', details: '' });
const emptyLists = () => ({ cart: [], wishlists: [{ id: 'favorites', name: 'Mis favoritos', productIds: [] }], clients: [] });
const slug = name => String(name).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-');

export function loadStoredMarketplace(storage, date = today()) {
  let saved;
  try { saved = JSON.parse(storage.getItem('multiplaza.data')); }
  catch { return createMarketplace(undefined, date); }
  if ([1, 2].includes(saved?.version)) {
    try {
      const key = `multiplaza.backup.v${saved.version}`;
      if (!storage.getItem(key)) storage.setItem(key, JSON.stringify(saved));
    } catch { /* Una cuota llena no impide conservar y migrar los datos en memoria. */ }
  }
  return createMarketplace(saved, date);
}

export function upgradeMarketplace(state, date = today()) {
  const products = state.products.map(item => normalizeItemCategory({ ...item, relatedProductIds: [...new Set(item.relatedProductIds || [])].filter(id => id !== item.id && state.products.some(candidate => candidate.id === id && candidate.companyId === item.companyId)) }, 'product'));
  const services = (state.services || []).map(item => normalizeItemCategory(item, 'service'));
  const orders = (state.orders || []).map(order => normalizeFinancialRecord(order));
  const transactions = (state.transactions || []).map(transaction => normalizeFinancialRecord(transaction, orders));
  const userData = Object.fromEntries(Object.entries(state.userData).map(([id, data]) => [id, { ...data, wishlists: (data.wishlists || []).map(normalizeWishlist) }]));
  return processQuoteLifecycle({ ...state, version: 3, products, services, orders, transactions, userData, refunds: state.refunds || [], returns: state.returns || [], quotes: state.quotes || [], messages: state.messages || [], questions: state.questions || [], reviews: state.reviews || [] }, date);
}

export function createMarketplace(saved, date = today()) {
  if ([2, 3].includes(saved?.version) && Array.isArray(saved.accounts) && Array.isArray(saved.companies) && Array.isArray(saved.products) && saved.userData) return upgradeMarketplace(saved, date);
  const legacy = saved?.version === 1 ? saved : initialMarketplace;
  const state = {
    version: 3,
    accounts: accounts.map(account => ({ ...account, phone: account.phones[0], location: 'Osorno, Chile', addresses: [address(`address-${account.id}`)], companyRegistrationPending: false, accountType: account.sellerEnabled ? 'seller' : 'client' })),
    companies: [{ id: 'company-cjesus', ownerId: 'account-cjesus', name: 'Multiplaza', rut: '76.123.456-0', email: 'ventas@multiplaza.cl', website: '', phones: ['+56 9 1234 5678'], physical: true, offering: 'Ambos', address: address('address-company-cjesus'), defaultShipping: 7990, shippingRates: [{ id: 'rate-osorno', region: 'Los Lagos', commune: 'Osorno', price: 4990 }, { id: 'rate-los-lagos', region: 'Los Lagos', commune: '', price: 5990 }] }],
    userData: { 'account-cjesus': emptyLists(), 'account-milla': { ...emptyLists(), cart: legacy.cart || [], wishlists: legacy.wishlists || emptyLists().wishlists } },
    products: [], services: [], offers: [], orders: [], transactions: [], quotes: [], messages: [], questions: [], reviews: [], returns: [], refunds: [],
  };
  const companyFor = (name, service = false) => {
    if (service || name === 'HP Store' || name === 'Multiplaza' || name === legacy.company?.name) return state.companies[0];
    const id = `company-${slug(name)}`;
    let company = state.companies.find(item => item.id === id);
    if (!company) { company = { id, ownerId: `partner-${slug(name)}`, name, physical: true, address: address(`address-${id}`), shippingRates: [], defaultShipping: 7990 }; state.companies.push(company); }
    return company;
  };
  const seedItems = (items, service) => items.map((item, index) => {
    const company = companyFor(item.seller, service);
    const sku = item.sku || `${service ? 'SER' : 'PRO'}-${String(index + 1).padStart(4, '0')}`;
    const price = Number(item.basePrice ?? item.price) || (service ? 35000 : 1);
    const result = { ...item, companyId: company.id, sellerId: company.id, ownerId: company.ownerId, seller: company.name, sku, price, originalPrice: price, discount: 0, adultOnly: Boolean(item.adultOnly), ...(service ? { durationMinutes: item.durationMinutes || 60, duration: item.duration || '60 minutos' } : {}) };
    delete result.basePrice;
    delete result.activeOfferId;
    if (!service) {
      result.variants = item.variants?.length ? item.variants.map(variant => {
        const option = { ...variant, price: Number(variant.basePrice ?? variant.price) || price };
        delete option.basePrice; delete option.originalPrice;
        return option;
      }) : [{ id: `${item.id}-default`, sku, attributes: { ...(item.color ? { color: item.color } : {}), ...(item.size ? { size: item.size } : {}), ...(item.material ? { material: item.material } : {}) }, price, stock: Number(item.stock) || 0 }];
      result.stock = result.variants.reduce((sum, variant) => sum + variant.stock, 0);
    }
    if (item.discount > 0 && item.originalPrice > price && !(legacy.offers || []).some(offer => offer.productId === item.id)) {
      const original = item.originalPrice;
      result.price = original;
      result.originalPrice = original;
      if (result.variants) result.variants = result.variants.map(variant => ({ ...variant, price: Math.round(variant.price * original / price) }));
      state.offers.push({ id: `initial-${item.id}`, itemType: service ? 'service' : 'product', ...(service ? { serviceId: item.id } : { productId: item.id }), companyId: company.id, discount: Math.round((1 - price / original) * 100), start: '2026-11-01', end: '2026-11-30', enabled: true });
    }
    return result;
  });
  state.products = seedItems(legacy.products || initialMarketplace.products, false);
  state.services = seedItems(legacy.services || initialMarketplace.services, true);
  for (const offer of legacy.offers || []) {
    const item = state.products.find(product => product.id === offer.productId) || state.services.find(service => service.id === offer.serviceId);
    if (item) state.offers.push({ ...offer, itemType: offer.serviceId ? 'service' : 'product', companyId: item.companyId });
  }
  state.userData['account-milla'].cart = state.userData['account-milla'].cart.map(entry => ({ ...entry, variantId: entry.variantId || state.products.find(item => item.id === entry.productId)?.variants[0]?.id })).filter(entry => entry.variantId);
  state.orders = (legacy.orders || []).map(order => {
    const company = companyFor(order.seller);
    return { ...order, companyId: company.id, sellerId: company.id, seller: company.name, customerId: 'account-milla', customer: 'Millaray Godoy', items: order.items.map(item => ({ ...item, sku: state.products.find(product => product.id === item.productId)?.sku })) };
  });
  // Un pedido entregado propio permite recorrer reseñas sin alterar los productos o imágenes.
  if (!state.orders.some(order => order.companyId === 'company-cjesus' && order.step === 3)) {
    const product = state.products.find(item => item.id === 'mouse') || state.products[0];
    state.orders.push({ id: '10679', seller: 'Multiplaza', companyId: 'company-cjesus', sellerId: 'company-cjesus', customerId: 'account-milla', customer: 'Millaray Godoy', items: [{ productId: product.id, sku: product.sku, name: product.name, image: product.image, price: product.variants[0].price, quantity: 1, variantId: product.variants[0].id }], date: '2026-11-01', step: 3, delivery: false, shipping: 0, total: product.variants[0].price, address: 'Retiro en Multiplaza', tracking: '', carrier: '' });
  }
  state.transactions = (legacy.transactions || []).map(item => { const company = companyFor(item.seller); return { ...item, companyId: company.id, seller: company.name, customerId: 'account-milla' }; });
  state.returns = (legacy.returns || []).map(item => { const company = companyFor(item.seller); return { ...item, companyId: company.id, seller: company.name, customerId: 'account-milla' }; });
  state.quotes = (legacy.quotes || []).map(quote => { const service = state.services.find(item => item.id === quote.serviceId); return { ...quote, companyId: service?.companyId, sellerId: service?.companyId, seller: service?.seller, customerId: 'account-milla', customer: 'Millaray Godoy' }; });
  state.questions = (legacy.questions || []).map(question => { const product = state.products.find(item => item.id === question.productId); return { ...question, itemId: question.itemId || question.productId, itemType: question.itemType || 'product', companyId: product?.companyId, customerId: 'account-milla', customer: 'Millaray Godoy' }; });
  state.messages = (legacy.messages || []).map(thread => { const company = companyFor(thread.seller); return { ...thread, companyId: company.id, customerId: 'account-milla', customer: 'Millaray Godoy', seller: company.name, messages: thread.messages.map(message => ({ ...message, senderId: message.incoming ? company.ownerId : 'account-milla', senderRole: message.senderRole || (message.incoming ? 'seller' : 'client') })) }; });
  return upgradeMarketplace(state, date);
}
