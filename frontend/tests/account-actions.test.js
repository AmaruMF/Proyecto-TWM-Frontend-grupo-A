import test from 'node:test';
import assert from 'node:assert/strict';
import { createAccountActions } from '../src/context/accountActions.js';
import { createMarketplace } from '../src/data/createMarketplace.js';
import { passwordDigest } from '../src/utils/identity.js';
import { projectMarketplace } from '../src/utils/marketplace.js';

function fixture(initialSession = null) {
  let state = structuredClone(createMarketplace());
  let session = initialSession;
  let checkout = null;
  let chatId = 'old-chat';
  const notices = [];
  const paths = [];
  const api = {
    getState: () => state, getSession: () => session, getCheckout: () => checkout,
    commit: update => { state = typeof update === 'function' ? update(state) : update; },
    setSession: value => { session = value; }, setCheckout: value => { checkout = typeof value === 'function' ? value(checkout) : value; }, setChatId: value => { chatId = value; },
    notify: (message, severity) => notices.push({ message, severity }), fail: message => { notices.push({ message, severity: 'warning' }); return false; },
    navigate: path => paths.push(path),
    checkoutFor: (current, accountId) => ({ accountId, seller: '', ...(current.accounts.find(account => account.id === accountId)?.addresses[0] || {}) }),
  };
  return { api, actions: createAccountActions(api), state: () => state, session: () => session, checkout: () => checkout, chatId: () => chatId, notices, paths };
}

const credentials = email => ({ identifier: email, password: 'Multiplaza2026!', remember: false });
const profileFor = env => projectMarketplace(env.state(), env.session(), '2026-11-10').profile;

test('las dos cuentas predeterminadas validan clave y mantienen datos separados', async () => {
  const env = fixture();
  assert.equal(await env.actions.login({ ...credentials('CJESUS@gmail.com'), remember: true }), 'seller');
  assert.deepEqual(env.session(), { accountId: 'account-cjesus', role: 'seller', remember: true });
  assert.equal(env.chatId(), null);
  assert.equal(env.checkout().accountId, 'account-cjesus');
  const seller = projectMarketplace(env.state(), env.session(), '2026-11-10');
  assert.equal(seller.profile.email, 'cjesus@gmail.com');
  assert.equal(seller.cart.length, 0);
  assert.equal(seller.profile.passwordHash, undefined);
  assert.equal(seller.profile.passwordSalt, undefined);
  assert.equal(await env.actions.login(credentials('milla@gmail.com')), 'client');
  const client = projectMarketplace(env.state(), env.session(), '2026-11-10');
  assert.equal(client.profile.email, 'milla@gmail.com');
  assert.ok(client.cart.length > 0);
  assert.equal(client.ownedProducts.length, 0);
  assert.equal(client.orders.every(order => order.customerId === env.session().accountId), true);
});

test('rechaza clave incorrecta y permite acceso por RUN sin puntos', async () => {
  const env = fixture();
  assert.equal(await env.actions.login({ identifier: 'milla@gmail.com', password: 'incorrecta' }), false);
  assert.equal(env.session(), null);
  assert.equal(await env.actions.login({ identifier: 'nadie@gmail.com', password: 'Multiplaza2026!' }), false);
  assert.equal(await env.actions.login(credentials('11111111-1')), 'client');
  assert.equal(env.session().accountId, 'account-milla');
});

test('editar perfil conserva RUN, identidad, permisos y datos de la otra cuenta', async () => {
  const env = fixture({ accountId: 'account-milla', role: 'client', remember: false });
  const sellerBefore = structuredClone(env.state().accounts[0]);
  const before = profileFor(env);
  assert.equal(await env.actions.saveProfile({ ...before, id: 'account-cjesus', name: 'Milla', run: '12.345.678-5', email: '  nueva@gmail.com ', sellerEnabled: true, passwordHash: 'inyectado', phones: ['+56 9 8765 4321', '+56 9 4444 4444'], addresses: [...before.addresses, { ...before.addresses[0], id: 'office', label: 'Oficina', number: '999' }] }), true);
  const updated = env.state().accounts.find(account => account.id === 'account-milla');
  assert.equal(updated.run, before.run);
  assert.equal(updated.sellerEnabled, false);
  assert.equal(updated.email, 'nueva@gmail.com');
  assert.equal(updated.phones.length, 2);
  assert.equal(updated.addresses[0].id, before.addresses[0].id);
  assert.equal(updated.addresses.length, 2);
  assert.notEqual(updated.passwordHash, 'inyectado');
  assert.deepEqual(env.state().accounts[0], sellerBefore);
  assert.equal(await env.actions.saveProfile({ ...updated, email: sellerBefore.email }), false);
  assert.equal(await env.actions.saveProfile({ ...updated, phones: [] }), false);
  assert.equal(await env.actions.saveProfile({ ...updated, addresses: [] }), false);
});

