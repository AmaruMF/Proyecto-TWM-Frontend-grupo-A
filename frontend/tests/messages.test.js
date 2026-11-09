import test from 'node:test';
import assert from 'node:assert/strict';
import { findConversation, isOwnMessage, messageRole, participantName, recipientName, sentMessages, legacyMessages } from '../src/utils/messages.js';

const thread = { id: 'chat', seller: 'Tienda', customer: 'Ana', context: 'Cotización #1', messages: [
  { id: 'greeting', senderRole: 'seller', system: true, text: 'Hola' },
  { id: 'client-1', senderRole: 'client', text: 'Consulta', sentAt: '2026-11-08T10:00:00Z' },
  { id: 'seller-1', senderRole: 'seller', text: 'Respuesta', sentAt: '2026-11-08T10:01:00Z' },
] };

test('cliente y vendedor conservan su autoría al cambiar de vista', () => {
  assert.equal(messageRole(thread.messages[1]), 'client');
  assert.equal(isOwnMessage(thread.messages[1], 'client'), true);
  assert.equal(isOwnMessage(thread.messages[1], 'seller'), false);
  assert.equal(isOwnMessage(thread.messages[2], 'seller'), true);
  assert.equal(isOwnMessage(thread.messages[2], 'client'), false);
  assert.equal(participantName(thread, 'seller'), 'Tienda');
  assert.equal(recipientName(thread, 'seller'), 'Ana');
  assert.equal(recipientName(thread, 'client'), 'Tienda');
});

test('cada perfil solo ve su historial de enviados y excluye saludos automáticos', () => {
  assert.deepEqual(sentMessages([thread], 'client').map(message => message.id), ['client-1']);
  assert.deepEqual(sentMessages([thread], 'seller').map(message => message.id), ['seller-1']);
  const old = { ...thread, messages: [{ id: 'old-greeting', incoming: true }, { id: 'old-message', incoming: false }] };
  assert.deepEqual(sentMessages([old], 'seller'), []);
  assert.deepEqual(sentMessages([old], 'client'), []);
  assert.equal(legacyMessages([old])[0].id, 'old-message');
  assert.equal(messageRole(old.messages[1]), null);
  assert.equal(isOwnMessage(old.messages[1], 'seller'), false);
});

test('ambos participantes abren la misma conversación sin duplicarla ni mezclar clientes', () => {
  assert.equal(findConversation([thread], 'Tienda', 'Cotización #1', 'Ana')?.id, 'chat');
  assert.equal(findConversation([thread], 'Tienda', 'Cotización #1', 'Otro cliente'), undefined);
  assert.equal(findConversation([thread], 'Otra tienda', 'Cotización #1', 'Ana'), undefined);
  assert.equal(findConversation([{ ...thread, customer: undefined }], 'Tienda', 'Cotización #1', 'Ana')?.id, 'chat');
});
