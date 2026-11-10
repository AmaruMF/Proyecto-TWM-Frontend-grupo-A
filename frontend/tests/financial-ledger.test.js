import test from 'node:test';
import assert from 'node:assert/strict';
import { createMarketplace } from '../src/data/createMarketplace.js';
import { createCommerceActions } from '../src/context/commerceActions.js';
import { createReturnActions, refundAvailability } from '../src/context/returnActions.js';
import { getCheckoutItems, normalizeFinancialRecord, transactionDetail } from '../src/utils/financial.js';
import { normalizeQuote } from '../src/utils/quotes.js';

function fixture() {
  let state = structuredClone(createMarketplace());
  state.refunds = [];
  let session = { accountId: 'account-milla', role: 'client' };
  let checkout = {};
  let date = '2026-11-10';
  const failures = [];
  const api = { getState: () => state, commit: update => { state = typeof update === 'function' ? update(state) : update; }, getSession: () => session, getCheckout: () => checkout, setCheckout: update => { checkout = typeof update === 'function' ? update(checkout) : update; }, getDate: () => date, notify: () => {}, fail: message => { failures.push(message); return false; }, navigate: () => {} };
  return { api, commerce: createCommerceActions(api), returns: createReturnActions(api), failures, get state() { return state; }, get checkout() { return checkout; }, set checkout(value) { checkout = value; }, set session(value) { session = value; }, set date(value) { date = value; } };
}

function respondedQuote(f, { service = false, price = 12000, quantity = 1 } = {}) {
  const item = service ? f.state.services[0] : f.state.products.find(record => record.id === 'mouse');
  const line = service ? { itemType: 'service', itemId: item.id, serviceId: item.id, name: item.name, quantity, price, sku: item.sku } : { itemType: 'product', itemId: item.id, productId: item.id, name: item.name, variantId: item.variants[0].id, quantity, price, sku: item.variants[0].sku };
  const quote = normalizeQuote({ id: `quote-${service ? 'service' : 'product'}`, companyId: item.companyId, customerId: 'account-milla', items: [line], sourceType: service ? 'service' : 'product', emissionDate: '2026-11-10', date: service ? '2026-11-20' : '2026-11-10', step: 1, status: 'responded' }, f.state, '2026-11-10');
  f.state.quotes.unshift(quote);
  const address = f.state.accounts.find(account => account.id === 'account-milla').addresses[0];
  f.checkout = { accountId: 'account-milla', companyId: item.companyId, quoteId: quote.id, delivery: !service, method: 'Transferencia', ...address, addressId: address.id };
  return { quote, item };
}

test('pagar cotización conserva precio pactado, desglose y referencia sin consumir extras del carrito', () => {
  const f = fixture();
  const { quote, item } = respondedQuote(f);
  item.variants[0].stock = 5;
  f.state.userData['account-milla'].cart = [{ productId: item.id, variantId: item.variants[0].id, quantity: 3 }, { productId: item.id, variantId: item.variants[1].id, quantity: 1 }];
  item.variants[0].price = 999999;
  assert.equal(getCheckoutItems(f.state, f.checkout, '2026-11-10')[0].price, 12000);
  assert.equal(f.commerce.purchase({ method: 'Transferencia', reference: 'TRANS-COT-001' }), true);
  const order = f.state.orders[0];
  assert.equal(order.items[0].price, 12000);
  assert.equal(order.net + order.tax, 12000);
  assert.equal(order.total, 16990);
  assert.equal(order.transferReference, 'TRANS-COT-001');
  assert.equal(order.quoteSnapshot.emissionDate, quote.emissionDate);
  assert.equal(f.state.quotes.find(record => record.id === quote.id).step, 2);
  assert.equal(f.state.userData['account-milla'].cart[0].quantity, 2);
  assert.equal(f.state.userData['account-milla'].cart[1].quantity, 1);
  assert.equal(item.variants[0].price, 999999);
  assert.equal(f.state.products.find(record => record.id === item.id).variants[0].stock, 4);
  const payment = f.state.transactions[0];
  assert.equal(order.paymentId, payment.id);
  assert.equal(payment.orderId, order.id);
  assert.deepEqual(payment.items, order.items);
  assert.equal(f.commerce.purchase({ method: 'Transferencia', reference: 'DOUBLE' }), false);
});

test('cotizaciones vencidas o ajenas no crean cobros ni descuentan stock', () => {
  const f = fixture();
  const { item } = respondedQuote(f);
  const before = structuredClone(f.state);
  f.date = '2026-11-26';
  assert.equal(f.commerce.purchase({ method: 'Otro medio' }), false);
  assert.deepEqual(f.state, before);
  f.date = '2026-11-10';
  f.session = { accountId: 'account-cjesus', role: 'client' };
  f.checkout = { ...f.checkout, accountId: 'account-cjesus' };
  assert.equal(f.commerce.purchase({ method: 'Otro medio' }), false);
  assert.equal(f.state.products.find(record => record.id === item.id).stock, before.products.find(record => record.id === item.id).stock);
});

