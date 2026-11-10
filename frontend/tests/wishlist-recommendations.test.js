import test from 'node:test';
import assert from 'node:assert/strict';
import { createCatalogActions, isFavorite, normalizeWishlist, wishlistEntries } from '../src/context/catalogActions.js';
import { recommendedProducts } from '../src/utils/categories.js';

function fixture() {
  let state = { accounts: [{ id: 'a' }, { id: 'b' }], companies: [{ id: 'shop', ownerId: 'a' }, { id: 'other', ownerId: 'b' }], products: [{ id: 'same', companyId: 'shop' }, { id: 'second', companyId: 'shop' }, { id: 'third', companyId: 'shop' }, { id: 'hidden', companyId: 'shop', hidden: true }, { id: 'foreign', companyId: 'other' }], services: [{ id: 'same', companyId: 'shop' }, { id: 'service-hidden', companyId: 'shop', hidden: true }], userData: { a: { cart: [], wishlists: [{ id: 'favorites', name: 'Favoritos', productIds: ['second'] }] }, b: { cart: [], wishlists: [{ id: 'favorites', name: 'Favoritos', items: [{ itemId: 'foreign', itemType: 'product' }], productIds: ['foreign'] }] } } };
  let session = { accountId: 'a', role: 'client' };
  const notices = [];
  const api = { getState: () => state, getSession: () => session, commit: update => { state = typeof update === 'function' ? update(state) : update; }, notify: message => notices.push(message), fail: message => { notices.push(message); return false; } };
  return { actions: createCatalogActions(api), state: () => state, session: value => { session = value; }, notices };
}

test('lista mixta migra productos legacy y distingue servicios con el mismo identificador', () => {
  const context = fixture();
  const beforeOther = structuredClone(context.state().userData.b);
  assert.equal(context.actions.toggleFavorite('same'), true);
  assert.equal(context.actions.toggleFavorite('same', 'favorites', 'service'), true);
  let list = context.state().userData.a.wishlists[0];
  assert.equal(isFavorite(list, 'same', 'product'), true);
  assert.equal(isFavorite(list, 'same', 'service'), true);
  assert.deepEqual(list.productIds, ['second', 'same']);
  assert.equal(list.items.length, 3);
  assert.equal(context.actions.toggleFavorite('same', 'favorites', 'service'), true);
  list = context.state().userData.a.wishlists[0];
  assert.equal(isFavorite(list, 'same', 'service'), false);
  assert.equal(isFavorite(list, 'same', 'product'), true);
  assert.deepEqual(context.state().userData.b, beforeOther);
});

test('lista de deseos rechaza artículos ocultos nuevos y permite retirar favoritos no disponibles', () => {
  const context = fixture();
  assert.equal(context.actions.toggleFavorite('service-hidden', 'favorites', 'service'), false);
  assert.equal(context.actions.toggleFavorite('unknown'), false);
  assert.equal(context.actions.toggleFavorite('same', 'favorites', 'invalid'), false);
  context.actions.toggleFavorite('same', 'favorites', 'service');
  context.state().services.find(item => item.id === 'same').hidden = true;
  assert.equal(context.actions.toggleFavorite('same', 'favorites', 'service'), true);
  assert.equal(isFavorite(context.state().userData.a.wishlists[0], 'same', 'service'), false);
  context.session(null);
  assert.equal(context.actions.toggleFavorite('second'), false);
});

test('normalización de listas es idempotente y no resucita productIds eliminados del formato canónico', () => {
  const list = normalizeWishlist({ id: 'x', productIds: ['stale'], items: [{ itemType: 'service', itemId: 'a' }, { itemType: 'service', itemId: 'a' }, { itemType: 'product', itemId: 'b' }] });
  assert.deepEqual(list.productIds, ['b']);
  assert.equal(list.items.length, 2);
  assert.deepEqual(normalizeWishlist(list), list);
  assert.deepEqual(wishlistEntries({ productIds: ['b'], serviceIds: ['a'] }), [{ itemType: 'product', itemId: 'b' }, { itemType: 'service', itemId: 'a' }]);
});

test('recomendaciones conservan prioridad, solo admiten productos propios activos y excluyen autorreferencia', () => {
  const context = fixture();
  assert.equal(context.actions.saveRecommendations('same', ['third', 'second']), false);
  context.session({ accountId: 'a', role: 'seller' });
  assert.equal(context.actions.saveRecommendations('same', ['third', 'second']), true);
  const product = context.state().products.find(item => item.id === 'same');
  assert.deepEqual(recommendedProducts(product, context.state().products).map(item => item.id), ['third', 'second']);
  for (const ids of [['same'], ['foreign'], ['hidden'], ['third', 'third']]) assert.equal(context.actions.saveRecommendations('same', ids), false);
  assert.equal(context.actions.saveRecommendations('foreign', ['second']), false);
  context.state().products.find(item => item.id === 'third').hidden = true;
  assert.deepEqual(recommendedProducts(product, context.state().products).map(item => item.id), ['second']);
  assert.equal(context.actions.saveRecommendations('same', []), true);
  assert.deepEqual(context.state().products.find(item => item.id === 'same').relatedProductIds, []);
});
