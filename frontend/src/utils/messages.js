// Los registros antiguos solo distinguían mensajes recibidos y enviados.
export const messageRole = (message) => message.senderRole || (message.incoming ? 'seller' : null);
export const roleLabel = (role) => role === 'seller' ? 'Vendedor' : 'Cliente';
export const participantName = (thread, role) => role === 'seller' ? thread.seller : thread.customer || 'Cliente';
export const recipientName = (thread, role) => participantName(thread, role === 'seller' ? 'client' : 'seller');
export const isOwnMessage = (message, role) => messageRole(message) === role;
export const isSystemMessage = (message) => Boolean(message.system || (!message.senderRole && message.incoming));

export function sentMessages(threads, role) {
  return threads.flatMap(thread => thread.messages.filter(message => isOwnMessage(message, role) && !isSystemMessage(message)).map(message => ({ ...message, thread })))
    .sort((a, b) => (b.sentAt || '').localeCompare(a.sentAt || ''));
}

export function legacyMessages(threads) {
  // Antes de guardar el rol no es posible saber si respondió el cliente o el vendedor.
  return threads.flatMap(thread => thread.messages.filter(message => !messageRole(message)).map(message => ({ ...message, thread, legacy: true })));
}

export function findConversation(threads, seller, context, customer) {
  return threads.find(thread => thread.seller === seller && thread.context === context && (!customer || !thread.customer || thread.customer === customer));
}
