import test from 'node:test';
import assert from 'node:assert/strict';
import { createInteractionActions } from '../src/context/interactionActions.js';
import { today } from '../src/utils/commerce.js';
import { projectMarketplace } from '../src/utils/marketplace.js';
import { sentMessages } from '../src/utils/messages.js';

function setup() {
  let state = {
    accounts: [
      { id: 'buyer', name: 'Millaray', lastName: 'Godoy', birthday: '1990-01-01' },
      { id: 'minor', name: 'Menor', lastName: 'Prueba', birthday: '2020-01-01' },
      { id: 'seller-a', name: 'Cristian', lastName: 'Cuevas', birthday: '1990-01-01' },
      { id: 'seller-b', name: 'Otro', lastName: 'Vendedor', birthday: '1990-01-01' },
      { id: 'outsider', name: 'Otra', lastName: 'Persona', birthday: '1990-01-01' },
    ],
    companies: [{ id: 'a', ownerId: 'seller-a', name: 'Tienda A' }, { id: 'b', ownerId: 'seller-b', name: 'Tienda B' }],
    products: [{ id: 'p', companyId: 'a', sellerId: 'a', name: 'Producto', sku: 'P-1', price: 11900, stock: 5 }],
    services: [
      { id: 's', itemType: 'service', companyId: 'a', sellerId: 'a', name: 'Servicio', sku: 'S-1', price: 23800, durationMinutes: 60 },
      { id: 'adult', itemType: 'service', companyId: 'a', sellerId: 'a', name: 'Servicio restringido', sku: 'S-2', price: 11900, durationMinutes: 60, adultOnly: true },
    ],
    offers: [], orders: [], quotes: [], reviews: [], questions: [], messages: [], transactions: [],
  };
  let session = { accountId: 'buyer', role: 'client' };
  let chatId = null;
  const failures = [];
  const notifications = [];
  const api = {
    getState: () => state,
    getSession: () => session,
    commit: change => { state = typeof change === 'function' ? change(state) : change; },
    setChatId: id => { chatId = id; },
    notify: message => notifications.push(message),
    fail: message => failures.push(message),
    navigate: () => {},
  };
  const actions = createInteractionActions(api);
  return { actions, state: () => state, replace: value => { state = value; }, session: (accountId, role = 'client') => { session = accountId ? { accountId, role } : null; }, chat: () => chatId, failures, notifications };
}

test('solo el vendedor propietario puede avanzar un pedido y registrar su envío', () => {
  const app = setup();
  app.state().orders.push({ id: 'order', companyId: 'a', customerId: 'buyer', step: 0, delivery: true, carrier: '', tracking: '', items: [{ productId: 'p' }] });
  assert.equal(app.actions.updateOrder('order', { step: 1 }), false);
  app.session('seller-b', 'seller');
  assert.equal(app.actions.updateOrder('order', { step: 1 }), false);
  app.session('seller-a', 'seller');
  assert.equal(app.actions.updateOrder('order', { step: 2 }), false);
  assert.equal(app.actions.updateOrder('order', { step: 1, customerId: 'outsider', companyId: 'b' }), true);
  assert.equal(app.state().orders[0].customerId, 'buyer');
  assert.equal(app.state().orders[0].companyId, 'a');
  assert.equal(app.actions.updateOrder('order', { step: 2 }), false);
  assert.equal(app.actions.updateOrder('order', { carrier: ' Chilexpress ', tracking: ' ABC-123 ' }), true);
  assert.equal(app.actions.updateOrder('order', { step: 2 }), true);
  assert.equal(app.actions.updateOrder('order', { step: 1 }), false);
  assert.equal(app.actions.updateOrder('order', { step: 3 }), true);
  assert.equal(app.actions.updateOrder('order', { step: 4 }), false);
  assert.deepEqual(app.state().orders[0].statusHistory.map(entry => entry.step), [1, 2, 3]);
  assert.ok(app.state().orders[0].statusHistory.every(entry => entry.id && entry.createdAt));
  assert.equal(app.state().orders[0].tracking, 'ABC-123');
});

