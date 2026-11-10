import test from 'node:test';
import assert from 'node:assert/strict';
import { createMarketplace } from '../src/data/createMarketplace.js';
import { createCommerceActions } from '../src/context/commerceActions.js';
import { applyOffers, today } from '../src/utils/commerce.js';
import { projectMarketplace } from '../src/utils/marketplace.js';

function fixture(role = 'client') {
  let state = structuredClone(createMarketplace());
  let session = { accountId: role === 'seller' ? 'account-cjesus' : 'account-milla', role };
  let checkout = {};
  const notices = [];
  const actions = createCommerceActions({
    getState: () => state, commit: update => { state = typeof update === 'function' ? update(state) : update; },
    getSession: () => session, getCheckout: () => checkout,
    setCheckout: update => { checkout = typeof update === 'function' ? update(checkout) : update; },
    notify: message => notices.push(message), fail: message => { notices.push(message); return false; },
    navigate: () => {},
  });
  return { actions, notices, get state() { return state; }, get checkout() { return checkout; }, set checkout(value) { checkout = value; }, set session(value) { session = value; } };
}

test('inventario y publicaciones se restringen a la empresa del vendedor y preservan precios oficiales', () => {
  const f = fixture('seller');
  const own = f.state.products.find(product => product.id === 'mouse');
  const foreign = f.state.products.find(product => product.id === 'gopro');
  assert.equal(f.actions.updateStock(foreign.id, foreign.variants[0].id, 50), false);
  assert.equal(f.actions.savePublication({ ...foreign, name: 'Intento ajeno' }), false);
  assert.equal(f.actions.updateStock(own.id, own.variants[0].id, 7), true);
  const updated = f.state.products.find(product => product.id === own.id);
  assert.equal(updated.stock, 8);
  assert.equal(updated.variants[0].price, own.variants[0].price);
  assert.equal(updated.variants[1].stock, 1);
  f.session = { accountId: 'account-milla', role: 'client' };
  assert.equal(f.actions.updateStock(own.id, own.variants[0].id, 80), false);
});

test('la publicación valida SKU global, precio, stock y combinaciones de variante', () => {
  const f = fixture('seller');
  const own = structuredClone(f.state.products.find(product => product.id === 'mouse'));
  const foreign = f.state.products.find(product => product.id === 'gopro');
  assert.equal(f.actions.savePublication({ ...own, sku: foreign.sku }), false);
  assert.equal(f.actions.savePublication({ ...own, variants: own.variants.map(variant => ({ ...variant, attributes: { color: 'Igual' } })) }), false);
  assert.equal(f.actions.savePublication({ ...own, variants: own.variants.map(variant => ({ ...variant, stock: '' })) }), false);
  assert.equal(f.actions.savePublication({ ...own, name: 'Mouse actualizado', seller: 'Nombre falsificado' }), true);
  assert.equal(f.state.products.find(product => product.id === own.id).seller, 'Multiplaza');
});

test('servicios requieren datos mínimos y permiten habilitar su oferta después del registro', () => {
  const f = fixture('seller');
  const service = structuredClone(f.state.services[0]);
  f.state.companies[0].offering = 'Producto';
  assert.equal(f.actions.savePublication(service, true), false);
  f.state.companies[0].offering = 'Ambos';
  assert.equal(f.actions.savePublication({ ...service, durationMinutes: 0 }, true), false);
  assert.equal(f.actions.savePublication({ ...service, description: '' }, true), false);
  assert.equal(f.actions.savePublication({ ...service, durationMinutes: 90, adultOnly: true }, true), true);
  const saved = f.state.services.find(item => item.id === service.id);
  assert.equal(saved.duration, '90 minutos');
  assert.equal(saved.adultOnly, true);
});

test('ofertas de servicios validan propiedad, porcentaje y fechas y no duplican el artículo', () => {
  const f = fixture('seller');
  const service = f.state.services[0];
  const offer = { id: 'offer-test', itemType: 'service', serviceId: service.id, discount: 20, start: '2026-11-01', end: '2026-11-30', enabled: true };
  assert.equal(f.actions.savePromotion({ ...offer, end: '2026-02-30' }), false);
  assert.equal(f.actions.savePromotion({ ...offer, discount: 100 }), false);
  assert.equal(f.actions.savePromotion(offer), true);
  assert.equal(f.actions.savePromotion({ ...offer, id: 'changed-id', discount: 30 }), true);
  assert.equal(f.state.offers.filter(item => item.serviceId === service.id).length, 1);
  assert.equal(f.state.services.filter(item => item.id === service.id).length, 1);
});

