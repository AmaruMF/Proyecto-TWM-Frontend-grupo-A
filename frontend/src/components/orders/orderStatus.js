export function isServiceOrder(order) {
  const items = order.items || [];
  return Boolean(order.isService || (items.length > 0 && items.every(item => Boolean(item.serviceId))));
}

export function orderStatusLabels(order) {
  if (isServiceOrder(order)) return ['Recibido', 'En preparación', 'En prestación', 'Finalizado'];
  return order.delivery ? ['Recibido', 'En preparación', 'Enviado', 'Entregado'] : ['Recibido', 'En preparación', 'Listo para retiro', 'Retirado en tienda'];
}
