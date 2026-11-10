import test from 'node:test';
import assert from 'node:assert/strict';
import { createMarketplace, loadStoredMarketplace } from '../src/data/createMarketplace.js';
import { mergeProjectedData, projectMarketplace } from '../src/utils/marketplace.js';
import { addressError, canAccessThread, canManageCompany, companyError, contactError, orderUpdateError, passwordDigest, profileError, reviewOrder, shippingCost } from '../src/utils/identity.js';

const date = '2026-11-10';
const seller = { accountId: 'account-cjesus', role: 'seller' };
const client = { accountId: 'account-milla', role: 'client' };

test('cuentas predeterminadas tienen claves verificables y no se exponen al catálogo', async () => {
  const state = createMarketplace();
  assert.equal(state.accounts.length, 2);
  for (const account of state.accounts) {
    assert.equal(await passwordDigest('Multiplaza2026!', account.passwordSalt), account.passwordHash);
    assert.equal(profileError(account, state.accounts, date, account.id), '');
  }
  const data = projectMarketplace(state, client, date);
  assert.equal(data.profile.email, 'milla@gmail.com');
  assert.equal('passwordHash' in data.profile, false);
  assert.equal('accounts' in data, false);
  assert.equal(companyError(state.companies[0]), '');
});

test('invitado no ve datos privados y vendedor solo obtiene ventas/publicaciones de su empresa', () => {
  const state = createMarketplace();
  const guest = projectMarketplace(state, null, date);
  assert.equal(guest.products.length, state.products.length);
  assert.deepEqual(guest.orders, []);
  assert.deepEqual(guest.messages, []);
  assert.deepEqual(guest.ownedProducts, []);
  const data = projectMarketplace(state, seller, date);
  assert.ok(data.ownedProducts.length > 0);
  assert.ok(data.ownedProducts.every(item => item.companyId === data.company.id));
  assert.ok(data.sales.every(item => item.companyId === data.company.id));
  assert.equal(canManageCompany(state, client, data.company.id), false);
});

test('actualizar listas de un cliente no borra las de otro y editar catálogo ajeno se ignora', () => {
  const state = createMarketplace();
  const previous = projectMarketplace(state, client, date);
  const result = mergeProjectedData(state, client, previous, { ...previous, cart: [] });
  assert.deepEqual(result.userData[client.accountId].cart, []);
  assert.deepEqual(result.userData[seller.accountId], state.userData[seller.accountId]);
  const visible = projectMarketplace(state, seller, date);
  const foreign = state.products.find(item => item.ownerId !== seller.accountId);
  const own = state.products.find(item => item.ownerId === seller.accountId);
  const updated = mergeProjectedData(state, seller, visible, { ...visible, products: visible.products.map(item => ({ ...item, hidden: true, price: 1 })) });
  assert.equal(updated.products.find(item => item.id === foreign.id).hidden, foreign.hidden);
  assert.equal(updated.products.find(item => item.id === own.id).hidden, true);
  assert.equal(updated.products.find(item => item.id === own.id).price, own.price);
});

test('teléfonos y direcciones conservan mínimo uno y no repiten identificadores', () => {
  assert.ok(contactError([]));
  assert.ok(contactError(['+56 9 1234 5678', '56912345678']));
  assert.equal(contactError(['+56 9 1234 5678']), '');
  assert.ok(addressError([]));
  const address = createMarketplace().accounts[0].addresses[0];
  assert.equal(addressError([address]), '');
  assert.ok(addressError([address, { ...address }]));
});

test('tarifa comuna tiene prioridad regional, general cubre otras zonas y retiro cuesta cero', () => {
  const company = createMarketplace().companies[0];
  assert.equal(shippingCost(company, { region: 'Los Lagos', commune: 'OSORNO' }), 4990);
  assert.equal(shippingCost(company, { region: 'Los Lagos', commune: 'Puerto Montt' }), 5990);
  assert.equal(shippingCost(company, { region: 'Los Ríos', commune: 'Valdivia' }), 7990);
  assert.equal(shippingCost(company, {}, false), 0);
});

test('estados no saltan ni retroceden y el despacho exige datos de transporte', () => {
  const state = createMarketplace();
  const order = state.orders.find(item => item.companyId === 'company-cjesus' && item.delivery);
  assert.equal(orderUpdateError(state, seller, order, { step: 2 }), '');
  assert.ok(orderUpdateError(state, seller, order, { step: 3 }));
  assert.ok(orderUpdateError(state, seller, { ...order, carrier: 'Por asignar' }, { step: 2 }));
  assert.ok(orderUpdateError(state, client, order, { step: 2 }));
});

test('reseñas y acceso a conversaciones dependen de adquisiciones e identidades', () => {
  const state = createMarketplace();
  assert.ok(reviewOrder(state, client.accountId, 'product', 'mouse'));
  assert.equal(reviewOrder(state, seller.accountId, 'product', 'mouse'), undefined);
  const thread = { companyId: 'company-cjesus', customerId: client.accountId };
  assert.equal(canAccessThread(state, seller, thread), true);
  assert.equal(canAccessThread(state, client, thread), true);
  assert.equal(canAccessThread(state, { accountId: 'other', role: 'client' }, thread), false);
  assert.equal(canAccessThread(state, { accountId: seller.accountId, role: 'client' }, thread), false);
});

test('recargar JSON versión 2 conserva contactos, variantes y operaciones sin recrear cuentas', () => {
  const original = createMarketplace();
  original.accounts[1].name = 'Perfil editado';
  original.accounts[1].phones.push('+56 9 7777 8888');
  original.products.find(item => item.id === 'mouse').variants[1].stock = 12;
  const saved = JSON.parse(JSON.stringify(original));
  assert.deepEqual(createMarketplace(saved), saved);
});

test('migrar versión 2 conserva datos aunque la cuota del navegador impida escribir un respaldo', () => {
  const previous = structuredClone(createMarketplace());
  previous.version = 2;
  previous.accounts[1].name = 'Nombre conservado';
  const saved = JSON.stringify(previous);
  const storage = { getItem: key => key === 'multiplaza.data' ? saved : null, setItem: () => { throw new Error('QuotaExceededError'); } };
  const migrated = loadStoredMarketplace(storage, '2026-11-10');
  assert.equal(migrated.version, 3);
  assert.equal(migrated.accounts[1].name, 'Nombre conservado');
  assert.deepEqual(migrated.userData, previous.userData);
  assert.equal(migrated.orders.length, previous.orders.length);
});

test('las ofertas iniciales expiran y migrar precios proyectados no aplica un descuento dos veces', () => {
  const original = createMarketplace();
  assert.ok(original.offers.length);
  assert.ok(original.offers.every(offer => offer.start && offer.end));
  const after = projectMarketplace(original, null, '2026-12-01');
  assert.ok(after.products.every(item => item.discount === 0));
  const price = original.products[0].price;
  const legacy = { version: 1, products: [{ ...original.products[0], basePrice: price, price: 1, discount: 0, variants: original.products[0].variants.map(variant => ({ ...variant, basePrice: variant.price, price: 1 })) }], services: [] };
  const migrated = createMarketplace(legacy);
  assert.equal(migrated.products[0].price, price);
  assert.equal('basePrice' in migrated.products[0], false);
  assert.equal(migrated.products[0].variants[0].price, price);
});
