import { useState } from 'react';
import { Alert, Box, Button, MenuItem, Stack, TextField, Typography } from '@mui/material';
import SectionHeader from '../../components/common/SectionHeader';
import EmptyState from '../../components/common/EmptyState';
import OrderCard from '../../components/orders/OrderCard';
import { orderStatusLabels } from '../../components/orders/orderStatus';
import useMarketplace from '../../hooks/useMarketplace';
import { currency, dateTimeLabel } from '../../utils/commerce';

function SaleManagement({ order }) {
  const { updateOrder } = useMarketplace();
  const [carrier, setCarrier] = useState(order.carrier === 'Por asignar' ? '' : order.carrier || '');
  const [tracking, setTracking] = useState(order.tracking === 'Por asignar' ? '' : order.tracking || '');
  const [error, setError] = useState('');
  const labels = orderStatusLabels(order);
  const save = async (event, advance = false) => {
    event.preventDefault();
    if (advance && order.delivery && order.step + 1 >= 2 && (!carrier.trim() || !tracking.trim())) { setError('Registra la empresa de transporte y el número de seguimiento antes de enviar el pedido.'); return; }
    const changes = { ...(order.delivery ? { carrier: carrier.trim(), tracking: tracking.trim() } : {}), ...(advance ? { step: order.step + 1 } : {}) };
    if (await updateOrder(order.id, changes)) setError('');
  };
  return <Box component="form" onSubmit={event => save(event, order.step < 3)} sx={{ mt: 3 }}>
    {order.delivery && <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}><TextField label="Empresa de transporte" value={carrier} onChange={event => setCarrier(event.target.value)} fullWidth slotProps={{ input: { readOnly: order.step >= 2 }, htmlInput: { maxLength: 100 } }} helperText={order.step >= 2 ? 'La empresa de transporte queda fijada al enviar.' : undefined} /><TextField label="Número de seguimiento" value={tracking} onChange={event => setTracking(event.target.value)} fullWidth slotProps={{ htmlInput: { maxLength: 100 } }} /></Stack>}
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>{order.delivery && <Button variant="outlined" onClick={event => save(event)}>Guardar datos de envío</Button>}{order.step < 3 && <Button type="submit" variant="contained">Avanzar a {labels[order.step + 1]}</Button>}</Stack>
    {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
    {order.statusHistory?.length > 0 && <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>Última actualización: {dateTimeLabel(order.statusHistory.at(-1).createdAt || order.statusHistory.at(-1).at)}</Typography>}
  </Box>;
}

export default function SalesPage() {
  const { data } = useMarketplace();
  const [status, setStatus] = useState('all');
  const sales = (data.sales || []).filter(order => status === 'all' || String(order.step) === status).slice().sort((a, b) => b.date.localeCompare(a.date));
  return <>
    <SectionHeader title="Historial de ventas" description="Las ventas conservan los productos, cantidades y precios registrados al comprar, aunque la publicación se dé de baja." />
    <Stack spacing={2} sx={{ mb: 3 }}><TextField select label="Estado del pedido" value={status} onChange={event => setStatus(event.target.value)}><MenuItem value="all">Todos los estados</MenuItem><MenuItem value="0">Recibido</MenuItem><MenuItem value="1">En preparación</MenuItem><MenuItem value="2">Enviado / Listo para retiro / En prestación</MenuItem><MenuItem value="3">Entregado / Retirado / Finalizado</MenuItem></TextField><Typography sx={{ fontWeight: 800 }}>{sales.length} ventas · Total registrado: {currency(sales.reduce((total, order) => total + order.total, 0))}</Typography></Stack>
    {sales.length ? <Stack spacing={2.5}>{sales.map(order => <OrderCard order={order} key={order.id} showAction={false}><Typography variant="body2" sx={{ mt: 2 }}>Cliente: {order.customer || 'Cliente'}</Typography>{order.createdAt && <Typography variant="body2">Venta registrada: {dateTimeLabel(order.createdAt)}</Typography>}{order.items.map((item, index) => <Typography variant="body2" key={item.cartKey || item.variantId || item.productId || item.serviceId || index}>{item.name}{item.variantLabel ? ' · ' + item.variantLabel : ''}{item.sku ? ' · SKU ' + item.sku : ''} · {item.quantity} × {currency(item.price)} = {currency(item.quantity * item.price)}</Typography>)}<SaleManagement order={order} /></OrderCard>)}</Stack> : <EmptyState title="Aún no hay ventas registradas" />}
  </>;
}
