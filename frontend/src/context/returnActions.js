import { orderTotals, today } from '../utils/commerce.js';
import { canManageCompany, fullName } from '../utils/identity.js';
import { returnableAmount } from '../utils/financial.js';

const text = value => typeof value === 'string' ? value.trim() : '';
const completed = transaction => transaction && transaction.type !== 'refund' && transaction.status === 'Completada' && Number.isSafeInteger(transaction.total) && transaction.total > 0;

export function refundablePayment(state, order) {
  if (!order || order.paymentStatus && !['Completada', 'Reembolsada parcialmente', 'Reembolsada'].includes(order.paymentStatus)) return null;
  return (state.transactions || []).find(transaction => (!order.paymentId || transaction.id === order.paymentId) && transaction.orderId === order.id && transaction.customerId === order.customerId && transaction.companyId === order.companyId && completed(transaction)) || null;
}

export function refundAvailability(state, request) {
  const order = state.orders.find(item => item.id === request?.orderId);
  if (!order || order.step !== 3) return { error: 'La solicitud no tiene un pedido entregado asociado.' };
  const payment = refundablePayment(state, order);
  if (!payment) return { error: 'No hay un comprobante de pago completado vinculado al pedido. Los registros históricos incompletos no permiten emitir un reembolso.' };
  const issued = (state.refunds || []).filter(refund => refund.orderId === order.id && refund.status === 'completed');
  if (issued.some(refund => !Number.isSafeInteger(refund.amount) || refund.amount <= 0)) return { error: 'El historial de reembolsos contiene un importe inválido. Revisa el comprobante antes de continuar.' };
  if (issued.some(refund => refund.returnId === request.id)) return { error: 'Esta devolución ya tiene un reembolso registrado.' };
  const previousAmount = issued.reduce((sum, refund) => sum + refund.amount, 0);
  const amount = Math.min(returnableAmount(order) - previousAmount, payment.total - previousAmount);
  if (!Number.isSafeInteger(amount) || amount <= 0) return { error: 'No existe un saldo pagado disponible para reembolsar.' };
  return { order, payment, amount, previousAmount };
}

