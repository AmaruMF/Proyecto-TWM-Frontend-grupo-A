import test from 'node:test';
import assert from 'node:assert/strict';
import { createQuoteActions } from '../src/context/quoteActions.js';
import { createCommerceActions } from '../src/context/commerceActions.js';
import { addQuoteDays, normalizeQuote, processQuoteLifecycle, quoteIsAvailable, quoteItemsError, validQuoteDate } from '../src/utils/quotes.js';

const emitted = '2026-11-10';
function fixture() {
  return {
    accounts: [{ id: 'customer', name: 'Cliente', lastName: 'Prueba', birthday: '2000-01-01', addresses: [{ id: 'address', region: 'Los Lagos', commune: 'Osorno', city: 'Osorno', street: 'Calle', number: '1' }] }, { id: 'seller', name: 'Vendedor', birthday: '1990-01-01' }, { id: 'other', birthday: '1995-01-01' }],
    companies: [{ id: 'company', name: 'Empresa', ownerId: 'seller' }, { id: 'foreign', name: 'Otra empresa', ownerId: 'other' }],
    products: [{ id: 'product', name: 'Producto', sku: 'SKU-P', companyId: 'company', sellerId: 'company', seller: 'Empresa', price: 11900, stock: 10, variants: [{ id: 'red', sku: 'SKU-RED', price: 11900, stock: 6, attributes: { color: 'Rojo' } }, { id: 'blue', sku: 'SKU-BLUE', price: 23800, stock: 4, attributes: { color: 'Azul' } }] }, { id: 'foreign-product', name: 'Ajeno', companyId: 'foreign', sellerId: 'foreign', seller: 'Otra empresa', price: 5000, stock: 3, variants: [{ id: 'foreign-variant', sku: 'FOREIGN', price: 5000, stock: 3, attributes: {} }] }],
    services: [{ id: 'service-a', sku: 'SER-A', name: 'Servicio A', companyId: 'company', sellerId: 'company', seller: 'Empresa', price: 11900, durationMinutes: 60 }, { id: 'service-b', sku: 'SER-B', name: 'Servicio B', companyId: 'company', sellerId: 'company', seller: 'Empresa', price: 23800, durationMinutes: 90 }, { id: 'foreign-service', name: 'Servicio ajeno', companyId: 'foreign', seller: 'Otra empresa', price: 5000, durationMinutes: 60 }],
    userData: { customer: { cart: [{ productId: 'product', variantId: 'red', quantity: 2 }, { productId: 'product', variantId: 'blue', quantity: 1 }, { productId: 'foreign-product', variantId: 'foreign-variant', quantity: 1 }] } },
    offers: [], quotes: [], orders: [], transactions: [],
  };
}
function harness() {
  let state = fixture();
  let session = { accountId: 'customer', role: 'client' };
  let date = emitted;
  let checkout = {};
  const failures = [];
  const api = { getState: () => state, getSession: () => session, getDate: () => date, getCheckout: () => checkout, setCheckout: value => { checkout = value; }, commit: value => { state = typeof value === 'function' ? value(state) : value; }, notify() {}, fail: message => { failures.push(message); return false; }, navigate() {} };
  return { api, actions: createQuoteActions(api), state: () => state, replace: value => { state = value; }, setSession: value => { session = value; }, setDate: value => { date = value; }, checkout: () => checkout, failures };
}
function responded(state, { accepted = false } = {}) {
  return normalizeQuote({ id: 'quote', companyId: 'company', customerId: 'customer', sourceType: 'product', emissionDate: emitted, step: accepted ? 2 : 1, status: accepted ? 'accepted' : 'responded', items: [{ itemType: 'product', itemId: 'product', variantId: 'red', sku: 'SKU-RED', quantity: 2, price: 10000 }] }, state, emitted);
}

test('cotizar carrito incluye solo empresa seleccionada y conserva variantes y los otros vendedores', () => {
  const h = harness();
  const before = structuredClone(h.state().userData.customer.cart);
  assert.equal(h.actions.requestCartQuote('company'), true);
  const quote = h.state().quotes[0];
  assert.equal(quote.customerId, 'customer');
  assert.equal(quote.companyId, 'company');
  assert.equal(quote.items.length, 2);
  assert.deepEqual(quote.items.map(line => line.variantId), ['red', 'blue']);
  assert.equal(quote.total, 47600);
  assert.equal(quote.net + quote.tax, quote.total);
  assert.deepEqual(h.state().userData.customer.cart, before);
  assert.equal(quote.emissionDate, emitted);
  assert.equal(quote.expiresAt, addQuoteDays(emitted, 15));
});