test('el último día de vigencia permite pagar y una baja de publicación posterior lo bloquea', () => {
  const f = fixture();
  const { item } = respondedQuote(f);
  f.date = '2026-11-25';
  item.hidden = true;
  assert.equal(f.commerce.purchase({ method: 'Otro medio' }), false);
  item.hidden = false;
  assert.equal(f.commerce.purchase({ method: 'Otro medio' }), true);
  assert.equal(f.state.orders[0].date, '2026-11-25');
  assert.equal(f.state.orders[0].items[0].price, 12000);
});

test('pago de varios servicios no cobra despacho ni toca inventario y conserva líneas con serviceId', () => {
  const f = fixture();
  const { quote, item } = respondedQuote(f, { service: true });
  const another = f.state.services[1];
  quote.items.push({ id: 'service-line-2', itemType: 'service', serviceId: another.id, itemId: another.id, name: another.name, sku: another.sku, quantity: 1, price: 8000 });
  f.checkout = { ...f.checkout, delivery: true };
  const inventory = structuredClone(f.state.products);
  assert.equal(f.commerce.purchase({ method: 'Tarjeta', lastFour: '0456', cvv: '999', cardNumber: '4111111111110456' }), true);
  const order = f.state.orders[0];
  assert.equal(order.isService, true);
  assert.equal(order.delivery, false);
  assert.equal(order.shipping, 0);
  assert.equal(order.total, 20000);
  assert.equal(order.items[0].serviceId, item.id);
  assert.equal(order.items[1].serviceId, another.id);
  assert.deepEqual(f.state.products, inventory);
  assert.equal(order.lastFour, '0456');
  assert.equal(JSON.stringify(f.state).includes('4111111111110456'), false);
  assert.equal(JSON.stringify(order).includes('cvv'), false);
});

function deliveredPurchase(f) {
  const { item } = respondedQuote(f);
  f.commerce.purchase({ method: 'Transferencia', reference: 'PAY-RETURN' });
  const order = f.state.orders[0];
  order.step = 3;
  return { order, item };
}

test('reembolso requiere aprobación y pago completado, conserva trazabilidad y no devuelve el envío', () => {
  const f = fixture();
  const { order } = deliveredPurchase(f);
  assert.equal(f.returns.requestReturn(order.id, { reason: 'Producto defectuoso', detail: 'El artículo no funciona.' }), true);
  const request = f.state.returns[0];
  assert.equal(request.total, 12000);
  assert.equal(f.returns.issueRefund(request.id), false);
  f.session = { accountId: 'account-cjesus', role: 'seller' };
  assert.equal(f.returns.reviewReturn(request.id, 'Aprobada'), true);
  assert.equal(f.returns.issueRefund(request.id, 'REFUND-001'), true);
  const refund = f.state.refunds[0];
  assert.equal(refund.orderId, order.id);
  assert.equal(refund.returnId, request.id);
  assert.equal(refund.paymentId, order.paymentId);
  assert.equal(refund.amount, 12000);
  assert.equal(refund.net + refund.tax, refund.amount);
  assert.equal(refund.shipping, 0);
  assert.equal(refund.reference, 'REFUND-001');
  assert.equal(f.state.orders[0].refundedAmount, 12000);
  assert.equal(f.state.orders[0].total, 16990);
  assert.equal(f.state.returns[0].refundId, refund.id);
  const movement = f.state.transactions.find(transaction => transaction.refundId === refund.id);
  assert.equal(movement.type, 'refund');
  assert.equal(movement.total, refund.amount);
  assert.equal(movement.customerId, order.customerId);
  assert.equal(movement.companyId, order.companyId);
  assert.equal(f.returns.issueRefund(request.id, 'AGAIN'), false);
  assert.equal(f.state.refunds.length, 1);
});