test('compra por variante conserva precios base, recalcula envío, identidad e IVA y respeta otros carritos', () => {
  const f = fixture();
  const ownUser = f.state.userData['account-milla'];
  ownUser.cart = [];
  const raw = structuredClone(f.state.products.find(product => product.id === 'mouse'));
  const foreign = f.state.products.find(product => product.id === 'air-jordan');
  f.state.userData['account-cjesus'].cart = [{ productId: raw.id, variantId: raw.variants[1].id, quantity: 1 }];
  assert.equal(f.actions.addToCart(raw.id, 1, raw.variants[0].id), true);
  assert.equal(f.actions.addToCart(foreign.id, 1, foreign.variants[0].id), true);
  assert.equal(f.actions.startCheckout('Multiplaza'), true);
  assert.equal(f.checkout.addressId, f.state.accounts.find(account => account.id === 'account-milla').addresses[0].id);
  f.checkout = { ...f.checkout, shipping: 1 };
  const displayed = applyOffers([raw], f.state.offers, today())[0].variants[0].price;
  assert.equal(f.actions.purchase({ method: 'Tarjeta', lastFour: '1234', cvv: '999', cardNumber: '4111111111111234' }), true);
  const sale = f.state.orders[0];
  assert.equal(sale.customerId, 'account-milla');
  assert.equal(sale.companyId, 'company-cjesus');
  assert.equal(sale.shipping, 4990);
  assert.equal(sale.total, displayed + 4990);
  assert.equal(sale.net + sale.tax, sale.subtotal);
  assert.equal(f.state.products.find(product => product.id === raw.id).variants[0].price, raw.variants[0].price);
  assert.equal(f.state.products.find(product => product.id === raw.id).variants[0].stock, 0);
  assert.equal(f.state.userData['account-milla'].cart.length, 1);
  assert.equal(f.state.userData['account-milla'].cart[0].productId, foreign.id);
  assert.equal(f.state.userData['account-cjesus'].cart.length, 1);
  assert.equal(JSON.stringify(sale).includes('cvv'), false);
  assert.equal(JSON.stringify(sale).includes('4111111111111234'), false);
});

test('la compra no utiliza un checkout de otra cuenta ni datos de dirección incompletos', () => {
  const f = fixture();
  const stock = f.state.products[0].stock;
  f.checkout = { accountId: 'account-cjesus', companyId: 'company-cjesus' };
  assert.equal(f.actions.purchase({ method: 'Tarjeta', lastFour: '1234' }), false);
  assert.equal(f.actions.startCheckout('Multiplaza'), true);
  f.checkout = { ...f.checkout, street: ' ' };
  assert.equal(f.actions.purchase({ method: 'Tarjeta', lastFour: '1234' }), false);
  assert.equal(f.state.products[0].stock, stock);
});

test('menores no pueden sortear la restricción etaria usando compra directa o un carrito modificado', () => {
  const f = fixture();
  const account = f.state.accounts.find(item => item.id === 'account-milla');
  account.birthday = '2015-01-01';
  const product = f.state.products.find(item => item.id === 'mouse');
  product.adultOnly = true;
  const line = { productId: product.id, variantId: product.variants[0].id, quantity: 1 };
  assert.equal(f.actions.addToCart(product.id, 1, line.variantId), false);
  assert.equal(f.actions.startCheckout('Multiplaza', line), false);
  f.state.userData[account.id].cart = [line];
  f.checkout = { accountId: account.id, companyId: product.companyId, delivery: false, method: 'Otro medio' };
  assert.equal(f.actions.purchase(), false);
  assert.equal(product.variants[0].stock, 1);
});

