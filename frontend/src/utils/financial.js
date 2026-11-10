import { applyOffers, cartItems, orderTotals, resolveVariant, today, variantLabel } from './commerce.js';
import { isAdult } from './validation.js';
import { quoteItemsError } from './quotes.js';

const dateValue = value => /^\d{4}-\d{2}-\d{2}$/.test(value || '') ? value : null;
export const addCalendarDays = (value, days) => {
  if (!dateValue(value)) return null;
  const date = new Date(`${value}T12:00:00Z`);
  if (Number.isNaN(date.getTime())) return null;
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};

export function findCheckoutQuote(data, checkout) {
  return [...(data.myQuotes || []), ...(data.quotes || [])].find(quote => quote.id === checkout?.quoteId);
}

export function getCheckoutItems(data, checkout, date = today()) {
  if (!checkout?.quoteId) {
    const accountCart = data.cart || data.userData?.[checkout?.accountId]?.cart || [];
    return cartItems(accountCart, data.products || []).filter(item => item.companyId === checkout?.companyId);
  }
  const quote = findCheckoutQuote(data, checkout);
  return (quote?.items || []).map(line => {
    const service = line.itemType === 'service' || Boolean(line.serviceId);
    const itemId = line.itemId || line.productId || line.serviceId;
    const source = (service ? data.services : data.products)?.find(item => item.id === itemId);
    const priced = source ? applyOffers([source], data.offers || [], date)[0] : null;
    const variant = !service && priced ? resolveVariant(priced, line.variantId) : null;
    return {
      ...source, ...line, id: itemId, itemId, itemType: service ? 'service' : 'product',
      ...(service ? { serviceId: itemId } : { productId: itemId }),
      companyId: source?.companyId || quote.companyId, sellerId: source?.companyId || quote.companyId,
      price: Number(line.price), quantity: Number(line.quantity), stock: service ? Number.MAX_SAFE_INTEGER : variant?.stock ?? 0,
      unavailableVariant: !service && !variant, hidden: !source || Boolean(source.hidden),
      adultOnly: Boolean(source?.adultOnly || source?.restrictionAge),
      sku: line.sku || variant?.sku || source?.sku, image: line.image || variant?.image || source?.image,
      selectedAttributes: { ...(line.selectedAttributes || variant?.attributes) },
      variantLabel: line.variantLabel || variantLabel(variant), cartKey: line.id || `${service ? 'service' : 'product'}:${itemId}:${line.variantId || ''}`,
    };
  });
}

export function quoteCheckoutError(state, quote, account, date = today()) {
  const error = quote ? quoteItemsError(state, quote, account, date) : 'Esta cotización no pertenece a tu cuenta.';
  if (error) return error;
  if (!account || !quote || quote.customerId !== account.id) return 'Esta cotización no pertenece a tu cuenta.';
  if (quote.step !== 1 || quote.status && quote.status !== 'responded' || state.orders.some(order => order.quoteId === quote.id)) return 'La cotización ya no está disponible para pagar.';
  const expiry = dateValue(quote.expiresAt) || addCalendarDays(quote.emissionDate, 15);
  if (!expiry || date > expiry) return 'La cotización ha expirado. Solicita una nueva antes de comprar.';
  const company = state.companies.find(item => item.id === quote.companyId && !item.disabled);
  if (!company || company.ownerId === account.id) return 'El vendedor de la cotización no está disponible.';
  const items = getCheckoutItems(state, { quoteId: quote.id, companyId: quote.companyId }, date);
  if (!items.length || items.some(item => item.companyId !== company.id || item.hidden || item.unavailableVariant)) return 'Algún artículo o variante de la cotización ya no está disponible.';
  const types = new Set(items.map(item => item.itemType));
  if (types.size !== 1) return 'Una cotización debe contener productos o servicios de un mismo vendedor.';
  const quantities = new Map();
  for (const item of items) {
    if (!Number.isSafeInteger(item.price) || item.price < 1 || !Number.isSafeInteger(item.quantity) || item.quantity < 1) return 'La cotización contiene cantidades o valores inválidos.';
    const key = item.cartKey;
    const count = (quantities.get(key) || 0) + item.quantity;
    if (count > item.stock) return 'El stock actual no alcanza para los productos cotizados.';
    quantities.set(key, count);
  }
  if (items.some(item => item.adultOnly) && !isAdult(account.birthday, date)) return 'Debes tener 18 años cumplidos para adquirir estos artículos.';
  return '';
}

export const checkoutHasProducts = items => items.some(item => item.itemType !== 'service' && !item.serviceId);

export function financialSnapshot(items, shipping = 0) {
  const lines = items.map((item, index) => ({
    id: item.cartKey || item.id || `line-${index}`, itemType: item.itemType === 'service' || item.serviceId ? 'service' : 'product',
    ...(item.serviceId || item.itemType === 'service' ? { serviceId: item.serviceId || item.itemId || item.id } : { productId: item.productId || item.itemId || item.id, variantId: item.variantId }),
    sku: item.sku, name: item.name, image: item.detailImage || item.image, selectedAttributes: { ...item.selectedAttributes }, variantLabel: item.variantLabel || '',
    price: Number(item.price), quantity: Number(item.quantity), lineTotal: Number(item.price) * Number(item.quantity),
  }));
  return { items: lines, ...orderTotals(lines, shipping) };
}

export function returnableAmount(order) {
  if (!Number.isSafeInteger(order?.total) || order.total < 0) return 0;
  const merchandise = (order.items || []).reduce((sum, item) => sum + (Number.isSafeInteger(item.price) && Number.isSafeInteger(item.quantity) ? item.price * item.quantity : 0), 0);
  return Math.max(0, Math.min(merchandise, order.total - (Number(order.shipping) || 0)));
}

export function normalizeFinancialRecord(record, orders = []) {
  const source = record.orderId ? orders.find(order => order.id === record.orderId) : null;
  const items = record.items?.length ? record.items : source?.items;
  if (!items?.length || items.some(item => !Number.isSafeInteger(item.price) || item.price < 1 || !Number.isSafeInteger(item.quantity) || item.quantity < 1)) return record;
  const shipping = Number.isSafeInteger(record.shipping) ? record.shipping : Number.isSafeInteger(source?.shipping) ? source.shipping : 0;
  const snapshot = financialSnapshot(items, shipping);
  // Solo completar importes que se pueden reconstruir de artículos y total históricos.
  if (!Number.isSafeInteger(record.total) || snapshot.total !== record.total) return record;
  return { ...snapshot, ...record, items: record.items?.length ? record.items : snapshot.items };
}

export function transactionDetail(transaction, orders = []) {
  const normalized = normalizeFinancialRecord(transaction, orders);
  const order = orders.find(item => item.id === normalized.orderId);
  const items = normalized.items?.length ? normalized.items : order?.items;
  const financial = ['net', 'tax', 'subtotal', 'shipping', 'total'].every(key => Number.isSafeInteger(normalized[key]) && normalized[key] >= 0) && normalized.net + normalized.tax === normalized.subtotal && normalized.subtotal + normalized.shipping === normalized.total && (!items?.length || items.reduce((sum, item) => sum + item.price * item.quantity, 0) === normalized.subtotal);
  return { ...normalized, items: items || [], hasFinancialSnapshot: financial, order };
}