test('no permite devolución ajena, doble solicitud, vendedor ajeno ni cobrar un pago pendiente', () => {
  const f = fixture();
  const { order } = deliveredPurchase(f);
  f.session = { accountId: 'account-cjesus', role: 'client' };
  assert.equal(f.returns.requestReturn(order.id, { reason: 'Otro', detail: 'Intento ajeno' }), false);
  f.session = { accountId: 'account-milla', role: 'client' };
  assert.equal(f.returns.requestReturn(order.id, { reason: 'Otro', detail: 'Solicitud propia' }), true);
  assert.equal(f.returns.requestReturn(order.id, { reason: 'Otro', detail: 'Duplicada' }), false);
  const request = f.state.returns[0];
  f.session = { accountId: 'other', role: 'seller' };
  assert.equal(f.returns.reviewReturn(request.id, 'Aprobada'), false);
  f.session = { accountId: 'account-cjesus', role: 'seller' };
  assert.equal(f.returns.reviewReturn(request.id, 'Aprobada'), true);
  f.state.transactions.find(transaction => transaction.id === order.paymentId).status = 'Pendiente';
  assert.equal(f.returns.issueRefund(request.id), false);
  assert.equal(f.state.refunds.length, 0);
  assert.equal(f.state.transactions.find(transaction => transaction.id === order.paymentId).status, 'Pendiente');
});

test('registros antiguos sin prueba de pago no generan reembolsos ni datos financieros inventados', () => {
  const f = fixture();
  const order = f.state.orders.find(record => record.id === '10679');
  const request = { id: 'legacy-return', orderId: order.id, customerId: order.customerId, companyId: order.companyId, status: 'Aprobada', step: 2 };
  f.state.returns.push(request);
  assert.ok(refundAvailability(f.state, request).error);
  const legacy = { id: 'old-payment', description: 'Registro antiguo', total: 5000, status: 'Pendiente' };
  assert.deepEqual(normalizeFinancialRecord(legacy, f.state.orders), legacy);
  assert.equal(transactionDetail(legacy, f.state.orders).hasFinancialSnapshot, false);
});

test('un reembolso nunca supera el saldo realmente pagado y el ledger original conserva su estado', () => {
  const f = fixture();
  const { order } = deliveredPurchase(f);
  f.returns.requestReturn(order.id, { reason: 'Otro motivo', detail: 'Prueba de saldo restante.' });
  const request = f.state.returns[0];
  f.state.refunds.push({ id: 'prior-refund', orderId: order.id, returnId: 'prior-return', status: 'completed', amount: 10000 });
  f.session = { accountId: 'account-cjesus', role: 'seller' };
  assert.equal(f.returns.reviewReturn(request.id, 'Aprobada'), true);
  assert.equal(f.returns.issueRefund(request.id), true);
  assert.equal(f.state.refunds[0].amount, 2000);
  const paid = f.state.transactions.find(item => item.id === order.paymentId);
  assert.equal(paid.status, 'Completada');
  assert.equal(paid.refundedAmount, 12000);
  assert.equal(f.state.refunds.reduce((sum, item) => sum + item.amount, 0), 12000);
  assert.ok(paid.refundedAmount <= paid.total);
  const movement = f.state.transactions.find(item => item.type === 'refund');
  assert.equal(movement.items.reduce((sum, item) => sum + item.price * item.quantity, 0), movement.subtotal);
  assert.equal(transactionDetail(movement, f.state.orders).hasFinancialSnapshot, true);
});

test('la prueba de pago usa su ID explícito y rechaza importes anteriores inválidos', () => {
  const f = fixture();
  const { order } = deliveredPurchase(f);
  f.returns.requestReturn(order.id, { reason: 'Otro', detail: 'Prueba de comprobante.' });
  const request = f.state.returns[0];
  const payment = f.state.transactions.find(item => item.id === order.paymentId);
  f.state.transactions.unshift({ ...payment, id: 'unrelated-payment', status: 'Completada' });
  payment.status = 'Pendiente';
  assert.ok(refundAvailability(f.state, request).error);
  payment.status = 'Completada';
  f.state.refunds.push({ id: 'invalid-refund', orderId: order.id, status: 'completed', amount: -1 });
  assert.ok(refundAvailability(f.state, request).error);
});

test('el comprobante conserva el precio y referencias cuando desaparece la cotización o cambia catálogo', () => {
  const f = fixture();
  const { item, quote } = respondedQuote(f);
  f.commerce.purchase({ method: 'Transferencia', reference: 'PERSIST-001' });
  const order = f.state.orders[0];
  const payment = f.state.transactions[0];
  const snapshot = structuredClone(payment);
  f.state.quotes = f.state.quotes.filter(record => record.id !== quote.id);
  item.name = 'Nombre cambiado'; item.variants[0].price = 1;
  const detail = transactionDetail(payment, f.state.orders);
  assert.equal(detail.hasFinancialSnapshot, true);
  assert.equal(detail.items[0].price, 12000);
  assert.equal(detail.transferReference, 'PERSIST-001');
  assert.equal(order.quoteSnapshot.items[0].price, 12000);
  assert.deepEqual(payment, snapshot);
  const inconsistent = { ...payment, tax: payment.tax + 1 };
  assert.equal(transactionDetail(inconsistent, f.state.orders).hasFinancialSnapshot, false);
});