export function createReturnActions(api) {
  const date = () => api.getDate?.() || today();
  const reject = message => { api.fail(message); return false; };
  const active = () => {
    const state = api.getState();
    const session = api.getSession();
    return { state, session, account: state.accounts.find(item => item.id === session?.accountId) };
  };
  const requestReturn = (orderId, { reason, detail } = {}) => {
    const { state, session, account } = active();
    const order = state.orders.find(item => item.id === orderId);
    if (!account || session.role !== 'client' || !order || order.customerId !== account.id) return reject('Solo puedes solicitar devoluciones de tus propias compras desde la vista de cliente.');
    if (order.step !== 3) return reject('Solo puedes solicitar la devolución de un pedido entregado o un servicio finalizado.');
    if (state.returns.some(item => item.orderId === orderId)) return reject('Este pedido ya tiene una solicitud de devolución.');
    if (!text(reason) || text(reason).length > 100 || !text(detail) || text(detail).length > 1500) return reject('Indica un motivo y describe lo ocurrido en un máximo de 1500 caracteres.');
    const amount = returnableAmount(order);
    if (!amount) return reject('El pedido no tiene un importe de artículos válido para devolver.');
    const request = { id: crypto.randomUUID(), orderId: order.id, companyId: order.companyId, sellerId: order.companyId, seller: order.seller, customerId: account.id, customer: fullName(account), description: order.items.map(item => `${item.name} ×${item.quantity}`).join(', '), date: date(), createdAt: new Date().toISOString(), total: amount, amount, shippingRefunded: false, reason: text(reason), detail: text(detail), step: 0, status: 'Solicitada' };
    api.commit(current => ({ ...current, returns: [request, ...current.returns] }));
    api.notify('Solicitud de devolución registrada. El importe de envío no está incluido.');
    return true;
  };

  const reviewReturn = (returnId, status) => {
    const { state, session, account } = active();
    const request = state.returns.find(item => item.id === returnId);
    const order = state.orders.find(item => item.id === request?.orderId);
    if (!account || !request || !order || !canManageCompany(state, session, request.companyId) || request.companyId !== order.companyId) return reject('No puedes gestionar esta solicitud de devolución.');
    if (!['Aprobada', 'Rechazada'].includes(status)) return reject('Selecciona aprobar o rechazar la solicitud.');
    if (!['Solicitada', 'En revisión'].includes(request.status) || request.step >= 2) return reject('Esta solicitud ya tiene una resolución.');
    api.commit(current => ({ ...current, returns: current.returns.map(item => item.id === returnId ? { ...item, status, step: 2, reviewedBy: account.id, reviewedAt: new Date().toISOString() } : item) }));
    api.notify(`Devolución ${status.toLocaleLowerCase('es')}.`);
    return true;
  };

  const issueRefund = (returnId, reference) => {
    const { state, session, account } = active();
    const request = state.returns.find(item => item.id === returnId);
    if (!account || !request || !canManageCompany(state, session, request.companyId)) return reject('No puedes emitir este reembolso.');
    if (request.status !== 'Aprobada' || request.step !== 2) return reject('El reembolso requiere una devolución aprobada y todavía no emitida.');
    const available = refundAvailability(state, request);
    if (available.error) return reject(available.error);
    const { order, payment, amount, previousAmount } = available;
    if (request.customerId !== order.customerId || request.companyId !== order.companyId) return reject('La identidad de la devolución no coincide con su pedido.');
    const financial = orderTotals([{ price: amount, quantity: 1 }], 0);
    const createdAt = new Date().toISOString();
    const id = crypto.randomUUID();
    const code = text(reference) || `REEMB-${id.slice(0, 8).toUpperCase()}`;
    if (code.length > 100) return reject('La referencia de reembolso puede tener hasta 100 caracteres.');
    const refund = { id, returnId, orderId: order.id, paymentId: payment.id, customerId: order.customerId, companyId: order.companyId, amount, ...financial, status: 'completed', method: payment.paymentMethod || order.paymentMethod || 'Medio original registrado', reference: code, createdAt, date: date(), shippingRefunded: false, issuedBy: account.id };
    const items = previousAmount === 0 && amount === returnableAmount(order) ? order.items.map(item => ({ ...item })) : [{ id: `refund:${id}`, itemType: 'refund', name: `Saldo de reembolso de artículos del pedido #${order.id}`, price: amount, quantity: 1, lineTotal: amount }];
    const transaction = { id: crypto.randomUUID(), type: 'refund', direction: 'refund', refundId: id, returnId, orderId: order.id, paymentId: payment.id, customerId: order.customerId, customer: order.customer, companyId: order.companyId, sellerId: order.companyId, seller: order.seller, description: `Reembolso de devolución #${returnId}`, date: date(), createdAt, ...financial, items, paymentMethod: refund.method, refundReference: code, status: 'Completada', shippingRefunded: false };
    const refundedAmount = previousAmount + amount;
    const refundStatus = refundedAmount >= payment.total ? 'Reembolsada' : 'Reembolsada parcialmente';
    api.commit(current => ({ ...current, refunds: [refund, ...(current.refunds || [])], transactions: [transaction, ...current.transactions.map(item => item.id === payment.id ? { ...item, refundedAmount, refundIds: [...(item.refundIds || []), id] } : item)], returns: current.returns.map(item => item.id === returnId ? { ...item, status: 'Reembolso emitido', step: 3, refundId: id, refundAmount: amount, refundReference: code, refundedAt: createdAt } : item), orders: current.orders.map(item => item.id === order.id ? { ...item, refundedAmount, refundStatus, refundIds: [...(item.refundIds || []), id] } : item) }));
    api.notify('Reembolso de simulación registrado con su comprobante. No se realiza una transferencia real.');
    return true;
  };

  return { requestReturn, reviewReturn, issueRefund };
}