test('retiros y servicios avanzan sin datos ficticios de transporte', () => {
  const app = setup();
  app.session('seller-a', 'seller');
  for (const isService of [false, true]) {
    const order = { id: 'order-' + isService, companyId: 'a', step: 1, delivery: false, isService, items: [{ productId: 'p' }] };
    app.state().orders.push(order);
    assert.equal(app.actions.updateOrder(order.id, { step: 2 }), true);
    assert.equal(app.actions.updateOrder(order.id, { step: 3 }), true);
    assert.equal(app.state().orders.find(item => item.id === order.id).carrier, undefined);
  }
});

test('solicitar cotización valida el servicio real, edad y fecha; asigna identidad de sesión', () => {
  const app = setup();
  app.session('minor');
  assert.equal(app.actions.requestQuote({ id: 'adult', adultOnly: false }, { date: today(), detail: 'Consulta' }), false);
  assert.equal(app.actions.requestQuote({ id: 's' }, { date: '2000-01-01', detail: 'Consulta' }), false);
  assert.equal(app.actions.requestQuote({ id: 's' }, { date: today(), detail: '  ' }), false);
  app.session('buyer');
  assert.equal(app.actions.requestQuote({ id: 's', seller: 'Suplantado', companyId: 'b' }, { date: today(), detail: ' Necesito el servicio ', customerId: 'outsider' }), true);
  const quote = app.state().quotes[0];
  assert.equal(quote.companyId, 'a');
  assert.equal(quote.customerId, 'buyer');
  assert.equal(quote.customer, 'Millaray Godoy');
  assert.equal(quote.detail, 'Necesito el servicio');
  assert.equal(quote.referencePrice, 23800);
  assert.ok(quote.sentAt);
  app.session('seller-a', 'client');
  assert.equal(app.actions.requestQuote({ id: 's' }, { date: today(), detail: 'Propio' }), false);
});

test('responder y aceptar cotizaciones conserva permisos y crea una sola contratación', () => {
  const app = setup();
  app.actions.requestQuote({ id: 's' }, { date: today(), detail: 'Consulta' });
  const quoteId = app.state().quotes[0].id;
  app.session('seller-b', 'seller');
  assert.equal(app.actions.replyQuote(quoteId, 35000, 'Condiciones'), false);
  app.session('seller-a', 'seller');
  assert.equal(app.actions.replyQuote(quoteId, -1, 'Condiciones'), false);
  assert.equal(app.actions.replyQuote(quoteId, 35000, 'Condiciones'), true);
  assert.equal(app.actions.replyQuote(quoteId, 35000, 'Otra respuesta'), false);
  app.session('outsider');
  assert.equal(app.actions.acceptQuote(quoteId), false);
  app.session('buyer');
  assert.equal(app.actions.acceptQuote(quoteId), true);
  assert.equal(app.actions.acceptQuote(quoteId), false);
  assert.equal(app.state().orders.length, 1);
  const order = app.state().orders[0];
  assert.equal(order.isService, true);
  assert.equal(order.step, 0);
  assert.equal(order.customerId, 'buyer');
  assert.equal(order.companyId, 'a');
  assert.equal(order.items[0].serviceId, 's');
  assert.equal(order.items[0].sku, 'S-1');
  assert.equal(order.net + order.tax, order.total);
  assert.equal(app.state().transactions.length, 0, 'Aceptar no inventa un cobro');
  assert.equal(app.actions.canReview('service', 's'), false);
  app.session('seller-a', 'seller');
  for (const step of [1, 2, 3]) assert.equal(app.actions.updateOrder(order.id, { step }), true);
  app.session('buyer');
  assert.equal(app.actions.canReview('service', 's'), true);
});

