import { applyOffers, cartItems, checkoutError, orderTotals, today } from '../utils/commerce.js';
import { canManageCompany, fullName } from '../utils/identity.js';
import { isAdult } from '../utils/validation.js';
import { normalizeQuote, processQuoteLifecycle, quoteItemsError, quoteLineId, validQuoteDate } from '../utils/quotes.js';

const text = value => typeof value === 'string' ? value.trim() : '';
export function createQuoteActions(api) {
  const date = () => api.getDate?.() || today();
  const reject = message => { api.fail(message); return false; };
  const current = () => {
    const raw = api.getState();
    const state = processQuoteLifecycle(raw, date());
    if (state !== raw) api.commit(state);
    const session = api.getSession();
    const account = state.accounts.find(item => item.id === session?.accountId);
    return { state, session, account };
  };
  const findCompany = (state, seller) => {
    const exact = state.companies.find(item => item.id === seller);
    if (exact) return exact;
    const matches = state.companies.filter(item => item.name === seller);
    return matches.length === 1 ? matches[0] : null;
  };
  const saveRequest = (state, account, company, sourceType, items, details = {}) => {
    if (!account) return reject('Inicia sesión para solicitar una cotización.');
    if (!company || company.disabled || company.ownerId === account.id) return reject('No puedes cotizar artículos de tu propia empresa o de una empresa no disponible.');
    const detail = text(details.detail) || (sourceType === 'product' ? 'Solicito una cotización de los productos seleccionados en el carrito.' : '');
    if (!detail || detail.length > 1500) return reject('Describe lo que necesitas en un máximo de 1500 caracteres.');
    const requestedDate = details.requestedDate || details.date;
    if (sourceType === 'service' && (!validQuoteDate(requestedDate) || requestedDate < date())) return reject('Selecciona una fecha válida que no sea anterior a hoy.');
    const quote = normalizeQuote({ id: crypto.randomUUID(), sourceType, companyId: company.id, sellerId: company.id, seller: company.name, customerId: account.id, customer: fullName(account), items, detail, emissionDate: date(), date: sourceType === 'service' ? requestedDate : date(), requestedDate: sourceType === 'service' ? requestedDate : undefined, sentAt: new Date().toISOString(), step: 0, status: 'requested', ...(sourceType === 'service' && items.length === 1 ? { serviceId: items[0].itemId, serviceName: items[0].name, serviceSku: items[0].sku } : {}) }, state, date());
    api.commit(raw => ({ ...raw, quotes: [quote, ...raw.quotes] }));
    api.notify('Solicitud de cotización enviada.');
    return true;
  };

  const requestCartQuote = (seller, details = {}) => {
    const { state, account } = current();
    if (!account) return reject('Inicia sesión para cotizar tu carrito.');
    const company = findCompany(state, seller);
    if (!company) return reject('Selecciona un vendedor de tu carrito.');
    const cart = state.userData[account.id]?.cart || [];
    const priced = applyOffers(state.products, state.offers, date());
    const selected = cartItems(cart, priced).filter(item => (item.companyId || item.sellerId) === company.id);
    const error = checkoutError(selected, account, date());
    if (error) return reject(error);
    const lines = new Map();
    for (const item of selected) {
      const id = quoteLineId({ itemType: 'product', itemId: item.id, variantId: item.variantId });
      const previous = lines.get(id);
      lines.set(id, previous ? { ...previous, quantity: previous.quantity + item.quantity } : { id, itemType: 'product', itemId: item.id, productId: item.id, variantId: item.variantId, sku: item.sku, name: item.name, quantity: item.quantity, price: item.price, image: item.detailImage || item.image, selectedAttributes: item.selectedAttributes, variantLabel: item.variantLabel });
    }
    const items = [...lines.values()];
    return saveRequest(state, account, company, 'product', items, details);
  };

  const requestServiceQuote = (services, details = {}) => {
    const { state, account } = current();
    if (!account) return reject('Inicia sesión para solicitar una cotización.');
    const selectedIds = (Array.isArray(services) ? services : [services]).map(item => typeof item === 'string' ? item : item?.id);
    if (!selectedIds.length || selectedIds.some(id => !id) || new Set(selectedIds).size !== selectedIds.length) return reject('Selecciona al menos un servicio, sin repetirlo.');
    const selected = selectedIds.map(id => state.services.find(item => item.id === id));
    if (selected.some(item => !item || item.hidden)) return reject('Uno de los servicios ya no está disponible.');
    const companyIds = new Set(selected.map(item => item.companyId || item.sellerId));
    if (companyIds.size !== 1) return reject('Solo puedes cotizar servicios de un mismo vendedor.');
    if (selected.some(item => item.adultOnly || item.restrictionAge) && !isAdult(account.birthday, date())) return reject('Debes tener 18 años cumplidos para solicitar este servicio.');
    const company = state.companies.find(item => item.id === [...companyIds][0]);
    const items = applyOffers(selected, state.offers, date()).map(item => ({ id: quoteLineId({ itemType: 'service', itemId: item.id }), itemType: 'service', itemId: item.id, serviceId: item.id, sku: item.sku, name: item.name, quantity: 1, price: item.price, image: item.image, durationMinutes: item.durationMinutes }));
    return saveRequest(state, account, company, 'service', items, details);
  };
  const requestQuote = (service, details = {}) => requestServiceQuote(details.serviceIds || [service], details);

  const replyQuote = (quoteId, prices, reply) => {
    const { state, session, account } = current();
    const quote = state.quotes.find(item => item.id === quoteId);
    if (!account || !quote || !canManageCompany(state, session, quote.companyId)) return reject('No puedes responder esta cotización.');
    if (quote.step !== 0 || date() > quote.expiresAt) return reject('Esta cotización ya fue respondida o expiró.');
    const response = text(reply);
    if (!response || response.length > 1500) return reject('Escribe las condiciones en un máximo de 1500 caracteres.');
    const incoming = Array.isArray(prices) ? prices : quote.items.length === 1 ? [{ id: quote.items[0].id, price: prices }] : [];
    if (incoming.length !== quote.items.length || new Set(incoming.map(line => line.id)).size !== incoming.length || incoming.some(line => !quote.items.some(item => item.id === line.id))) return reject('Indica el precio unitario de cada artículo de la cotización.');
    const items = quote.items.map(line => ({ ...line, price: Number(incoming.find(item => item.id === line.id).price) }));
    if (items.some(line => !Number.isSafeInteger(line.price) || line.price < 1)) return reject('Cada precio cotizado debe ser un entero mayor que cero.');
    const totals = orderTotals(items, 0);
    api.commit(raw => ({ ...raw, quotes: raw.quotes.map(item => item.id === quoteId ? { ...item, items, ...totals, price: totals.subtotal, reply: response, repliedAt: new Date().toISOString(), step: 1, status: 'responded' } : item) }));
    api.notify('Cotización respondida.');
    return true;
  };

  const acceptQuote = quoteId => {
    const { state, account } = current();
    const quote = state.quotes.find(item => item.id === quoteId);
    if (!quote) return reject('La cotización ya no está disponible.');
    const error = quoteItemsError(state, quote, account, date());
    if (error) return reject(error);
    const company = state.companies.find(item => item.id === quote.companyId);
    const previous = api.getCheckout?.() || {};
    const address = account.addresses.find(item => item.id === previous.addressId) || account.addresses[0] || {};
    const destination = previous.accountId === account.id ? previous : address;
    api.setCheckout({ ...destination, accountId: account.id, addressId: destination.addressId || address.id, companyId: company.id, seller: company.name, quoteId: quote.id, sourceType: quote.sourceType, method: previous.accountId === account.id ? previous.method || 'Tarjeta' : 'Tarjeta', delivery: quote.sourceType === 'product' ? destination.delivery !== false : false, shipping: 0 });
    api.navigate('/resumen');
    api.notify('Revisa el resumen y completa el pago para aceptar la cotización.');
    return true;
  };
  return { requestQuote, requestCartQuote, requestServiceQuote, replyQuote, acceptQuote, startQuoteCheckout: acceptQuote };
}