test('líneas repetidas válidas se consolidan y cantidades superiores al stock se rechazan', () => {
  const h = harness();
  h.state().userData.customer.cart.push({ productId: 'product', variantId: 'red', quantity: 1 });
  assert.equal(h.actions.requestCartQuote('company'), true);
  assert.equal(h.state().quotes[0].items.find(line => line.variantId === 'red').quantity, 3);
  assert.equal(new Set(h.state().quotes[0].items.map(line => line.id)).size, 2);
  h.state().userData.customer.cart.push({ productId: 'product', variantId: 'red', quantity: 6 });
  assert.equal(h.actions.requestCartQuote('company'), false);
  assert.equal(h.state().quotes.length, 1);
});

test('servicios múltiples deben pertenecer al mismo vendedor y cumplir edad y fecha', () => {
  const h = harness();
  assert.equal(h.actions.requestServiceQuote(['service-a', 'service-b'], { date: '2026-12-01', detail: 'Necesito ambos servicios.' }), true);
  assert.equal(h.state().quotes[0].items.length, 2);
  assert.equal(h.state().quotes[0].sourceType, 'service');
  assert.equal(h.actions.requestServiceQuote(['service-a', 'foreign-service'], { date: '2026-12-01', detail: 'No debe mezclar empresas.' }), false);
  assert.equal(h.actions.requestServiceQuote(['service-a', 'service-a'], { date: '2026-12-01', detail: 'No debe repetir.' }), false);
  assert.equal(h.actions.requestServiceQuote(['service-a'], { date: '2026-02-31', detail: 'Fecha inválida.' }), false);
  h.state().accounts[0].birthday = '2010-01-01';
  h.state().services[1].adultOnly = true;
  assert.equal(h.actions.requestServiceQuote(['service-a', 'service-b'], { date: '2026-12-01', detail: 'Restringido.' }), false);
  assert.equal(h.state().quotes.length, 1);
});

test('vendedor responde todos los precios y aceptación prepara checkout sin crear venta ni aceptar todavía', () => {
  const h = harness();
  h.actions.requestCartQuote('company');
  const quote = h.state().quotes[0];
  const prices = quote.items.map(line => ({ id: line.id, price: 10000 }));
  assert.equal(h.actions.replyQuote(quote.id, prices, 'Precio acordado.'), false);
  h.setSession({ accountId: 'seller', role: 'seller' });
  assert.equal(h.actions.replyQuote(quote.id, prices.slice(0, 1), 'Falta una línea.'), false);
  assert.equal(h.actions.replyQuote(quote.id, prices, 'Precio acordado.'), true);
  h.setSession({ accountId: 'other', role: 'client' });
  assert.equal(h.actions.acceptQuote(quote.id), false);
  h.setSession({ accountId: 'customer', role: 'client' });
  assert.equal(h.actions.acceptQuote(quote.id), true);
  assert.equal(h.checkout().quoteId, quote.id);
  assert.equal(h.checkout().companyId, 'company');
  assert.equal(h.checkout().sourceType, 'product');
  assert.equal(h.state().quotes[0].step, 1);
  assert.equal(h.state().orders.length, 0);
  assert.equal(h.state().transactions.length, 0);
});

test('día 15 permanece vigente, día 16 expira y deja de responder o aceptar', () => {
  const state = fixture();
  state.quotes = [responded(state)];
  const day15 = processQuoteLifecycle(state, addQuoteDays(emitted, 15));
  assert.equal(day15.quotes[0].step, 1);
  assert.equal(quoteIsAvailable(day15.quotes[0], addQuoteDays(emitted, 15)), true);
  const day16 = processQuoteLifecycle(day15, addQuoteDays(emitted, 16));
  assert.equal(day16.quotes[0].step, 3);
  assert.equal(day16.quotes[0].status, 'expired');
  assert.equal(quoteIsAvailable(day16.quotes[0], addQuoteDays(emitted, 16)), false);
  assert.equal(day16.quotes[0].priceHistory.length, 0);
  const h = harness(); h.replace(day16); h.setDate(addQuoteDays(emitted, 16));
  assert.equal(h.actions.acceptQuote('quote'), false);
  h.setSession({ accountId: 'seller', role: 'seller' });
  assert.equal(h.actions.replyQuote('quote', 12000, 'Ya vencida.'), false);
});

