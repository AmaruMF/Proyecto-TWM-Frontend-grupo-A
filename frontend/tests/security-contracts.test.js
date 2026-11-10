import test from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';
import { createMarketplace } from '../src/data/createMarketplace.js';
import { createAccountActions } from '../src/context/accountActions.js';
import { createInteractionActions } from '../src/context/interactionActions.js';
import { bcryptSalt, normalizePhone, passwordDigest, passwordValid, profileError } from '../src/utils/identity.js';

function fixture() {
  let state = structuredClone(createMarketplace());
  let session = { accountId: 'account-cjesus', role: 'seller' };
  let checkout = {};
  const api = {
    getState: () => state, getSession: () => session, getCheckout: () => checkout,
    commit: update => { state = typeof update === 'function' ? update(state) : update; },
    setSession: value => { session = value; }, setCheckout: value => { checkout = value; }, setChatId: () => {},
    checkoutFor: (raw, accountId) => ({ accountId, ...(raw.accounts.find(item => item.id === accountId)?.addresses[0] || {}) }),
    notify: () => {}, fail: () => false, navigate: () => {},
  };
  return { api, state: () => state };
}

test('cuentas iniciales usan bcrypt real y el límite en bytes evita contraseñas truncadas', async () => {
  const account = createMarketplace().accounts[0];
  assert.equal(bcryptSalt(account.passwordSalt), true);
  assert.match(account.passwordHash, /^\$2[aby]\$12\$/);
  assert.equal(await bcrypt.compare('Multiplaza2026!', account.passwordHash), true);
  assert.equal(await bcrypt.compare('OtraClave2026!', account.passwordHash), false);
  assert.equal(passwordValid('Aa1!' + 'á'.repeat(35)), false);
  assert.equal(passwordValid('Aa1!' + 'a'.repeat(68)), true);
  await assert.rejects(passwordDigest('Aa1!' + 'a'.repeat(69), account.passwordSalt), /72 bytes/);
});

test('login migra una cuenta PBKDF2 existente a bcrypt sin cambiar contraseña ni identidad', async () => {
  const env = fixture();
  const record = env.state().accounts[1];
  record.passwordSalt = 'legacy-salt';
  record.passwordHash = await passwordDigest('Multiplaza2026!', record.passwordSalt);
  record.passwordAlgorithm = 'pbkdf2';
  const previous = structuredClone(record);
  const actions = createAccountActions(env.api);
  assert.equal(await actions.login({ identifier: record.email, password: 'incorrecta' }), false);
  assert.deepEqual(env.state().accounts[1], previous);
  assert.equal(await actions.login({ identifier: record.email, password: 'Multiplaza2026!' }), 'client');
  const migrated = env.state().accounts[1];
  assert.equal(migrated.id, record.id);
  assert.equal(migrated.passwordAlgorithm, 'bcrypt');
  assert.equal(await bcrypt.compare('Multiplaza2026!', migrated.passwordHash), true);
  assert.deepEqual(migrated.addresses, previous.addresses);
});

test('unicidad entre personas reconoce correo con espacios y teléfonos chilenos con o sin prefijo', () => {
  const state = createMarketplace();
  const seller = state.accounts[0];
  assert.match(profileError({ ...seller, email: '  MILLA@GMAIL.COM ' }, state.accounts, '2026-11-10', seller.id), /correo/);
  assert.equal(normalizePhone('987654321'), normalizePhone('+56 9 8765 4321'));
  assert.equal(normalizePhone('0056 9 8765 4321'), normalizePhone('+56 9 8765 4321'));
  assert.match(profileError({ ...seller, phones: ['987654321'] }, state.accounts, '2026-11-10', seller.id), /otra persona/);
  assert.equal(profileError({ ...seller, phones: ['912345678'] }, state.accounts, '2026-11-10', seller.id), '');
});

test('transportista queda inmutable desde el envío pero permite actualizar el seguimiento', () => {
  const env = fixture();
  const actions = createInteractionActions(env.api);
  const order = env.state().orders.find(item => item.companyId === 'company-cjesus' && item.delivery);
  assert.equal(order.step, 1);
  assert.equal(actions.updateOrder(order.id, { carrier: 'Transporte A', tracking: 'A-001' }), true);
  assert.equal(actions.updateOrder(order.id, { step: 2 }), true);
  assert.equal(actions.updateOrder(order.id, { carrier: 'Transporte B', tracking: 'B-001' }), false);
  assert.equal(env.state().orders.find(item => item.id === order.id).carrier, 'Transporte A');
  assert.equal(actions.updateOrder(order.id, { tracking: 'A-002' }), true);
  assert.equal(actions.updateOrder(order.id, { carrier: 'Transporte A', step: 3 }), true);
  assert.equal(actions.updateOrder(order.id, { carrier: 'Transporte B' }), false);
});
