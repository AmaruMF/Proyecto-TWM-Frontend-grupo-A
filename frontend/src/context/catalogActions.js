import { recommendationError } from '../utils/categories.js';

export function wishlistEntries(list) {
  const items = Array.isArray(list?.items) ? list.items : [...(list?.productIds || []).map(itemId => ({ itemType: 'product', itemId })), ...(list?.serviceIds || []).map(itemId => ({ itemType: 'service', itemId }))];
  const seen = new Set();
  return items.filter(item => {
    if (!item || !['product', 'service'].includes(item.itemType) || typeof item.itemId !== 'string' || !item.itemId) return false;
    const key = `${item.itemType}:${item.itemId}`;
    if (seen.has(key)) return false;
    seen.add(key); return true;
  }).map(item => ({ itemType: item.itemType, itemId: item.itemId }));
}

export function normalizeWishlist(list) {
  const items = wishlistEntries(list);
  return { ...list, items, productIds: items.filter(item => item.itemType === 'product').map(item => item.itemId) };
}

export const isFavorite = (list, itemId, itemType = 'product') => wishlistEntries(list).some(item => item.itemType === itemType && item.itemId === itemId);

export function createCatalogActions(api) {
  const toggleFavorite = (itemId, listId = 'favorites', itemType = 'product') => {
    const state = api.getState();
    const session = api.getSession();
    const account = state.accounts.find(item => item.id === session?.accountId);
    if (!account) return api.fail('Inicia sesión para gestionar tu lista de deseos.');
    if (!['product', 'service'].includes(itemType)) return api.fail('Selecciona un producto o servicio válido.');
    const data = state.userData[account.id] || { cart: [], wishlists: [] };
    const lists = data.wishlists || [];
    const existing = lists.find(list => list.id === listId);
    const selected = isFavorite(existing, itemId, itemType);
    const item = state[itemType === 'service' ? 'services' : 'products'].find(item => item.id === itemId);
    if (!selected && (!item || item.hidden)) return api.fail('Esta publicación ya no está disponible.');
    const list = normalizeWishlist(existing || { id: listId, name: 'Mis favoritos', items: [] });
    const items = selected ? list.items.filter(entry => !(entry.itemId === itemId && entry.itemType === itemType)) : [...list.items, { itemId, itemType }];
    const updated = normalizeWishlist({ ...list, items });
    api.commit(current => {
      const user = current.userData[account.id] || { cart: [], wishlists: [] };
      return { ...current, userData: { ...current.userData, [account.id]: { ...user, wishlists: existing ? user.wishlists.map(record => record.id === listId ? updated : record) : [...(user.wishlists || []), updated] } } };
    });
    return true;
  };
  const saveRecommendations = (productId, relatedProductIds) => {
    const state = api.getState();
    const product = state.products.find(item => item.id === productId);
    const error = recommendationError(state, product, relatedProductIds, api.getSession());
    if (error) return api.fail(error);
    api.commit(current => ({ ...current, products: current.products.map(item => item.id === productId ? { ...item, relatedProductIds: [...relatedProductIds] } : item) }));
    api.notify('Recomendaciones actualizadas.');
    return true;
  };
  return { toggleFavorite, saveRecommendations };
}
