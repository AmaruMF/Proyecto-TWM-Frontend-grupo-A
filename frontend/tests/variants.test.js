import test from 'node:test';
import assert from 'node:assert/strict';
import { addCartItem, applyOffers, cartItems, checkoutError, completePurchase, getVariants, resolveVariant, saveOffer } from '../src/utils/commerce.js';

const shirt = {
  id: 'shirt', name: 'Polera', seller: 'Tienda', sellerId: 'seller-1', companyId: 'company-1', price: 10000, stock: 5,
  variants: [
    { id: 'red-l', sku: 'RED-L', attributes: { color: 'Rojo', size: 'L' }, price: 10000, stock: 2 },
    { id: 'blue-m', sku: 'BLUE-M', attributes: { color: 'Azul', size: 'M' }, price: 12000, stock: 3 },
  ],
};

test('el carrito exige variante explícita cuando hay varias y separa cantidades por SKU', () => {
  assert.equal(resolveVariant(shirt), null);
  assert.deepEqual(addCartItem([], shirt), []);
  const cart = addCartItem(addCartItem([], shirt, 9, 'red-l'), shirt, 1, 'blue-m');
  assert.deepEqual(cart.map(entry => [entry.variantId, entry.quantity]), [['red-l', 2], ['blue-m', 1]]);
  const items = cartItems(cart, [shirt]);
  assert.deepEqual(items.map(item => [item.sku, item.stock, item.price]), [['RED-L', 2, 10000], ['BLUE-M', 3, 12000]]);
  assert.equal(items[0].variantLabel, 'Rojo · L');
  assert.notEqual(items[0].cartKey, items[1].cartKey);
});

test('la compra descuenta cada variante exacta, totaliza el stock y conserva una instantánea del SKU', () => {
  const state = { products: [shirt], cart: [{ productId: 'shirt', variantId: 'red-l', quantity: 2 }, { productId: 'shirt', variantId: 'blue-m', quantity: 1 }], orders: [], transactions: [] };
  const sold = completePurchase(state, 'seller-1', { id: 'sale', date: '2026-11-10', customerId: 'buyer', method: 'Transferencia', transferReference: 'REF-123' });
  assert.deepEqual(sold.products[0].variants.map(variant => variant.stock), [0, 2]);
  assert.equal(sold.products[0].stock, 2);
  assert.equal(sold.orders[0].total, 32000);
  assert.equal(sold.orders[0].net + sold.orders[0].tax, 32000);
  assert.equal(sold.orders[0].items[0].sku, 'RED-L');
  assert.equal(sold.orders[0].customerId, 'buyer');
  assert.equal(sold.orders[0].transferReference, 'REF-123');
  assert.equal(sold.cart.length, 0);
  assert.equal(state.products[0].stock, 5);
});

test('no se permite comprar variantes inexistentes ni exceder stock mediante filas duplicadas', () => {
  const invalid = cartItems([{ productId: 'shirt', variantId: 'missing', quantity: 1 }], [shirt]);
  assert.match(checkoutError(invalid), /variante/);
  const duplicated = cartItems([{ productId: 'shirt', variantId: 'red-l', quantity: 2 }, { productId: 'shirt', variantId: 'red-l', quantity: 1 }], [shirt]);
  assert.match(checkoutError(duplicated), /stock/);
});

test('las restricciones etarias bloquean compras de menores y permiten el día exacto de los 18', () => {
  const items = cartItems([{ productId: 'shirt', variantId: 'red-l', quantity: 1 }], [{ ...shirt, adultOnly: true }]);
  assert.match(checkoutError(items, { birthday: '2008-11-11' }, '2026-11-10'), /18/);
  assert.equal(checkoutError(items, { birthday: '2008-11-10' }, '2026-11-10'), '');
});

test('una oferta afecta todas las variantes una sola vez y restaura el precio oficial al expirar', () => {
  const offer = { id: 'offer', productId: 'shirt', enabled: true, start: '2026-11-01', end: '2026-11-30', discount: 20 };
  const discounted = applyOffers([shirt], [offer], '2026-11-10');
  assert.deepEqual(discounted[0].variants.map(variant => variant.price), [8000, 9600]);
  assert.deepEqual(applyOffers(discounted, [offer], '2026-11-10')[0].variants.map(variant => variant.price), [8000, 9600]);
  assert.deepEqual(applyOffers(discounted, [offer], '2026-12-01')[0].variants.map(variant => variant.price), [10000, 12000]);
  assert.deepEqual(shirt.variants.map(variant => variant.price), [10000, 12000]);
});

test('las ofertas de servicios tienen vigencia y una identidad distinta a las de productos', () => {
  const service = { id: 'garden', price: 50000, durationMinutes: 120 };
  const offer = { id: 'service-offer', itemType: 'service', serviceId: 'garden', enabled: true, start: '2026-11-01', end: '2026-11-30', discount: 10 };
  assert.equal(applyOffers([service], [offer], '2026-11-10')[0].price, 45000);
  assert.equal(applyOffers([service], [offer], '2026-12-01')[0].price, 50000);
  const promotions = saveOffer([offer], { id: 'product-offer', productId: 'garden', discount: 20 });
  assert.equal(promotions.length, 2);
});

test('una sola variante se resuelve sin un selector adicional', () => {
  const single = { ...shirt, variants: [shirt.variants[0]] };
  assert.equal(resolveVariant(single).id, 'red-l');
  assert.equal(getVariants({ id: 'legacy', sku: 'SKU', stock: 1, price: 1000 }).length, 1);
});