test('aceptar una cotización revalida restricción etaria y disponibilidad actuales', () => {
  const app = setup();
  app.state().quotes.push({ id: 'adult-quote', customerId: 'minor', companyId: 'a', serviceId: 'adult', price: 10000, step: 1, date: today() });
  app.session('minor');
  assert.equal(app.actions.acceptQuote('adult-quote'), false);
  app.state().quotes.push({ id: 'hidden-quote', customerId: 'buyer', companyId: 'a', serviceId: 's', price: 10000, step: 1, date: today() });
  app.state().services[0].hidden = true;
  app.session('buyer');
  assert.equal(app.actions.acceptQuote('hidden-quote'), false);
  assert.equal(app.state().orders.length, 0);
});

test('reseñas requieren adquisición completada propia y nunca aceptan comprobantes inventados', () => {
  const app = setup();
  assert.equal(app.actions.submitReview({ targetType: 'product', targetId: 'p', rating: 5, comment: 'Buena compra', orderId: 'inventado', customerId: 'otro' }), false);
  app.state().orders.push({ id: 'verified', companyId: 'a', customerId: 'buyer', step: 2, items: [{ productId: 'p' }] });
  assert.equal(app.actions.canReview('product', 'p'), false);
  app.state().orders[0].step = 3;
  assert.equal(app.actions.canReview('product', 'p'), true);
  assert.equal(app.actions.submitReview({ targetType: 'product', targetId: 'p', rating: 6, comment: 'Incorrecto' }), false);
  assert.equal(app.actions.submitReview({ targetType: 'product', targetId: 'p', rating: 4, comment: ' Correcto ', orderId: 'inventado', customerId: 'outsider' }), true);
  const review = app.state().reviews[0];
  assert.equal(review.orderId, 'verified');
  assert.equal(review.customerId, 'buyer');
  assert.equal(review.customerName, 'Millaray Godoy');
  assert.equal(review.comment, 'Correcto');
  assert.equal(app.actions.canReview('product', 'p'), false);
  assert.equal(app.actions.submitReview({ targetType: 'product', targetId: 'p', rating: 5, comment: 'Duplicada' }), false);
  assert.equal(app.actions.canReview('seller', 'a'), true);
  assert.equal(app.actions.submitReview({ targetType: 'seller', targetId: 'a', rating: 5, comment: 'Buen vendedor' }), true);
  app.session('outsider');
  assert.equal(app.actions.canReview('seller', 'a'), false);
  app.session('seller-a', 'client');
  app.state().orders.push({ id: 'self', companyId: 'a', customerId: 'seller-a', step: 3, items: [{ productId: 'p' }] });
  assert.equal(app.actions.canReview('seller', 'a'), false);
  assert.equal(app.actions.canReview('product', 'p'), false);
});

test('preguntas y respuestas públicas conservan autor y solo admite responder al dueño', () => {
  const app = setup();
  assert.equal(app.actions.askQuestion({ itemId: 'p', itemType: 'product', text: '¿Disponible?', customerId: 'outsider', companyId: 'b' }), true);
  const question = app.state().questions[0];
  assert.equal(question.customerId, 'buyer');
  assert.equal(question.companyId, 'a');
  app.session('seller-b', 'seller');
  assert.equal(app.actions.answerQuestion(question.id, 'Respuesta ajena'), false);
  app.session('seller-a', 'client');
  assert.equal(app.actions.answerQuestion(question.id, 'Desde vista cliente'), false);
  app.session('seller-a', 'seller');
  assert.equal(app.actions.answerQuestion(question.id, ' Sí, disponible. '), true);
  assert.equal(app.actions.answerQuestion(question.id, 'Sobrescribir'), false);
  assert.equal(app.state().questions[0].answer, 'Sí, disponible.');
  assert.equal(app.state().questions[0].answeredBy, 'seller-a');
  assert.equal(app.actions.askQuestion({ itemId: 'p', text: 'Pregunta propia' }), false);
});

