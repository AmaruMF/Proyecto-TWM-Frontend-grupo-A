import { applyOffers, getVariants, orderTotals, resolveVariant, today } from './commerce.js';
import { isAdult } from './validation.js';

export const quoteStatuses = ['requested', 'responded', 'accepted', 'expired'];
export const quoteStatusLabel = quote => ({ requested: 'Solicitada', responded: 'Respondida', accepted: 'Aceptada por el cliente', expired: 'Expirada' })[quote.status || quoteStatuses[quote.step || 0]];
export const validQuoteDate = value => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return false;
  const parsed = new Date(value + 'T12:00:00Z');
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
};
export function addQuoteDays(value, days) {
  const date = new Date(value + 'T12:00:00Z');
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}
const dayDifference = (later, earlier) => Math.round((new Date(later + 'T12:00:00Z') - new Date(earlier + 'T12:00:00Z')) / 86400000);
const timestampDate = value => value && !Number.isNaN(new Date(value).getTime()) ? new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/Santiago' }).format(new Date(value)) : null;
export const quoteLineId = line => line.id || `${line.itemType || (line.serviceId ? 'service' : 'product')}:${line.itemId || line.serviceId || line.productId}:${line.variantId || ''}`;

function catalogItem(state, line, date) {
  const service = line.itemType === 'service' || Boolean(line.serviceId);
  const id = line.itemId || line.serviceId || line.productId;
  const raw = (service ? state.services : state.products).find(item => item.id === id);
  if (!raw) return null;
  const item = applyOffers([raw], state.offers || [], date)[0];
  const variant = service ? null : resolveVariant(item, line.variantId);
  return { raw, item, variant, price: service ? item.price : variant?.price };
}

export function normalizeQuote(quote, state, date = today()) {
  const emissionDate = validQuoteDate(quote.emissionDate) ? quote.emissionDate : timestampDate(quote.sentAt || quote.createdAt) || (validQuoteDate(quote.date) && quote.date <= date ? quote.date : date);
  const initial = Array.isArray(quote.items) && quote.items.length ? quote.items : quote.serviceId ? [{ itemType: 'service', itemId: quote.serviceId, serviceId: quote.serviceId, sku: quote.serviceSku, name: quote.serviceName, quantity: 1, price: quote.price || quote.referencePrice }] : [];
  const items = initial.map(line => {
    const itemType = line.itemType || (line.serviceId ? 'service' : 'product');
    const itemId = line.itemId || line.serviceId || line.productId;
    const selected = catalogItem(state, { ...line, itemType, itemId }, date);
    const price = line.price !== null && line.price !== undefined && line.price !== '' ? Number(line.price) : Number(selected?.price || 0);
    const record = { ...line, itemType, itemId, ...(itemType === 'service' ? { serviceId: itemId } : { productId: itemId }), sku: line.sku || selected?.variant?.sku || selected?.item?.sku || '', name: line.name || selected?.item?.name || 'Publicación no disponible', quantity: line.quantity === null || line.quantity === undefined ? 1 : Number(line.quantity), price };
    if (itemType === 'product' && !record.variantId && getVariants(selected?.item).length === 1) record.variantId = getVariants(selected.item)[0].id;
    record.id = quoteLineId(record);
    return record;
  });
  const step = quote.status === 'accepted' || quote.step === 2 ? 2 : quote.status === 'expired' || quote.step === 3 ? 3 : quote.status === 'responded' || quote.step === 1 ? 1 : 0;
  const sourceType = quote.sourceType || (items.every(item => item.itemType === 'service') ? 'service' : 'product');
  const totals = orderTotals(items, 0);
  return { ...quote, sourceType, items, emissionDate, expiresAt: addQuoteDays(emissionDate, 15), deleteAfter: addQuoteDays(emissionDate, 45), requestedDate: quote.requestedDate || (sourceType === 'service' && validQuoteDate(quote.date) ? quote.date : undefined), date: quote.requestedDate || quote.date || emissionDate, step, status: quoteStatuses[step], ...totals, price: totals.subtotal, lastAdjustedAt: quote.lastAdjustedAt || null, priceHistory: quote.priceHistory || [] };
}

export function quoteIsAvailable(quote, date = today()) {
  return quote && quote.step === 1 && quote.status !== 'expired' && quote.status !== 'accepted' && validQuoteDate(quote.expiresAt) && date <= quote.expiresAt && date >= quote.emissionDate;
}

export function quoteItemsError(state, source, account, date = today()) {
  const quote = normalizeQuote(source, state, date);
  if (!account || quote.customerId !== account.id) return 'No puedes utilizar esta cotización.';
  if (!quoteIsAvailable(quote, date)) return 'Esta cotización ya no está disponible para aceptar.';
  if ((state.orders || []).some(order => order.quoteId === quote.id)) return 'Esta cotización ya tiene una compra registrada.';
  const company = state.companies.find(item => item.id === quote.companyId && !item.disabled);
  if (!company || company.ownerId === account.id) return 'La empresa de esta cotización no está disponible.';
  if (!quote.items.length) return 'La cotización no tiene artículos.';
  const quantities = new Map();
  for (const line of quote.items) {
    const selected = catalogItem(state, line, date);
    if (!selected || selected.item.hidden || (selected.item.companyId || selected.item.sellerId) !== company.id) return 'Una publicación de la cotización ya no está disponible.';
    if ((selected.item.adultOnly || selected.item.restrictionAge) && !isAdult(account.birthday, date)) return 'Debes tener 18 años cumplidos para adquirir este artículo.';
    if (!Number.isSafeInteger(line.price) || line.price < 1 || !Number.isSafeInteger(line.quantity) || line.quantity < 1) return 'La cotización contiene valores o cantidades inválidos.';
    if (line.itemType === 'product') {
      if (!selected.variant) return 'Una variante de la cotización ya no está disponible.';
      const key = `${line.itemId}:${selected.variant.id}`;
      const quantity = (quantities.get(key) || 0) + line.quantity;
      if (quantity > selected.variant.stock) return 'La cantidad cotizada supera el stock disponible.';
      quantities.set(key, quantity);
    }
  }
  return '';
}

export function processQuoteLifecycle(state, date = today()) {
  if (!validQuoteDate(date) || !Array.isArray(state.quotes)) return state;
  let changed = false;
  const quotes = [];
  for (const original of state.quotes) {
    let quote = normalizeQuote(original, state, date);
    if (date > quote.deleteAfter) { changed = true; continue; }
    if (quote.step !== 2 && (date > quote.expiresAt || quote.step === 3)) {
      quote = { ...quote, step: 3, status: 'expired', expiredAt: quote.expiredAt || addQuoteDays(quote.expiresAt, 1) };
      const elapsed = dayDifference(date, quote.emissionDate);
      for (let day = 22; day <= Math.min(elapsed, 45); day += 7) {
        const scheduled = addQuoteDays(quote.emissionDate, day);
        if (quote.lastAdjustedAt && scheduled <= quote.lastAdjustedAt) continue;
        const previousTotal = quote.price;
        const items = quote.items.map(line => { const selected = catalogItem(state, line, scheduled); return selected?.price > 0 ? { ...line, price: selected.price } : line; });
        const totals = orderTotals(items, 0);
        quote = { ...quote, items, ...totals, price: totals.subtotal, lastAdjustedAt: scheduled, priceHistory: [...quote.priceHistory, { at: scheduled, previousTotal, total: totals.subtotal }] };
      }
    }
    if (JSON.stringify(original) !== JSON.stringify(quote)) changed = true;
    quotes.push(quote);
  }
  return changed ? { ...state, quotes } : state;
}
