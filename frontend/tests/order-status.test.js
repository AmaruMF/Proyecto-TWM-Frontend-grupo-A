import test from 'node:test';
import assert from 'node:assert/strict';
import { isServiceOrder, orderStatusLabels } from '../src/components/orders/orderStatus.js';

test('seguimiento de despacho y retiro representan entregas distintas en el mismo paso', () => {
  const delivery = { delivery: true, items: [{ productId: 'polera', variantId: 'roja-L' }] };
  const pickup = { ...delivery, delivery: false };
  assert.equal(orderStatusLabels(delivery)[2], 'Enviado');
  assert.equal(orderStatusLabels(delivery)[3], 'Entregado');
  assert.equal(orderStatusLabels(pickup)[2], 'Listo para retiro');
  assert.equal(orderStatusLabels(pickup)[3], 'Retirado en tienda');
  assert.equal(orderStatusLabels(pickup).includes('Enviado'), false);
});

test('un servicio tiene prestación y finalización, aunque conserve un indicador de despacho antiguo', () => {
  const order = { isService: true, delivery: true, items: [{ serviceId: 'jardineria' }] };
  assert.equal(isServiceOrder(order), true);
  assert.equal(orderStatusLabels(order)[2], 'En prestación');
  assert.equal(orderStatusLabels(order)[3], 'Finalizado');
});

test('pedidos antiguos de servicios se reconocen por sus líneas sin confundir pedidos mixtos', () => {
  assert.equal(isServiceOrder({ items: [{ serviceId: 'jardin' }, { serviceId: 'poda' }] }), true);
  assert.equal(isServiceOrder({ items: [{ serviceId: 'jardin' }, { productId: 'tijera' }] }), false);
  assert.equal(isServiceOrder({ items: [{ productId: 'polera' }] }), false);
});

test('un pedido sin líneas no se presenta como una prestación completada', () => {
  assert.equal(isServiceOrder({ items: [] }), false);
  assert.equal(isServiceOrder({}), false);
  assert.equal(orderStatusLabels({ delivery: true, items: [] })[3], 'Entregado');
});

test('la presentación de estados no altera el pedido ni comparte arrays modificables', () => {
  const order = Object.freeze({ delivery: false, items: Object.freeze([{ productId: 'polera' }]) });
  const labels = orderStatusLabels(order);
  labels[0] = 'Cambio ajeno';
  assert.equal(orderStatusLabels(order)[0], 'Recibido');
  assert.equal(order.delivery, false);
});
