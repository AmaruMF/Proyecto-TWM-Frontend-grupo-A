import { addCartItem, applyOffers, cartItems, checkoutError, getVariants, resolveVariant, saveOffer, today } from '../utils/commerce.js';
import { addressError, canManageCompany, fullName, shippingCost } from '../utils/identity.js';
import { isAdult } from '../utils/validation.js';
import { checkoutHasProducts, financialSnapshot, findCheckoutQuote, getCheckoutItems, quoteCheckoutError } from '../utils/financial.js';
import { categoryPath, normalizeItemCategory, recommendationError, validCategory } from '../utils/categories.js';

const text = value => String(value ?? '').trim();
const key = value => text(value).toLocaleLowerCase('es');
const integer = (value, minimum = 0) => text(value) !== '' && Number.isInteger(Number(value)) && Number(value) >= minimum;
const sameCartLine = (entry, product, variantId) => entry.productId === product.id && (entry.variantId || (getVariants(product).length === 1 ? getVariants(product)[0].id : '')) === variantId;
const validDate = value => /^\d{4}-\d{2}-\d{2}$/.test(value || '') && !Number.isNaN(new Date(value + 'T12:00:00Z').getTime()) && new Date(value + 'T12:00:00Z').toISOString().slice(0, 10) === value;

export function createCommerceActions(api) {
  const date = () => api.getDate?.() || today();
  const { getState, commit, getSession, getCheckout, setCheckout, notify, fail, navigate } = api;
  const actor = () => getState().accounts.find(account => account.id === getSession()?.accountId);
  const ownCompany = (state, companyId) => state.companies.find(company => (!companyId || company.id === companyId) && canManageCompany(state, getSession(), company.id));
  const user = (state, id) => state.userData[id] || { cart: [], wishlists: [] };
  const replaceCart = (state, accountId, cart) => ({ ...state, userData: { ...state.userData, [accountId]: { ...user(state, accountId), cart } } });
  const findCompany = (state, seller, product) => product
    ? state.companies.find(company => company.id === product.companyId)
    : state.companies.find(company => company.id === seller) || state.companies.find(company => company.name === seller);

  function savePublication(source, service = false) {
    const state = getState();
    const account = actor();
    const field = service ? 'services' : 'products';
    const existing = state[field].find(item => item.id === source.id);
    const company = ownCompany(state, existing?.companyId);
    if (!account || !company || (existing && !canManageCompany(state, getSession(), existing.companyId))) return fail('No puedes gestionar esta publicación.');
    if (!['Ambos', service ? 'Servicio' : 'Producto'].includes(company.offering)) return fail('Actualiza qué ofrece tu empresa en Mi cuenta antes de publicar este tipo de artículo.');
    const category = source.categoryId || normalizeItemCategory(source, service ? 'service' : 'product').categoryId;
    if (!validCategory(category, service ? 'service' : 'product')) return fail('Selecciona una categoría final válida del árbol de productos o servicios.');
    if (!text(source.name) || text(source.name).length > 100 || !text(source.category) || !text(source.sku) || text(source.sku).length > 50) return fail('Completa nombre, categoría y SKU válidos.');
    const price = Number(source.basePrice ?? source.price);
    if (!integer(price, 1)) return fail('El precio debe ser un entero mayor que cero.');
    let variants;
    if (service) {
      if (!integer(source.durationMinutes, 1) || !text(source.description)) return fail('Completa la duración en minutos y la descripción del servicio.');
    } else {
      if (['size', 'weight', 'color', 'material'].some(attribute => !text(source[attribute]))) return fail('Completa tamaño, peso, color y material principal.');
      if (getVariants(source).some(variant => !integer(variant.basePrice ?? variant.price, 1) || !integer(variant.stock))) return fail('Completa precio y stock de cada variante.');
      variants = getVariants(source).map(variant => {
        const option = { ...variant, id: variant.id || crypto.randomUUID(), sku: text(variant.sku), attributes: { ...variant.attributes }, price: Number(variant.basePrice ?? variant.price), stock: Number(variant.stock) };
        delete option.basePrice; delete option.originalPrice; delete option.discount; delete option.activeOfferId;
        return option;
      });
      if (!variants.length || variants.some(variant => !variant.sku || variant.sku.length > 50 || !integer(variant.price, 1) || !integer(variant.stock) || variant.stock > 999999)) return fail('Cada variante necesita SKU, precio positivo y stock válido.');
      if (new Set(variants.map(variant => variant.id)).size !== variants.length || new Set(variants.map(variant => key(variant.sku))).size !== variants.length) return fail('Los identificadores y SKU de las variantes no pueden repetirse.');
      if (variants.some(variant => Object.values(variant.attributes).some(value => value !== null && typeof value === 'object'))) return fail('Los atributos de cada variante deben describir una opción concreta.');
      const combinations = variants.map(variant => JSON.stringify(Object.entries(variant.attributes).filter(([, value]) => text(value)).sort().map(([name, value]) => [key(name), key(value)])));
      if (variants.length > 1 && (variants.some(variant => !Object.values(variant.attributes).some(value => text(value))) || new Set(combinations).size !== combinations.length)) return fail('Describe una combinación distinta de atributos para cada variante.');
    }
    const requestedSkus = new Set([key(source.sku), ...(variants || []).map(variant => key(variant.sku))]);
    const otherPublications = [...state.products.filter(item => !(!service && item.id === existing?.id)), ...state.services.filter(item => !(service && item.id === existing?.id))];
    if (otherPublications.some(item => [item.sku, ...(item.variants || []).map(variant => variant.sku)].some(sku => requestedSkus.has(key(sku))))) return fail('El SKU ya está utilizado en otra publicación.');
    const saved = {
      ...source, id: existing?.id || source.id || crypto.randomUUID(), companyId: company.id, ownerId: account.id,
      sellerId: company.id, seller: company.name, name: text(source.name), sku: text(source.sku),
      categoryId: category, category: categoryPath(category), description: text(source.description), adultOnly: Boolean(source.adultOnly),
      price: service ? price : Math.min(...variants.map(variant => variant.price)), discount: 0, hidden: Boolean(source.hidden),
      ...(service ? { durationMinutes: Number(source.durationMinutes), duration: Number(source.durationMinutes) + ' minutos' } : { variants, stock: variants.reduce((total, variant) => total + variant.stock, 0) }),
    };
    saved.originalPrice = saved.price;
    delete saved.basePrice;
    delete saved.activeOfferId;
    if (service) { delete saved.variants; delete saved.stock; }
    else {
      saved.relatedProductIds = source.relatedProductIds || existing?.relatedProductIds || [];
      const relatedError = recommendationError(state, saved, saved.relatedProductIds, getSession());
      if (relatedError) return fail(relatedError);
    }
    commit(current => ({ ...current, [field]: existing ? current[field].map(item => item.id === saved.id ? saved : item) : [...current[field], saved] }));
    return true;
  }

  function updateStock(productId, variantId, value) {
    const state = getState();
    const product = state.products.find(item => item.id === productId);
    if (!product || !canManageCompany(state, getSession(), product.companyId)) return fail('No puedes actualizar este inventario.');
    if (!integer(value) || Number(value) > 999999) return fail('El stock debe ser un entero entre 0 y 999999.');
    const variant = resolveVariant(product, variantId);
    if (!variant) return fail('Selecciona una variante válida.');
    commit(current => ({ ...current, products: current.products.map(item => {
      if (item.id !== productId) return item;
      const variants = getVariants(item).map(option => option.id === variant.id ? { ...option, stock: Number(value) } : option);
      return { ...item, variants, stock: variants.reduce((total, option) => total + option.stock, 0) };
    }) }));
    return true;
  }

  function savePromotion(source) {
    const state = getState();
    const service = source.itemType === 'service' || Boolean(source.serviceId);
    const targetId = service ? source.serviceId : source.productId;
    if (!targetId || (service && source.productId) || (!service && source.serviceId)) return fail('Selecciona un producto o servicio válido.');
    const item = state[service ? 'services' : 'products'].find(record => record.id === targetId);
    const existing = state.offers.find(offer => offer.id === source.id);
    if (!item || item.hidden || !canManageCompany(state, getSession(), item.companyId) || (existing && !canManageCompany(state, getSession(), existing.companyId))) return fail('No puedes gestionar esta oferta.');
    if (!integer(source.discount, 1) || Number(source.discount) > 99 || !validDate(source.start) || !validDate(source.end) || source.end < source.start) return fail('Revisa el descuento y las fechas de vigencia.');
    const offer = {
      id: existing?.id || source.id || crypto.randomUUID(), itemType: service ? 'service' : 'product',
      ...(service ? { serviceId: targetId } : { productId: targetId }),
      companyId: item.companyId, discount: Number(source.discount), start: source.start, end: source.end, enabled: source.enabled !== false,
    };
    commit(current => ({ ...current, offers: saveOffer(current.offers, offer) }));
    return true;
  }

  function addToCart(productId, quantity = 1, variantId) {
    const state = getState();
    const account = actor();
    const product = state.products.find(item => item.id === productId);
    if (!account) return fail('Inicia sesión para agregar productos.');
    if (!product || product.hidden) return fail('Esta publicación no está disponible.');
    const variant = resolveVariant(product, variantId);
    if (!variant) return fail('Selecciona una variante disponible.');
    if (!integer(quantity, 1) || variant.stock < 1) return fail('Indica una cantidad válida según el stock.');
    if (product.adultOnly && !isAdult(account.birthday, date())) return fail('Debes tener 18 años cumplidos para adquirir este artículo.');
    const cart = addCartItem(user(state, account.id).cart, product, Number(quantity), variant.id);
    commit(current => replaceCart(current, account.id, cart));
    notify('Producto agregado al carrito.');
    return true;
  }

  function updateQuantity(productId, quantity, variantId) {
    const state = getState();
    const account = actor();
    const product = state.products.find(item => item.id === productId);
    const variant = resolveVariant(product, variantId);
    if (!account || !product || product.hidden || !variant || !integer(quantity, 1) || Number(quantity) > variant.stock) return fail('Revisa la cantidad y el stock disponible.');
    const cart = user(state, account.id).cart.map(entry => sameCartLine(entry, product, variant.id) ? { ...entry, variantId: variant.id, quantity: Number(quantity) } : entry);
    commit(current => replaceCart(current, account.id, cart));
    return true;
  }

  function removeFromCart(productId, variantId) {
    const state = getState();
    const account = actor();
    if (!account) return fail('Inicia sesión para gestionar tu carrito.');
    const product = state.products.find(item => item.id === productId);
    const selected = product ? resolveVariant(product, variantId) : null;
    const cart = user(state, account.id).cart.filter(entry => entry.productId !== productId || (variantId ? (entry.variantId || selected?.id) !== variantId : false));
    commit(current => replaceCart(current, account.id, cart));
    return true;
  }

  function toggleFavorite(itemId, listId = 'favorites', itemType = 'product') {
    const state = getState();
    const account = actor();
    if (!account) return fail('Inicia sesión para guardar favoritos.');
    if (!['product', 'service'].includes(itemType) || !state[itemType === 'service' ? 'services' : 'products'].some(item => item.id === itemId && !item.hidden)) return fail('Esta publicación no está disponible.');
    commit(current => {
      const mine = user(current, account.id);
      const existing = mine.wishlists || [];
      const lists = existing.some(list => list.id === listId) ? existing : [...existing, { id: listId, name: 'Mis favoritos', productIds: [], serviceIds: [] }];
      const field = itemType === 'service' ? 'serviceIds' : 'productIds';
      const wishlists = lists.map(list => {
        if (list.id !== listId) return list;
        const ids = list[field] || [];
        return { ...list, [field]: ids.includes(itemId) ? ids.filter(id => id !== itemId) : [...ids, itemId] };
      });
      return { ...current, userData: { ...current.userData, [account.id]: { ...mine, wishlists } } };
    });
    return true;
  }

  function startCheckout(seller, direct) {
    const state = getState();
    const account = actor();
    if (!account) return fail('Inicia sesión para continuar.');
    const product = direct ? state.products.find(item => item.id === direct.productId) : null;
    const company = findCompany(state, seller, product);
    if (!company) return fail('Selecciona un vendedor válido.');
    let cart = user(state, account.id).cart;
    if (direct) {
      const variant = resolveVariant(product, direct.variantId);
      if (!product || product.hidden || !variant || !integer(direct.quantity, 1) || Number(direct.quantity) > variant.stock) return fail('Revisa la variante, la cantidad y el stock disponible.');
      cart = [...cart.filter(entry => !sameCartLine(entry, product, variant.id)), { productId: product.id, variantId: variant.id, quantity: Number(direct.quantity) }];
    }
    const products = applyOffers(state.products, state.offers, date());
    const items = cartItems(cart, products).filter(item => item.companyId === company.id);
    const error = checkoutError(items, account, date());
    if (error) return fail(error);
    const address = account.addresses?.[0] || {};
    if (direct) commit(current => replaceCart(current, account.id, cart));
    const previous = getCheckout() || {};
    const destination = previous.accountId === account.id ? previous : address;
    setCheckout({ ...previous, ...destination, quoteId: undefined, accountId: account.id, seller: company.name, companyId: company.id, addressId: destination.addressId || address.id, delivery: previous.accountId === account.id ? previous.delivery !== false : true, method: previous.accountId === account.id ? previous.method || 'Tarjeta' : 'Tarjeta', shipping: shippingCost(company, destination) });
    navigate('/resumen');
    return true;
  }

  function purchase(payment = {}) {
    const state = getState();
    const account = actor();
    const checkout = getCheckout();
    if (!account || checkout?.accountId !== account.id) return fail('Selecciona nuevamente tu compra para esta cuenta.');
    const company = state.companies.find(item => item.id === checkout.companyId && !item.disabled);
    if (!company) return fail('El vendedor del pedido no está disponible.');
    const quote = checkout.quoteId ? findCheckoutQuote(state, checkout) : null;
    if (checkout.quoteId) {
      const quoteError = quoteCheckoutError(state, quote, account, date());
      if (quoteError || quote.companyId !== company.id) return fail(quoteError || 'El vendedor de la cotización no coincide con el pedido.');
    }
    const products = applyOffers(state.products, state.offers, date());
    const items = getCheckoutItems({ ...state, products, cart: user(state, account.id).cart }, checkout, date());
    const error = checkoutError(items, account, date());
    if (error) return fail(error);
    const hasProducts = checkoutHasProducts(items);
    const delivery = hasProducts && checkout.delivery === true;
    if (delivery) {
      const invalidAddress = addressError([{ ...checkout, id: checkout.addressId || 'checkout' }]);
      if (invalidAddress) return fail(invalidAddress);
    }
    const method = payment.method || checkout.method;
    if (!['Tarjeta', 'Transferencia', 'Otro medio'].includes(method)) return fail('Selecciona un medio de pago válido.');
    if (method === 'Tarjeta' && !/^\d{4}$/.test(payment.lastFour || '')) return fail('Indica los últimos cuatro dígitos de la tarjeta.');
    const transferReference = text(payment.transferReference || payment.reference);
    if (method === 'Transferencia' && !transferReference) return fail('Indica la referencia de la transferencia.');
    const createdAt = new Date().toISOString();
    const id = crypto.randomUUID();
    const paymentId = crypto.randomUUID();
    const snapshot = financialSnapshot(items, shippingCost(company, checkout, delivery));
    if (['net', 'tax', 'subtotal', 'shipping', 'total'].some(field => !Number.isSafeInteger(snapshot[field]) || snapshot[field] < 0)) return fail('El importe del pedido supera el rango permitido.');
    const order = {
      id, paymentId, ...(quote ? { quoteId: quote.id, quoteSnapshot: { id: quote.id, emissionDate: quote.emissionDate, expiresAt: quote.expiresAt, items: snapshot.items, subtotal: snapshot.subtotal, net: snapshot.net, tax: snapshot.tax } } : {}), date: date(), createdAt, customerId: account.id, customer: fullName(account),
      sellerId: company.id, companyId: company.id, seller: company.name, isService: !hasProducts, delivery,
      addressId: delivery ? checkout.addressId : undefined,
      address: delivery ? [checkout.street + ' ' + checkout.number, checkout.details, checkout.city, checkout.commune, checkout.region].filter(Boolean).join(', ') : hasProducts ? 'Retiro en ' + company.name : 'Prestación coordinada con ' + company.name,
      ...(quote?.requestedDate ? { scheduledDate: quote.requestedDate } : {}),
      carrier: delivery ? 'Por asignar' : '', tracking: delivery ? 'Por asignar' : '',
      ...snapshot, paymentMethod: method, lastFour: method === 'Tarjeta' ? payment.lastFour : '', transferReference: method === 'Transferencia' ? transferReference : '',
      paymentStatus: 'Completada', step: 0, statusHistory: [{ id: crypto.randomUUID(), step: 0, createdAt }],
    };
    const transaction = {
      id: paymentId, type: 'payment', orderId: order.id, quoteId: quote?.id,
      customerId: account.id, customer: fullName(account), companyId: company.id, sellerId: company.id, seller: company.name,
      description: snapshot.items.map(item => `${item.name}${item.variantLabel ? ` (${item.variantLabel})` : ''} ×${item.quantity}`).join(', '),
      date: order.date, createdAt, ...snapshot, paymentMethod: method, lastFour: order.lastFour, transferReference: order.transferReference, status: 'Completada',
    };
    commit(current => ({
      ...current,
      products: current.products.map(product => {
        const purchased = items.filter(item => item.itemType !== 'service' && !item.serviceId && item.id === product.id);
        if (!purchased.length) return product;
        const variants = getVariants(product).map(variant => ({ ...variant, stock: variant.stock - purchased.filter(item => item.variantId === variant.id).reduce((sum, item) => sum + item.quantity, 0) }));
        return { ...product, stock: variants.reduce((sum, variant) => sum + variant.stock, 0), ...(product.variants?.length ? { variants } : {}) };
      }),
      orders: [order, ...current.orders], transactions: [transaction, ...current.transactions],
      quotes: quote ? current.quotes.map(item => item.id === quote.id ? { ...item, status: 'accepted', step: 2, acceptedAt: createdAt, orderId: order.id } : item) : current.quotes,
      userData: { ...current.userData, [account.id]: { ...user(current, account.id), cart: consumePurchasedCart(user(current, account.id).cart, current.products, items) } },
    }));
    notify('Compra registrada. Puedes revisarla en Mis pedidos.');
    navigate('/pedidos');
    return true;
  }

  return { savePublication, updateStock, savePromotion, addToCart, updateQuantity, removeFromCart, toggleFavorite, startCheckout, purchase };
}

function consumePurchasedCart(cart, products, items) {
  const remaining = new Map();
  for (const item of items.filter(item => item.itemType !== 'service' && !item.serviceId)) {
    const key = `${item.id}::${item.variantId || ''}`;
    remaining.set(key, (remaining.get(key) || 0) + item.quantity);
  }
  return cart.flatMap(entry => {
    const product = products.find(item => item.id === entry.productId);
    const variantId = entry.variantId || resolveVariant(product)?.id || '';
    const key = `${entry.productId}::${variantId}`;
    const used = Math.min(entry.quantity, remaining.get(key) || 0);
    remaining.set(key, Math.max(0, (remaining.get(key) || 0) - used));
    return entry.quantity > used ? [{ ...entry, quantity: entry.quantity - used }] : [];
  });
}
