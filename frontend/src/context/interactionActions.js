import { applyOffers, orderTotals, today } from '../utils/commerce.js';
import { canAccessThread, canManageCompany, fullName, orderUpdateError, reviewOrder } from '../utils/identity.js';
import { isAdult } from '../utils/validation.js';

const text = value => typeof value === 'string' ? value.trim() : '';
const identifier = () => crypto.randomUUID();
const timestamp = () => new Date().toISOString();
const validDate = value => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return false;
  const date = new Date(value + 'T12:00:00Z');
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
};

export function createInteractionActions(api) {
  const reject = message => { api.fail(message); return false; };
  const current = () => {
    const state = api.getState();
    const session = api.getSession();
    const account = session && state.accounts.find(item => item.id === session.accountId);
    return { state, session, account };
  };
  const findItem = (state, type, itemId) => (type === 'service' ? state.services : state.products).find(item => item.id === itemId);
  const companyFor = (state, value) => {
    const id = text(value);
    const exact = state.companies.find(company => company.id === id);
    if (exact) return exact;
    const matches = state.companies.filter(company => company.name.trim().toLocaleLowerCase('es') === id.toLocaleLowerCase('es'));
    return matches.length === 1 ? matches[0] : null;
  };
  const conversationDetails = (state, company, context) => {
    for (const [type, prefix] of [['product', 'Consulta de producto '], ['service', 'Consulta de servicio ']]) {
      if (!context.startsWith(prefix)) continue;
      const suffix = context.slice(prefix.length);
      const collection = type === 'product' ? state.products : state.services;
      const candidates = collection.filter(item => (item.companyId || item.sellerId) === company.id && (suffix.startsWith('#') ? item.id === suffix.slice(1) : item.name === suffix));
      if (candidates.length !== 1) return suffix.startsWith('#') ? null : { key: 'text:' + context, label: context, legacy: [context] };
      const item = candidates[0];
      const historicalNames = state.orders.filter(order => order.companyId === company.id).flatMap(order => order.items || []).filter(line => (type === 'product' ? line.productId : line.serviceId) === item.id).map(line => line.name);
      return { key: type + ':' + item.id, label: prefix + item.name, legacy: [context, prefix + item.name, ...historicalNames.map(name => prefix + name)] };
    }
    return { key: 'text:' + context, label: context, legacy: [context] };
  };
  const refreshThread = (state, thread) => {
    const company = state.companies.find(item => item.id === thread.companyId);
    const customer = state.accounts.find(item => item.id === thread.customerId);
    let context = thread.context;
    if (thread.contextKey?.startsWith('product:') || thread.contextKey?.startsWith('service:')) {
      const service = thread.contextKey.startsWith('service:');
      const itemId = thread.contextKey.slice(8);
      const item = (service ? state.services : state.products).find(record => record.id === itemId && (record.companyId || record.sellerId) === thread.companyId);
      if (item) context = (service ? 'Consulta de servicio ' : 'Consulta de producto ') + item.name;
    }
    return { ...thread, seller: company?.name || thread.seller, customer: customer ? fullName(customer) : thread.customer, context };
  };

  const reviewable = (state, session, account, targetType, targetId) => {
    if (!session || !account || !['product', 'service', 'seller'].includes(targetType) || !targetId) return null;
    const item = targetType === 'seller' ? state.companies.find(company => company.id === targetId) : findItem(state, targetType, targetId);
    const company = targetType === 'seller' ? item : state.companies.find(company => company.id === (item?.companyId || item?.sellerId));
    if (!item || !company || company.ownerId === account.id) return null;
    if (state.reviews.some(review => review.customerId === account.id && review.targetType === targetType && review.targetId === targetId)) return null;
    const order = reviewOrder(state, account.id, targetType, targetId);
    return order ? { item, company, order } : null;
  };

  const updateOrder = (orderId, patch = {}) => {
    const { state, session, account } = current();
    if (!account) return reject('Inicia sesión para gestionar pedidos.');
    const order = state.orders.find(item => item.id === orderId);
    const changes = {};
    if (Object.hasOwn(patch, 'step')) changes.step = patch.step;
    if (Object.hasOwn(patch, 'carrier')) changes.carrier = text(patch.carrier);
    if (Object.hasOwn(patch, 'tracking')) changes.tracking = text(patch.tracking);
    if ((changes.carrier?.length || 0) > 100 || (changes.tracking?.length || 0) > 100) return reject('Los datos de transporte no pueden superar 100 caracteres.');
    const error = orderUpdateError(state, session, order, changes);
    if (error) return reject(error);
    const now = timestamp();
    const saved = { ...order, ...changes, updatedAt: now };
    if (changes.step !== undefined) saved.statusHistory = [...(order.statusHistory || []), { id: identifier(), step: changes.step, createdAt: now }];
    api.commit(raw => ({ ...raw, orders: raw.orders.map(item => item.id === orderId ? saved : item) }));
    api.notify(changes.step !== undefined ? 'Estado del pedido actualizado.' : 'Datos de envío actualizados.');
    return true;
  };

  const requestQuote = (service, details = {}) => {
    const { state, account } = current();
    if (!account) return reject('Inicia sesión para solicitar una cotización.');
    const item = state.services.find(record => record.id === service?.id);
    const company = state.companies.find(record => record.id === (item?.companyId || item?.sellerId));
    if (!item || item.hidden || !company) return reject('Este servicio no está disponible.');
    if (company.ownerId === account.id) return reject('No puedes solicitar una cotización de tu propio servicio.');
    if ((item.adultOnly || item.restrictionAge) && !isAdult(account.birthday, today())) return reject('Debes tener 18 años cumplidos para solicitar este servicio.');
    if (!validDate(details.date) || details.date < today()) return reject('Selecciona una fecha válida que no sea anterior a hoy.');
    const detail = text(details.detail);
    if (!detail || detail.length > 1500) return reject('Describe lo que necesitas en un máximo de 1500 caracteres.');
    const priced = applyOffers([item], state.offers, today())[0];
    const quote = { id: identifier(), serviceId: item.id, serviceName: item.name, serviceSku: item.sku, companyId: company.id, sellerId: company.id, seller: company.name, customerId: account.id, customer: fullName(account), date: details.date, detail, referencePrice: priced.price, sentAt: timestamp(), step: 0 };
    api.commit(raw => ({ ...raw, quotes: [quote, ...raw.quotes] }));
    api.notify('Solicitud de cotización enviada.');
    return true;
  };

  const replyQuote = (quoteId, price, reply) => {
    const { state, session, account } = current();
    const quote = state.quotes.find(item => item.id === quoteId);
    if (!account || !quote || !canManageCompany(state, session, quote.companyId)) return reject('No puedes responder esta cotización.');
    if (quote.step !== 0) return reject('Esta cotización ya fue respondida.');
    const amount = Number(price);
    const response = text(reply);
    if (!Number.isSafeInteger(amount) || amount < 1) return reject('Ingresa un valor entero mayor que cero.');
    if (!response || response.length > 1500) return reject('Escribe las condiciones en un máximo de 1500 caracteres.');
    api.commit(raw => ({ ...raw, quotes: raw.quotes.map(item => item.id === quoteId ? { ...item, price: amount, reply: response, repliedAt: timestamp(), step: 1 } : item) }));
    api.notify('Cotización respondida.');
    return true;
  };

  const acceptQuote = quoteId => {
    const { state, account } = current();
    const quote = state.quotes.find(item => item.id === quoteId);
    if (!account || !quote || quote.customerId !== account.id) return reject('No puedes aceptar esta cotización.');
    if (quote.step !== 1 || state.orders.some(order => order.quoteId === quoteId)) return reject('Esta cotización no está disponible para aceptar.');
    const item = state.services.find(service => service.id === quote.serviceId);
    const company = state.companies.find(record => record.id === quote.companyId);
    if (!item || item.hidden || !company || (item.companyId || item.sellerId) !== company.id) return reject('El servicio de esta cotización ya no está disponible.');
    if (company.ownerId === account.id) return reject('No puedes contratar tu propio servicio.');
    if ((item.adultOnly || item.restrictionAge) && !isAdult(account.birthday, today())) return reject('Debes tener 18 años cumplidos para contratar este servicio.');
    if (!Number.isSafeInteger(quote.price) || quote.price < 1) return reject('La cotización no tiene un valor válido.');
    const now = timestamp();
    const order = { id: identifier(), quoteId, isService: true, companyId: company.id, sellerId: company.id, seller: company.name, customerId: account.id, customer: fullName(account), date: today(), createdAt: now, scheduledDate: quote.date, step: 0, delivery: false, address: 'Prestación coordinada con ' + company.name, carrier: '', tracking: '', paymentMethod: 'Cotización aceptada', paymentStatus: 'Pendiente', items: [{ serviceId: item.id, sku: item.sku, name: item.name, image: item.image, price: quote.price, quantity: 1, durationMinutes: item.durationMinutes }], ...orderTotals([{ price: quote.price, quantity: 1 }], 0), statusHistory: [{ id: identifier(), step: 0, createdAt: now }] };
    api.commit(raw => ({ ...raw, quotes: raw.quotes.map(record => record.id === quoteId ? { ...record, step: 2, acceptedAt: now, orderId: order.id } : record), orders: [order, ...raw.orders] }));
    api.notify('Cotización aceptada. Puedes revisar el servicio en Mis pedidos.');
    return true;
  };

  const canReview = (targetType, targetId) => {
    const { state, session, account } = current();
    return Boolean(reviewable(state, session, account, targetType, targetId));
  };

  const submitReview = ({ targetType, targetId, rating, comment } = {}) => {
    const { state, session, account } = current();
    const verified = reviewable(state, session, account, targetType, targetId);
    if (!verified) return reject('Solo puedes reseñar una adquisición completada y no calificada anteriormente.');
    const body = text(comment);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5 || !body || body.length > 500) return reject('Selecciona entre 1 y 5 estrellas y escribe una reseña de hasta 500 caracteres.');
    const review = { id: identifier(), customerId: account.id, customerName: fullName(account), targetType, targetId, companyId: verified.company.id, orderId: verified.order.id, rating, comment: body, createdAt: timestamp() };
    api.commit(raw => ({ ...raw, reviews: [review, ...raw.reviews] }));
    api.notify('Reseña publicada.');
    return true;
  };

  const askQuestion = ({ itemId, itemType = 'product', text: questionText } = {}) => {
    const { state, account } = current();
    if (!account) return reject('Inicia sesión para publicar una pregunta.');
    if (!['product', 'service'].includes(itemType)) return reject('El tipo de publicación no es válido.');
    const item = findItem(state, itemType, itemId);
    const company = state.companies.find(record => record.id === (item?.companyId || item?.sellerId));
    if (!item || item.hidden || !company) return reject('Esta publicación no está disponible.');
    if (company.ownerId === account.id) return reject('Responde las preguntas de tus clientes en tu propia publicación.');
    const body = text(questionText);
    if (!body || body.length > 500) return reject('Escribe una pregunta de hasta 500 caracteres.');
    const question = { id: identifier(), itemId, itemType, ...(itemType === 'product' ? { productId: itemId } : { serviceId: itemId }), companyId: company.id, customerId: account.id, customer: fullName(account), text: body, createdAt: timestamp() };
    api.commit(raw => ({ ...raw, questions: [question, ...raw.questions] }));
    api.notify('Tu pregunta quedó publicada.');
    return true;
  };

  const answerQuestion = (questionId, answer) => {
    const { state, session, account } = current();
    const question = state.questions.find(item => item.id === questionId);
    if (!account || !question || !canManageCompany(state, session, question.companyId)) return reject('No puedes responder esta pregunta.');
    if (question.answer) return reject('Esta pregunta ya tiene una respuesta pública.');
    const body = text(answer);
    if (!body || body.length > 500) return reject('Escribe una respuesta de hasta 500 caracteres.');
    api.commit(raw => ({ ...raw, questions: raw.questions.map(item => item.id === questionId ? { ...item, answer: body, answeredBy: account.id, answeredAt: timestamp() } : item) }));
    api.notify('Respuesta publicada.');
    return true;
  };

  const openConversation = threadId => {
    const { state, session, account } = current();
    const thread = state.messages.find(item => item.id === threadId);
    if (!account || !canAccessThread(state, session, thread)) return reject('No puedes acceder a esta conversación.');
    const refreshed = refreshThread(state, thread);
    api.commit(raw => ({ ...raw, messages: raw.messages.map(item => item.id === threadId ? refreshed : item) }));
    api.setChatId(thread.id);
    return true;
  };

  const openChat = (seller, context = 'Consulta de producto', customer, customerId) => {
    const { state, session, account } = current();
    if (!account) return reject('Inicia sesión para abrir una conversación.');
    const company = companyFor(state, seller);
    if (!company) return reject('No se pudo identificar de forma única al vendedor.');
    const conversationContext = text(context);
    if (!conversationContext || conversationContext.length > 200) return reject('El contexto de conversación debe tener entre 1 y 200 caracteres.');
    let participant;
    if (session.role === 'seller') {
      if (!canManageCompany(state, session, company.id)) return reject('Solo puedes gestionar conversaciones de tu empresa.');
      participant = state.accounts.find(item => item.id === customerId);
      if (!participant) return reject('Selecciona al cliente de esta conversación.');
    } else {
      participant = account;
    }
    if (participant.id === company.ownerId) return reject('No puedes iniciar una conversación contigo mismo.');
    const details = conversationDetails(state, company, conversationContext);
    if (!details) return reject('La publicación no corresponde a esta empresa.');
    const existing = state.messages.find(thread => thread.companyId === company.id && thread.customerId === participant.id && (thread.contextKey ? thread.contextKey === details.key : details.legacy.includes(thread.context)));
    if (existing) {
      const refreshed = { ...refreshThread(state, existing), contextKey: details.key, context: details.label };
      api.commit(raw => ({ ...raw, messages: raw.messages.map(item => item.id === existing.id ? refreshed : item) }));
      api.setChatId(existing.id); return existing.id;
    }
    const thread = { id: identifier(), companyId: company.id, sellerId: company.id, seller: company.name, customerId: participant.id, customer: fullName(participant), contextKey: details.key, context: details.label, createdAt: timestamp(), messages: [] };
    api.commit(raw => ({ ...raw, messages: [...raw.messages, thread] }));
    api.setChatId(thread.id);
    return thread.id;
  };

  const sendMessage = (threadId, value) => {
    const { state, session, account } = current();
    const thread = state.messages.find(item => item.id === threadId);
    if (!account || !canAccessThread(state, session, thread)) return reject('No puedes enviar mensajes en esta conversación.');
    const body = text(value);
    if (!body || body.length > 500) return reject('Escribe un mensaje de hasta 500 caracteres.');
    const sentAt = timestamp();
    const entry = { id: identifier(), senderId: account.id, senderRole: session.role === 'seller' ? 'seller' : 'client', senderName: fullName(account), incoming: session.role === 'seller', text: body, sentAt, time: new Intl.DateTimeFormat('es-CL', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Santiago' }).format(new Date(sentAt)) };
    api.commit(raw => ({ ...raw, messages: raw.messages.map(item => item.id === threadId ? { ...refreshThread(raw, item), messages: [...item.messages, entry], updatedAt: sentAt } : item) }));
    return true;
  };

  return { updateOrder, requestQuote, replyQuote, acceptQuote, canReview, submitReview, askQuestion, answerQuestion, openChat, openConversation, sendMessage };
}