test('mensajería usa IDs de participantes, reutiliza hilos y no permite suplantar al cliente', () => {
  const app = setup();
  const threadId = app.actions.openChat('a', 'Producto p', 'Otra Persona', 'outsider');
  assert.equal(app.state().messages[0].customerId, 'buyer');
  assert.equal(app.state().messages[0].customer, 'Millaray Godoy');
  assert.equal(app.state().messages[0].messages.length, 0);
  assert.equal(app.actions.openChat('Tienda A', 'Producto p'), threadId);
  assert.equal(app.state().messages.length, 1);
  assert.equal(app.actions.sendMessage(threadId, ' Hola vendedor '), true);
  assert.equal(app.state().messages[0].messages[0].senderId, 'buyer');
  app.session('outsider');
  assert.equal(app.actions.openConversation(threadId), false);
  assert.equal(app.actions.sendMessage(threadId, 'Intrusión'), false);
  app.session('seller-b', 'seller');
  assert.equal(app.actions.openConversation(threadId), false);
  assert.equal(app.actions.sendMessage(threadId, 'Intrusión'), false);
  app.session('seller-a', 'seller');
  assert.equal(app.actions.openChat('a', 'Producto p'), false, 'El vendedor necesita cliente explícito');
  assert.equal(app.actions.openChat('a', 'Producto p', 'Millaray Godoy', 'buyer'), threadId);
  assert.equal(app.actions.openConversation(threadId), true);
  assert.equal(app.chat(), threadId);
  assert.equal(app.actions.sendMessage(threadId, 'Hola cliente'), true);
  const reply = app.state().messages[0].messages[1];
  assert.equal(reply.senderId, 'seller-a');
  assert.equal(reply.senderRole, 'seller');
  assert.equal(reply.senderName, 'Cristian Cuevas');
  assert.equal(app.actions.sendMessage(threadId, 'x'.repeat(501)), false);
  app.session('seller-a', 'client');
  assert.equal(app.actions.openConversation(threadId), false, 'El rol cliente no permite leer al vendedor como comprador');
});

test('nombres comerciales ambiguos no mezclan conversaciones de distintas empresas', () => {
  const app = setup();
  app.state().companies[1].name = 'Tienda A';
  assert.equal(app.actions.openChat('Tienda A', 'Consulta'), false);
  const first = app.actions.openChat('a', 'Consulta');
  const second = app.actions.openChat('b', 'Consulta');
  assert.notEqual(first, second);
  assert.equal(app.state().messages.length, 2);
  app.session('seller-a', 'seller');
  assert.equal(app.actions.openChat('b', 'Consulta', 'Millaray Godoy', 'buyer'), false);
});

test('renombrar cliente, empresa o artículo mantiene la conversación y la autoría histórica', () => {
  const app = setup();
  const id = app.actions.openChat('a', 'Consulta de producto #p');
  assert.equal(app.actions.sendMessage(id, 'Mensaje original'), true);
  app.state().products[0].name = 'Producto actualizado';
  app.state().companies[0].name = 'Empresa actualizada';
  app.state().accounts[0].name = 'Milla';
  assert.equal(app.actions.openChat('a', 'Consulta de producto #p'), id);
  const thread = app.state().messages[0];
  assert.equal(thread.contextKey, 'product:p');
  assert.equal(thread.context, 'Consulta de producto Producto actualizado');
  assert.equal(thread.customer, 'Milla Godoy');
  assert.equal(thread.seller, 'Empresa actualizada');
  assert.equal(thread.messages[0].senderName, 'Millaray Godoy');
  app.session('seller-a', 'seller');
  assert.equal(app.actions.openConversation(id), true);
  assert.equal(app.actions.sendMessage(id, 'Respuesta posterior'), true);
  assert.equal(app.state().messages[0].messages.length, 2);
  app.session('buyer');
  assert.equal(app.actions.openChat('a', 'Consulta de producto #p'), id);
  assert.equal(app.state().messages.length, 1);
});

