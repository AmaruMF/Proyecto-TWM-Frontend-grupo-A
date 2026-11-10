import { isAdult } from './validation.js';

export const currency = (value) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(value);
export const dateLabel = (value) => new Intl.DateTimeFormat('es-CL', { dateStyle: 'medium' }).format(new Date(`${value}T12:00:00`));
export const today = () => new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/Santiago' }).format(new Date());
export const dateTimeLabel = (value) => value && !Number.isNaN(new Date(value).getTime()) ? new Intl.DateTimeFormat('es-CL', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/Santiago' }).format(new Date(value)) : 'Fecha y hora no registradas';

export function getVariants(product) {
  if (Array.isArray(product?.variants) && product.variants.length) return product.variants;
  return product ? [{ id: product.id, sku: product.sku || product.id, price: product.price, stock: product.stock, attributes: {} }] : [];
}

export function resolveVariant(product, variantId) {
  const variants = getVariants(product);
  if (variantId) return variants.find(variant => variant.id === variantId) || null;
  return variants.length === 1 ? variants[0] : null;
}

export const variantLabel = (variant) => Object.values(variant?.attributes || {}).filter(value => value !== null && value !== undefined && String(value).trim() !== '').join(' · ');

export function cartItems(cart, products) {
  return cart.map((entry) => {
    const product = products.find((item) => item.id === entry.productId);
    if (!product) return null;
    const variant = resolveVariant(product, entry.variantId);
    return {
      ...product, quantity: entry.quantity,
      variantId: variant?.id || entry.variantId,
      cartKey: `${product.id}::${variant?.id || entry.variantId || ''}`,
      sku: variant?.sku || product.sku, image: variant?.image || product.image, detailImage: variant?.detailImage || variant?.image || product.detailImage,
      price: variant?.price ?? product.price, stock: variant?.stock ?? 0,
      originalPrice: variant?.originalPrice ?? product.originalPrice,
      selectedAttributes: { ...variant?.attributes }, variantLabel: variantLabel(variant),
      unavailableVariant: !variant,
    };
  }).filter(Boolean);
}

export function orderTotals(items, shipping = 0) {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const net = Math.round(subtotal / 1.19);
  return { subtotal, net, tax: subtotal - net, shipping, total: subtotal + shipping };
}

export function addCartItem(cart, product, quantity = 1, variantId) {
  const variant = resolveVariant(product, variantId);
  if (product.hidden || !variant || !Number.isInteger(quantity) || quantity < 1 || variant.stock < 1) return cart;
  const same = entry => entry.productId === product.id && (entry.variantId || (getVariants(product).length === 1 ? variant.id : '')) === variant.id;
  const existing = cart.find(same);
  const nextQuantity = Math.min(variant.stock, (existing?.quantity || 0) + quantity);
  const entry = { productId: product.id, ...(product.variants?.length || variantId ? { variantId: variant.id } : {}), quantity: nextQuantity };
  return existing ? cart.map(item => same(item) ? { ...item, quantity: nextQuantity } : item) : [...cart, entry];
}

export function checkoutError(items, profile, date = today()) {
  if (!items.length) return 'Selecciona al menos un producto para continuar.';
  if (items.some((item) => item.hidden)) return 'Hay productos dados de baja. Quítalos del carrito para continuar.';
  if (new Set(items.map((item) => item.sellerId || item.companyId || item.seller)).size > 1) return 'Selecciona productos de un mismo vendedor por compra.';
  if (items.some(item => item.unavailableVariant)) return 'Selecciona una variante disponible de cada producto.';
  if (items.some((item) => !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > item.stock)) return 'La cantidad seleccionada supera el stock disponible.';
  const quantities = new Map();
  for (const item of items) {
    const key = item.cartKey || `${item.id}::${item.variantId || ''}`;
    const count = (quantities.get(key) || 0) + item.quantity;
    if (count > item.stock) return 'La cantidad seleccionada supera el stock disponible.';
    quantities.set(key, count);
  }
  if (profile && items.some(item => item.adultOnly || item.restrictionAge) && !isAdult(profile.birthday, date)) return 'Debes tener 18 años cumplidos para adquirir este artículo.';
  return '';
}

function offerTarget(offer) {
  return `${offer.itemType || (offer.serviceId ? 'service' : 'product')}::${offer.serviceId || offer.productId}`;
}

export function applyOffers(items, offers, date) {
  return items.map((item) => {
    const service = item.itemType === 'service' || Boolean(item.durationMinutes && !item.variants);
    const offer = offers.find(promotion => (service ? promotion.serviceId === item.id : promotion.productId === item.id) && promotion.enabled && promotion.start <= date && promotion.end >= date);
    const basePrice = Number(item.basePrice ?? item.price);
    const discounted = value => offer ? Math.max(1, Math.round(value * (1 - offer.discount / 100))) : value;
    const variants = item.variants?.map(variant => {
      const base = Number(variant.basePrice ?? variant.price);
      return { ...variant, basePrice: base, originalPrice: base, price: discounted(base) };
    });
    const price = variants?.length ? Math.min(...variants.map(variant => variant.price)) : discounted(basePrice);
    const official = variants?.length ? Math.min(...variants.map(variant => variant.basePrice)) : basePrice;
    return { ...item, basePrice: official, originalPrice: official, price, discount: offer?.discount || 0, activeOfferId: offer?.id || null, ...(variants ? { variants } : {}) };
  });
}

export function saveOffer(offers, offer) {
  const existing = offers.find((item) => item.id === offer.id) || offers.find((item) => offerTarget(item) === offerTarget(offer));
  const saved = { ...offer, id: existing?.id || offer.id };
  return [saved, ...offers.filter((item) => item.id !== saved.id && offerTarget(item) !== offerTarget(saved))];
}

export function setProductHidden(state, productId, hidden) {
  return { ...state, products: state.products.map((product) => product.id === productId ? { ...product, hidden } : product) };
}

export function completePurchase(state, seller, details) {
  const items = cartItems(state.cart, state.products).filter(item => item.seller === seller || item.sellerId === seller || item.companyId === seller);
  const error = checkoutError(items, details.profile, details.date);
  if (error) throw new Error(error);
  const totals = orderTotals(items, details.delivery ? details.shipping || 0 : 0);
  const id = String(details.id);
  const order = {
    id, seller: items[0].seller, sellerId: details.sellerId || items[0].sellerId,
    companyId: details.companyId || items[0].companyId, customerId: details.customerId,
    customer: details.customer, createdAt: details.createdAt,
    items: items.map(({ id: productId, name, image, detailImage, price, quantity, variantId, sku, selectedAttributes, variantLabel: label }) => ({ productId, variantId, sku, selectedAttributes, variantLabel: label, name, image: detailImage || image, price, quantity })),
    date: details.date, step: 0, delivery: details.delivery, ...totals,
    address: details.address, addressId: details.addressId,
    carrier: details.delivery ? 'Por asignar' : '', tracking: details.delivery ? 'Por asignar' : '',
    paymentMethod: details.method, lastFour: details.method === 'Tarjeta' ? details.lastFour || '' : '',
    transferReference: details.method === 'Transferencia' ? details.transferReference || details.reference || '' : '',
    statusHistory: [{ step: 0, at: details.createdAt || new Date().toISOString() }],
  };
  return {
    ...state,
    products: state.products.map((product) => {
      const purchased = items.filter(item => item.id === product.id);
      if (!purchased.length) return product;
      if (!product.variants?.length) return { ...product, stock: product.stock - purchased.reduce((sum, item) => sum + item.quantity, 0) };
      const variants = product.variants.map(variant => ({ ...variant, stock: variant.stock - purchased.filter(item => item.variantId === variant.id).reduce((sum, item) => sum + item.quantity, 0) }));
      return { ...product, variants, stock: variants.reduce((sum, variant) => sum + variant.stock, 0) };
    }),
    cart: state.cart.filter(entry => !items.some(item => item.id === entry.productId && (entry.variantId || item.variantId) === item.variantId)),
    orders: [order, ...state.orders],
    transactions: [{ id, orderId: id, seller: order.seller, sellerId: order.sellerId, companyId: order.companyId, customerId: details.customerId, description: items.map(item => `${item.name}${item.variantLabel ? ` (${item.variantLabel})` : ''} ×${item.quantity}`).join(', '), date: details.date, ...totals, paymentMethod: order.paymentMethod, lastFour: order.lastFour, transferReference: order.transferReference, status: 'Completada' }, ...state.transactions],
  };
}