test('precio pactado no cambia durante vigencia y ajuste semanal inicia en día 22 con ofertas de esa fecha', () => {
  const state = fixture();
  state.quotes = [responded(state)];
  state.products[0].variants[0].price = 20000;
  state.offers = [{ id: 'offer', productId: 'product', discount: 25, enabled: true, start: addQuoteDays(emitted, 22), end: addQuoteDays(emitted, 22) }];
  const day15 = processQuoteLifecycle(state, addQuoteDays(emitted, 15));
  assert.equal(day15.quotes[0].items[0].price, 10000);
  const day21 = processQuoteLifecycle(day15, addQuoteDays(emitted, 21));
  assert.equal(day21.quotes[0].items[0].price, 10000);
  const day22 = processQuoteLifecycle(day21, addQuoteDays(emitted, 22));
  assert.equal(day22.quotes[0].items[0].price, 15000);
  assert.equal(day22.quotes[0].priceHistory.length, 1);
  assert.equal(day22.quotes[0].priceHistory[0].previousTotal, 20000);
  assert.equal(day22.quotes[0].total, 30000);
  assert.equal(processQuoteLifecycle(day22, addQuoteDays(emitted, 22)), day22);
});

test('ajustes recuperan semanas 22,29,36,43 de forma idempotente; día 45 conserva y día 46 elimina sin tocar ventas', () => {
  const state = fixture();
  state.quotes = [responded(state)];
  state.orders = [{ id: 'historic-order', quoteId: 'quote', total: 20000, items: [{ price: 10000, quantity: 2 }] }];
  const orderSnapshot = structuredClone(state.orders);
  const day45 = processQuoteLifecycle(state, addQuoteDays(emitted, 45));
  assert.equal(day45.quotes.length, 1);
  assert.deepEqual(day45.quotes[0].priceHistory.map(item => item.at), [22, 29, 36, 43].map(day => addQuoteDays(emitted, day)));
  assert.equal(processQuoteLifecycle(day45, addQuoteDays(emitted, 45)), day45);
  const day46 = processQuoteLifecycle(day45, addQuoteDays(emitted, 46));
  assert.deepEqual(day46.quotes, []);
  assert.deepEqual(day46.orders, orderSnapshot);
});

test('cotización aceptada no se revaloriza aunque conserva eliminación después del día 45', () => {
  const state = fixture();
  state.quotes = [responded(state, { accepted: true })];
  state.products[0].variants[0].price = 30000;
  const day45 = processQuoteLifecycle(state, addQuoteDays(emitted, 45));
  assert.equal(day45.quotes[0].step, 2);
  assert.equal(day45.quotes[0].total, 20000);
  assert.deepEqual(day45.quotes[0].priceHistory, []);
  assert.deepEqual(processQuoteLifecycle(day45, addQuoteDays(emitted, 46)).quotes, []);
});

test('aceptación revalida stock, edad, empresa y duplicación de pedidos', () => {
  const state = fixture();
  const quote = responded(state);
  assert.equal(quoteItemsError(state, quote, state.accounts[0], emitted), '');
  state.products[0].variants[0].stock = 1;
  assert.match(quoteItemsError(state, quote, state.accounts[0], emitted), /stock/);
  state.products[0].variants[0].stock = 6; state.products[0].adultOnly = true; state.accounts[0].birthday = '2010-01-01';
  assert.match(quoteItemsError(state, quote, state.accounts[0], emitted), /18 años/);
  state.accounts[0].birthday = '2000-01-01'; state.products[0].companyId = 'foreign';
  assert.match(quoteItemsError(state, quote, state.accounts[0], emitted), /disponible/);
  state.products[0].companyId = 'company'; state.orders.push({ quoteId: quote.id });
  assert.match(quoteItemsError(state, quote, state.accounts[0], emitted), /compra registrada/);
});