test('un contexto antiguo por nombre se migra con nombres históricos sin perder mensajes', () => {
  const app = setup();
  app.state().products[0].name = 'Producto nuevo';
  app.state().orders.push({ id: 'old-sale', companyId: 'a', customerId: 'buyer', items: [{ productId: 'p', name: 'Producto anterior' }] });
  app.state().messages.push({ id: 'old-thread', companyId: 'a', customerId: 'buyer', seller: 'Tienda A', customer: 'Millaray Godoy', context: 'Consulta de producto Producto anterior', messages: [{ id: 'old-message', senderId: 'buyer', senderRole: 'client', text: 'Consulta histórica' }] });
  assert.equal(app.actions.openChat('a', 'Consulta de producto #p'), 'old-thread');
  assert.equal(app.state().messages.length, 1);
  assert.equal(app.state().messages[0].contextKey, 'product:p');
  assert.equal(app.state().messages[0].messages[0].text, 'Consulta histórica');
  assert.equal(app.actions.openChat('b', 'Consulta de producto #p'), false);
});

test('cambiar nombre no habilita reseñas duplicadas ni elimina la adquisición verificada', () => {
  const app = setup();
  app.state().orders.push({ id: 'verified', companyId: 'a', customerId: 'buyer', step: 3, items: [{ productId: 'p' }] });
  assert.equal(app.actions.submitReview({ targetType: 'product', targetId: 'p', rating: 5, comment: 'Producto recibido' }), true);
  app.state().accounts[0].name = 'Milla';
  app.state().companies[0].name = 'Empresa nueva';
  app.state().products[0].name = 'Producto renombrado';
  assert.equal(app.actions.canReview('product', 'p'), false);
  assert.equal(app.actions.submitReview({ targetType: 'product', targetId: 'p', rating: 4, comment: 'Repetición con otro nombre' }), false);
  assert.equal(app.actions.canReview('seller', 'a'), true);
  assert.equal(app.actions.submitReview({ targetType: 'seller', targetId: 'a', rating: 4, comment: 'Vendedor verificado' }), true);
  assert.equal(app.state().reviews[0].customerName, 'Milla Godoy');
  assert.equal(app.state().reviews[0].orderId, 'verified');
  assert.equal(app.state().reviews[1].customerName, 'Millaray Godoy');
});

test('proyección y mensajes enviados distinguen identidades aunque compartan nombre y rol', () => {
  const app = setup();
  app.state().returns = [];
  app.state().userData = {};
  const buyerThread = app.actions.openChat('a', 'Consulta común');
  app.actions.sendMessage(buyerThread, 'Mensaje comprador');
  app.state().accounts.find(account => account.id === 'outsider').name = 'Millaray';
  app.state().accounts.find(account => account.id === 'outsider').lastName = 'Godoy';
  app.session('outsider');
  const outsiderThread = app.actions.openChat('a', 'Consulta común');
  app.actions.sendMessage(outsiderThread, 'Mensaje de otra cuenta');
  assert.notEqual(buyerThread, outsiderThread);
  const buyerView = projectMarketplace(app.state(), { accountId: 'buyer', role: 'client' }, today());
  const outsiderView = projectMarketplace(app.state(), { accountId: 'outsider', role: 'client' }, today());
  const sellerView = projectMarketplace(app.state(), { accountId: 'seller-a', role: 'seller' }, today());
  assert.deepEqual(buyerView.messages.map(thread => thread.id), [buyerThread]);
  assert.deepEqual(outsiderView.messages.map(thread => thread.id), [outsiderThread]);
  assert.equal(sellerView.messages.length, 2);
  assert.equal(sentMessages(sellerView.messages, 'client', 'seller-a').length, 0);
  assert.equal(sentMessages(sellerView.messages, 'client', 'buyer').length, 1);
  assert.equal(sentMessages(sellerView.messages, 'client', 'outsider').length, 1);
});