test('registrar crea identidad independiente y solo guarda un hash con salt', async () => {
  const env = fixture();
  const profile = { name: 'Ana', lastName: 'Pérez', run: '6.000.000-K', email: 'ana@gmail.com', birthday: '2000-01-01', phones: ['+56 9 4444 4444'], addresses: [{ label: 'Casa', region: 'Los Lagos', commune: 'Osorno', city: 'Osorno', street: 'Calle nueva', number: '12' }] };
  assert.equal(await env.actions.registerProfile(profile, false, 'OtraClave2026!'), true);
  const registered = env.state().accounts.find(account => account.email === profile.email);
  assert.ok(registered.id);
  assert.ok(registered.addresses[0].id);
  assert.equal(registered.password, undefined);
  assert.equal(registered.passwordHash, await passwordDigest('OtraClave2026!', registered.passwordSalt));
  assert.deepEqual(env.state().userData[registered.id].cart, []);
  assert.notStrictEqual(env.state().userData[registered.id], env.state().userData['account-milla']);
  assert.equal(env.session().accountId, registered.id);
  assert.equal(await env.actions.registerProfile(profile, false, 'OtraClave2026!'), false);
  assert.equal(await env.actions.login({ identifier: profile.email, password: 'OtraClave2026!' }), 'client');
});

test('gestionar contactos conserva mínimos, identificadores y la dirección seleccionada', async () => {
  const env = fixture({ accountId: 'account-milla', role: 'client', remember: false });
  const before = profileFor(env);
  const office = { ...before.addresses[0], id: 'office-address', label: 'Oficina', street: 'Otra calle', number: '456' };
  assert.equal(await env.actions.saveProfile({ ...before, phones: [...before.phones, '+56 9 4444 4444'], addresses: [...before.addresses, office] }), true);
  let saved = profileFor(env);
  assert.deepEqual(saved.addresses.map(address => address.id), [before.addresses[0].id, office.id]);
  env.api.setCheckout({ accountId: 'account-milla', companyId: 'company-cjesus', seller: 'Multiplaza', ...office, addressId: office.id });
  assert.equal(await env.actions.saveProfile({ ...saved, addresses: saved.addresses.map(address => address.id === office.id ? { ...address, number: '999' } : address) }), true);
  assert.equal(env.checkout().number, '999');
  assert.equal(env.checkout().companyId, 'company-cjesus');
  assert.equal(env.checkout().addressId, office.id);
  saved = profileFor(env);
  assert.equal(await env.actions.saveProfile({ ...saved, phones: [saved.phones[1]], addresses: [saved.addresses[0]] }), true);
  saved = profileFor(env);
  assert.equal(saved.phones.length, 1);
  assert.equal(saved.addresses.length, 1);
  assert.equal(saved.addresses[0].id, before.addresses[0].id);
  assert.equal(env.checkout().addressId, before.addresses[0].id);
  assert.equal(env.checkout().street, before.addresses[0].street);
  const snapshot = structuredClone(env.state());
  assert.equal(await env.actions.saveProfile({ ...saved, phones: [] }), false);
  assert.equal(await env.actions.saveProfile({ ...saved, addresses: [] }), false);
  assert.equal(await env.actions.saveProfile({ ...saved, addresses: [saved.addresses[0], { ...saved.addresses[0], label: 'Duplicada' }] }), false);
  assert.deepEqual(env.state(), snapshot);
});

test('una dirección nueva obtiene ID estable al guardar y no sobrescribe destino manual', async () => {
  const env = fixture({ accountId: 'account-milla', role: 'client', remember: false });
  const before = profileFor(env);
  const additional = { ...before.addresses[0], label: 'Otra dirección', id: undefined, number: '789' };
  assert.equal(await env.actions.saveProfile({ ...before, addresses: [...before.addresses, additional] }), true);
  const saved = profileFor(env);
  const addressIds = saved.addresses.map(address => address.id);
  assert.equal(addressIds.every(Boolean), true);
  assert.equal(new Set(addressIds).size, 2);
  env.api.setCheckout({ accountId: 'account-milla', addressId: null, street: 'Destino manual' });
  assert.equal(await env.actions.saveProfile({ ...saved, name: 'Milla' }), true);
  assert.deepEqual(profileFor(env).addresses.map(address => address.id), addressIds);
  assert.equal(env.checkout().street, 'Destino manual');
});