test('cantidades y valores inválidos explícitos no se convierten en valores aceptables al normalizar', () => {
  const state = fixture();
  const quote = responded(state);
  quote.items[0].quantity = 0;
  assert.match(quoteItemsError(state, quote, state.accounts[0], emitted), /inválidos/);
  quote.items[0].quantity = 1; quote.items[0].price = 0;
  assert.match(quoteItemsError(state, quote, state.accounts[0], emitted), /inválidos/);
});

test('fechas inválidas no se aceptan y la vigencia deriva siempre de los 15 días de emisión', () => {
  assert.equal(validQuoteDate('2026-02-31'), false);
  assert.equal(validQuoteDate('2026-11-10'), true);
  const state = fixture();
  const quote = normalizeQuote({ ...responded(state), expiresAt: '2028-01-01' }, state, emitted);
  assert.equal(quote.expiresAt, addQuoteDays(emitted, 15));
  assert.equal(processQuoteLifecycle(state, 'invalid'), state);
});

test('flujo integrado conserva precios pactados, acepta solo tras pagar y conserva orden al eliminar cotización', () => {
  const h = harness();
  const commerce = createCommerceActions(h.api);
  h.actions.requestCartQuote('company');
  const requested = h.state().quotes[0];
  h.setSession({ accountId: 'seller', role: 'seller' });
  h.actions.replyQuote(requested.id, requested.items.map(line => ({ id: line.id, price: 10000 })), 'Valores acordados por variante.');
  h.setSession({ accountId: 'customer', role: 'client' });
  h.actions.acceptQuote(requested.id);
  h.api.setCheckout({ ...h.checkout(), delivery: false });
  h.state().products[0].variants.forEach(variant => { variant.price = 90000; });
  h.state().offers = [{ id: 'offer', productId: 'product', enabled: true, discount: 50, start: emitted, end: '2026-12-31' }];
  assert.equal(commerce.purchase({ method: 'Transferencia' }), false);
  assert.equal(h.state().quotes[0].step, 1);
  assert.equal(h.state().orders.length, 0);
  assert.equal(commerce.purchase({ method: 'Transferencia', reference: 'TRF-COTIZACION' }), true);
  assert.equal(h.state().quotes[0].step, 2);
  assert.equal(h.state().quotes[0].status, 'accepted');
  const order = h.state().orders[0];
  assert.equal(order.total, 30000);
  assert.equal(order.net + order.tax, order.total);
  assert.equal(order.quoteId, requested.id);
  assert.equal(order.quoteSnapshot.items[0].price, 10000);
  assert.equal(order.transferReference, 'TRF-COTIZACION');
  assert.equal(h.state().products[0].variants[0].price, 90000);
  assert.equal(h.state().products[0].variants[0].stock, 4);
  assert.equal(h.state().products[0].variants[1].stock, 3);
  assert.deepEqual(h.state().userData.customer.cart.map(line => line.productId), ['foreign-product']);
  assert.equal(commerce.purchase({ method: 'Otro medio' }), false);
  assert.equal(h.state().orders.length, 1);
  const cleaned = processQuoteLifecycle(h.state(), addQuoteDays(emitted, 46));
  assert.deepEqual(cleaned.quotes, []);
  assert.deepEqual(cleaned.orders[0], order);
});

test('pago integrado de varios servicios conserva fecha solicitada sin envío ni cambios en stock físico', () => {
  const h = harness();
  const commerce = createCommerceActions(h.api);
  h.actions.requestServiceQuote(['service-a', 'service-b'], { date: '2026-12-01', detail: 'Dos servicios para esa fecha.' });
  const requested = h.state().quotes[0];
  h.setSession({ accountId: 'seller', role: 'seller' });
  h.actions.replyQuote(requested.id, requested.items.map(line => ({ id: line.id, price: 15000 })), 'Ambos servicios en la fecha indicada.');
  h.setSession({ accountId: 'customer', role: 'client' });
  assert.equal(h.actions.acceptQuote(requested.id), true);
  const stock = structuredClone(h.state().products);
  assert.equal(commerce.purchase({ method: 'Otro medio' }), true);
  const order = h.state().orders[0];
  assert.equal(order.isService, true);
  assert.equal(order.delivery, false);
  assert.equal(order.shipping, 0);
  assert.equal(order.scheduledDate, '2026-12-01');
  assert.equal(order.date, emitted);
  assert.equal(order.items.length, 2);
  assert.equal(order.total, 30000);
  assert.deepEqual(h.state().products, stock);
});
