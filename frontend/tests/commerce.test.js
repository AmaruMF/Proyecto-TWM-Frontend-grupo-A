import test from 'node:test';
import assert from 'node:assert/strict';
import { addCartItem, applyOffers, checkoutError, completePurchase, orderTotals, saveOffer, setProductHidden, dateTimeLabel } from '../src/utils/commerce.js';

const laptop = { id: 'laptop', name: 'Laptop', seller: 'HP', price: 677990, stock: 5 };
const shoe = { id: 'shoe', name: 'Zapatilla', seller: 'Nike', price: 98990, stock: 6 };

test('neto e IVA suman exactamente el subtotal, sin aplicar IVA dos veces', () => {
  const totals = orderTotals([{ ...laptop, quantity: 1 }], 4990);
  assert.equal(totals.subtotal, 677990);
  assert.equal(totals.net + totals.tax, totals.subtotal);
  assert.equal(totals.total, 682980);
  assert.equal(orderTotals([{ price: 1, quantity: 3 }], 0).total, 3);
});

test('el carrito limita la cantidad al stock y rechaza cantidades inválidas', () => {
  assert.deepEqual(addCartItem([{ productId: 'laptop', quantity: 4 }], laptop, 3), [{ productId: 'laptop', quantity: 5 }]);
  assert.deepEqual(addCartItem([], { ...laptop, stock: 0 }), []);
  assert.deepEqual(addCartItem([], laptop, -1), []);
  assert.deepEqual(addCartItem([], laptop, 1.5), []);
});

test('una compra requiere un solo vendedor y cantidades disponibles', () => {
  assert.ok(checkoutError([{ ...laptop, quantity: 1 }, { ...shoe, quantity: 1 }]));
  assert.ok(checkoutError([{ ...laptop, quantity: 6 }]));
  assert.ok(checkoutError([]));
  assert.equal(checkoutError([{ ...laptop, quantity: 5 }]), '');
});

test('comprar conserva otros vendedores, descuenta stock y registra el pedido', () => {
  const state = { products: [laptop, shoe], cart: [{ productId: 'laptop', quantity: 2 }, { productId: 'shoe', quantity: 1 }], orders: [], transactions: [] };
  const result = completePurchase(state, 'HP', { id: '123', date: '2026-10-29', delivery: true, shipping: 4990, address: 'Osorno', method: 'Tarjeta', lastFour: '6802', cvv: '987', cardNumber: '4111111111116802' });
  assert.deepEqual(result.cart, [{ productId: 'shoe', quantity: 1 }]);
  assert.equal(result.products[0].stock, 3);
  assert.equal(state.products[0].stock, 5);
  assert.equal(result.orders[0].total, 1360970);
  assert.equal(result.transactions[0].total, result.orders[0].total);
  assert.equal(result.orders[0].lastFour, '6802');
  assert.equal(JSON.stringify(result).includes('4111111111116802'), false);
  assert.equal(JSON.stringify(result).includes('"cvv"'), false);
});

test('una compra sin stock no modifica el estado', () => {
  const state = { products: [laptop], cart: [{ productId: 'laptop', quantity: 6 }], orders: [], transactions: [] };
  assert.throws(() => completePurchase(state, 'HP', { id: '123' }), /stock/);
  assert.equal(state.orders.length, 0);
});

test('las ofertas solo se aplican dentro de su vigencia y se pueden pausar', () => {
  const offer = { productId: 'laptop', enabled: true, discount: 20, start: '2026-10-29', end: '2026-10-30' };
  assert.equal(applyOffers([laptop], [offer], '2026-10-28')[0].price, 677990);
  assert.equal(applyOffers([laptop], [offer], '2026-10-29')[0].price, 542392);
  assert.equal(applyOffers([laptop], [offer], '2026-10-30')[0].price, 542392);
  assert.equal(applyOffers([laptop], [offer], '2026-10-31')[0].price, 677990);
  assert.equal(applyOffers([laptop], [{ ...offer, enabled: false }], '2026-10-29')[0].price, 677990);
  assert.equal(laptop.price, 677990);
});

test('crear y editar una oferta conserva un solo producto y una sola oferta', () => {
  const offer = { id: 'offer-1', productId: laptop.id, enabled: true, discount: 20, start: '2026-11-08', end: '2026-12-01' };
  const offers = saveOffer([], offer);
  const updated = saveOffer(offers, { ...offer, id: 'new-id', discount: 30 });
  assert.equal(updated.length, 1);
  assert.equal(updated[0].id, offer.id);
  const products = applyOffers([laptop, shoe], updated, '2026-11-08');
  assert.deepEqual(products.map(item => item.id), ['laptop', 'shoe']);
  assert.equal(products[0].price, Math.round(laptop.price * 0.7));
  assert.equal(applyOffers([laptop, shoe], [], '2026-11-08')[0].price, laptop.price);
  assert.equal(offers[0].discount, 20);
});

test('dar de baja bloquea carrito y compra, conserva ventas y permite reactivar', () => {
  const state = { products: [laptop], cart: [{ productId: laptop.id, quantity: 1 }], orders: [], transactions: [] };
  const sold = completePurchase(state, 'HP', { id: 'sale-1', date: '2026-11-08', customer: 'Cliente', createdAt: '2026-11-08T15:30:00Z' });
  const hidden = setProductHidden(sold, laptop.id, true);
  assert.equal(hidden.products.length, 1);
  assert.deepEqual(hidden.orders, sold.orders);
  assert.deepEqual(hidden.transactions, sold.transactions);
  assert.equal(hidden.orders[0].items[0].price, laptop.price);
  assert.equal(hidden.orders[0].customer, 'Cliente');
  assert.deepEqual(addCartItem([], hidden.products[0]), []);
  assert.throws(() => completePurchase({ ...hidden, cart: state.cart }, 'HP', { id: 'sale-2' }), /dados de baja/);
  const active = setProductHidden(hidden, laptop.id, false);
  assert.equal(checkoutError([{ ...active.products[0], quantity: 1 }]), '');
  assert.equal(sold.products[0].hidden, undefined);
});

test('una venta conserva su descuento aunque cambie o se quite la oferta', () => {
  const offer = { productId: laptop.id, enabled: true, discount: 20, start: '2026-11-01', end: '2026-11-30' };
  const state = { products: applyOffers([laptop], [offer], '2026-11-08'), cart: [{ productId: laptop.id, quantity: 1 }], orders: [], transactions: [] };
  const sold = completePurchase(state, 'HP', { id: 'sale-1', date: '2026-11-08' });
  const edited = { ...sold, products: [{ ...laptop, price: 1000 }], offers: [] };
  assert.equal(edited.orders[0].items[0].price, Math.round(laptop.price * 0.8));
  assert.equal(edited.transactions[0].total, edited.orders[0].total);
});

test('la hora de envío se muestra en Chile y no se inventa para registros antiguos', () => {
  assert.match(dateTimeLabel('2026-11-08T15:30:00Z'), /12:30/);
  assert.equal(dateTimeLabel(undefined), 'Fecha y hora no registradas');
});