test('cambiar contraseña invalida la anterior sin modificar otra identidad', async () => {
  const env = fixture({ accountId: 'account-milla', role: 'client', remember: false });
  const originalSalt = env.state().accounts[1].passwordSalt;
  assert.equal(await env.actions.saveProfile(profileFor(env), { password: 'NuevaClave2026!' }), true);
  assert.notEqual(env.state().accounts[1].passwordSalt, originalSalt);
  env.actions.logout();
  assert.equal(await env.actions.login(credentials('milla@gmail.com')), false);
  assert.equal(await env.actions.login({ identifier: 'milla@gmail.com', password: 'NuevaClave2026!' }), 'client');
});

test('guardar empresa preserva dueño y permite gestionar oferta y tarifas', async () => {
  const env = fixture({ accountId: 'account-cjesus', role: 'seller', remember: true });
  const company = structuredClone(env.state().companies[0]);
  const otherProduct = structuredClone(env.state().products.find(product => product.companyId !== company.id));
  assert.equal(await env.actions.saveCompany({ ...company, id: 'otro-id', ownerId: 'account-milla', name: 'Nuevo nombre comercial', offering: 'Servicio', defaultShipping: 12000, shippingRates: [{ id: 'nueva-zona', region: 'Los Lagos', commune: 'Osorno', price: 3000 }] }), true);
  const updated = env.state().companies.find(item => item.id === company.id);
  assert.equal(updated.ownerId, 'account-cjesus');
  assert.equal(updated.offering, 'Servicio');
  assert.equal(updated.address.id, company.address.id);
  assert.equal(updated.shippingRates[0].price, 3000);
  assert.equal(env.state().products.filter(item => item.companyId === company.id).every(item => item.seller === updated.name), true);
  assert.deepEqual(env.state().products.find(product => product.id === otherProduct.id), otherProduct);
  assert.equal(await env.actions.saveCompany({ ...updated, name: env.state().companies[1].name }), false);
  assert.equal(await env.actions.saveCompany({ ...updated, phones: [] }), false);
});

test('cambiar rol conserva la identidad y solicita empresa antes de habilitar vendedor', () => {
  const seller = fixture({ accountId: 'account-cjesus', role: 'seller', remember: true });
  assert.equal(seller.actions.switchRole(), 'client');
  assert.equal(seller.session().accountId, 'account-cjesus');
  assert.equal(seller.actions.switchRole(), 'seller');
  const client = fixture({ accountId: 'account-milla', role: 'client', remember: false });
  assert.equal(client.actions.switchRole(), 'registration');
  assert.equal(client.paths.at(-1), '/registro-empresa');
  assert.equal(client.session().role, 'client');
  client.api.commit(state => ({ ...state, accounts: state.accounts.map(account => account.id === 'account-milla' ? { ...account, birthday: '2020-01-01' } : account) }));
  assert.equal(client.actions.switchRole(), false);
});

test('eliminar cuenta conserva ventas anonimizadas y no reinicia otras cuentas', async () => {
  const env = fixture({ accountId: 'account-cjesus', role: 'seller', remember: true });
  const otherUserData = structuredClone(env.state().userData['account-milla']);
  env.api.commit(state => ({ ...state, orders: [...state.orders, { id: 'own-order', customerId: 'account-cjesus', customer: 'Cristián Jesús Cuevas', companyId: 'company-nike-store', seller: 'Nike Store', total: 1000, date: '2026-11-10', address: 'Dirección privada', lastFour: '1234', transferReference: 'privada' }] }));
  const orderCount = env.state().orders.length;
  assert.equal(await env.actions.deleteAccount(), true);
  assert.equal(env.session(), null);
  assert.equal(env.checkout().accountId, null);
  assert.equal(env.state().accounts.some(account => account.id === 'account-cjesus'), false);
  assert.equal(env.state().userData['account-cjesus'], undefined);
  assert.deepEqual(env.state().userData['account-milla'], otherUserData);
  assert.equal(env.state().orders.length, orderCount);
  const historical = env.state().orders.find(order => order.id === 'own-order');
  assert.equal(historical.total, 1000);
  assert.equal(historical.customerId, null);
  assert.equal(historical.customer, 'Cliente eliminado');
  assert.equal(historical.lastFour, '');
  assert.equal(historical.transferReference, '');
  assert.notEqual(historical.address, 'Dirección privada');
  assert.equal(env.state().companies.find(company => company.id === 'company-cjesus').ownerId, null);
  assert.equal(env.state().products.filter(product => product.companyId === 'company-cjesus').every(product => product.hidden && product.ownerId === null), true);
  assert.equal(await env.actions.login(credentials('cjesus@gmail.com')), false);
});