test('la transferencia conserva su referencia y las listas de deseos pertenecen a cada cuenta', () => {
  const f = fixture();
  const product = f.state.products.find(item => item.id === 'mouse');
  f.state.userData['account-milla'].cart = [];
  assert.equal(f.actions.toggleFavorite(product.id), true);
  assert.equal(f.state.userData['account-milla'].wishlists[0].productIds.includes(product.id), true);
  assert.equal(f.state.userData['account-cjesus'].wishlists[0].productIds.includes(product.id), false);
  f.actions.addToCart(product.id, 1, product.variants[0].id);
  f.actions.startCheckout('Multiplaza');
  f.checkout = { ...f.checkout, delivery: false, method: 'Transferencia' };
  assert.equal(f.actions.purchase(), false);
  assert.equal(f.actions.purchase({ method: 'Transferencia', reference: 'TRANS-TEST' }), true);
  assert.equal(f.state.orders[0].transferReference, 'TRANS-TEST');
  assert.equal(f.state.orders[0].shipping, 0);
  assert.equal(f.state.transactions[0].transferReference, 'TRANS-TEST');
});



test('editar precios oficiales con una oferta vigente conserva sus imágenes y atributos y aplica un único descuento', () => {
  const f = fixture('seller');
  const raw = f.state.products.find(product => product.id === 'mouse');
  const image = f.state.products.find(product => product.id === 'hp-victus').detailImage;
  raw.variants[0].image = image;
  raw.variants[0].attributes.model = 0;
  const oldPrice = raw.variants[0].price;
  assert.equal(f.actions.savePromotion({ id: 'price-edit', productId: raw.id, discount: 25, start: today(), end: today(), enabled: true }), true);
  const shown = projectMarketplace(f.state, { accountId: 'account-cjesus', role: 'seller' }, today()).ownedProducts.find(product => product.id === raw.id);
  assert.equal(shown.variants[0].price, Math.round(oldPrice * 0.75));
  const edited = {
    ...shown, price: shown.basePrice + 1000,
    variants: shown.variants.map(variant => {
      const saved = { ...variant, price: variant.basePrice + 1000 };
      delete saved.basePrice; delete saved.originalPrice; delete saved.discount; delete saved.activeOfferId;
      return saved;
    }),
  };
  delete edited.basePrice; delete edited.activeOfferId;
  assert.equal(f.actions.savePublication(edited), true);
  const saved = f.state.products.find(product => product.id === raw.id);
  assert.equal(saved.variants[0].price, oldPrice + 1000);
  assert.equal(saved.variants[0].basePrice, undefined);
  assert.equal(saved.variants[0].image, image);
  assert.equal(saved.variants[0].attributes.model, 0);
  assert.equal(applyOffers([saved], f.state.offers, today())[0].variants[0].price, Math.round((oldPrice + 1000) * 0.75));
  f.session = { accountId: 'account-milla', role: 'client' };
  f.state.userData['account-milla'].cart = [];
  assert.equal(f.actions.addToCart(saved.id, 1, saved.variants[0].id), true);
  assert.equal(f.actions.startCheckout('company-cjesus'), true);
  f.checkout = { ...f.checkout, delivery: false, method: 'Otro medio' };
  assert.equal(f.actions.purchase(), true);
  assert.equal(f.state.orders[0].items[0].image, image);
  assert.equal(f.state.orders[0].items[0].selectedAttributes.model, 0);
  assert.equal(f.state.orders[0].items[0].price, Math.round((oldPrice + 1000) * 0.75));
});

test('editar un servicio con oferta vigente modifica su precio oficial y conserva la vigencia por separado', () => {
  const f = fixture('seller');
  const service = f.state.services[0];
  f.actions.savePromotion({ id: 'service-price', itemType: 'service', serviceId: service.id, discount: 20, start: today(), end: today(), enabled: true });
  const shown = projectMarketplace(f.state, { accountId: 'account-cjesus', role: 'seller' }, today()).ownedServices.find(item => item.id === service.id);
  const edited = { ...shown, price: 90000, durationMinutes: 75 };
  delete edited.basePrice; delete edited.activeOfferId;
  assert.equal(f.actions.savePublication(edited, true), true);
  const saved = f.state.services.find(item => item.id === service.id);
  assert.equal(saved.price, 90000);
  assert.equal(saved.durationMinutes, 75);
  assert.equal(saved.basePrice, undefined);
  assert.equal(applyOffers([saved], f.state.offers, today())[0].price, 72000);
  assert.equal(applyOffers([saved], [], today())[0].price, 90000);
});
