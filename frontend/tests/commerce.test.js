import test from 'node:test';
import assert from 'node:assert/strict';
import { addCartItem, applyOffers, checkoutError, completePurchase, orderTotals } from '../src/utils/commerce.js';

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
