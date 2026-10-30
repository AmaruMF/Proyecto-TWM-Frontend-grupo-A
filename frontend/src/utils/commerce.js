export const currency = (value) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(value);
export const dateLabel = (value) => new Intl.DateTimeFormat('es-CL', { dateStyle: 'medium' }).format(new Date(`${value}T12:00:00`));
export const today = () => new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/Santiago' }).format(new Date());

export function cartItems(cart, products) {
  return cart.map((entry) => {
    const product = products.find((item) => item.id === entry.productId);
    return product ? { ...product, quantity: entry.quantity } : null;
  }).filter(Boolean);
}

export function orderTotals(items, shipping = 0) {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const net = Math.round(subtotal / 1.19);
  return { subtotal, net, tax: subtotal - net, shipping, total: subtotal + shipping };
}

export function addCartItem(cart, product, quantity = 1) {
  if (!Number.isInteger(quantity) || quantity < 1 || product.stock < 1) return cart;
  const existing = cart.find((entry) => entry.productId === product.id);
  const nextQuantity = Math.min(product.stock, (existing?.quantity || 0) + quantity);
  return existing ? cart.map((entry) => entry.productId === product.id ? { ...entry, quantity: nextQuantity } : entry) : [...cart, { productId: product.id, quantity: nextQuantity }];
}

export function checkoutError(items) {
  if (!items.length) return 'Selecciona al menos un producto para continuar.';
  if (new Set(items.map((item) => item.seller)).size > 1) return 'Selecciona productos de un mismo vendedor por compra.';
  if (items.some((item) => !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > item.stock)) return 'La cantidad seleccionada supera el stock disponible.';
  return '';
}

export function applyOffers(products, offers, date) {
  return products.map((product) => {
    const offer = offers.find((item) => item.productId === product.id && item.enabled && item.start <= date && item.end >= date);
    return offer ? { ...product, basePrice: product.price, originalPrice: product.price, price: Math.max(1, Math.round(product.price * (1 - offer.discount / 100))), discount: offer.discount } : product;
  });
}

export function completePurchase(state, seller, details) {
  const items = cartItems(state.cart, state.products).filter((item) => item.seller === seller);
  const error = checkoutError(items);
  if (error) throw new Error(error);
  const totals = orderTotals(items, details.delivery ? details.shipping : 0);
  const id = String(details.id);
  const order = { id, seller, items: items.map(({ id: productId, name, image, detailImage, price, quantity }) => ({ productId, name, image: detailImage || image, price, quantity })), date: details.date, step: 0, delivery: details.delivery, shipping: totals.shipping, total: totals.total, address: details.address, carrier: details.delivery ? 'Por asignar' : '', tracking: 'Por asignar', paymentMethod: details.method, lastFour: details.lastFour || '' };
  return {
    ...state,
    products: state.products.map((product) => {
      const item = items.find((entry) => entry.id === product.id);
      return item ? { ...product, stock: product.stock - item.quantity } : product;
    }),
    cart: state.cart.filter((entry) => !items.some((item) => item.id === entry.productId)),
    orders: [order, ...state.orders],
    transactions: [{ id, seller, description: items.map((item) => `${item.name} ×${item.quantity}`).join(', '), date: details.date, total: totals.total, status: 'Completada' }, ...state.transactions],
  };
}
