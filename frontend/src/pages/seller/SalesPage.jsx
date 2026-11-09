import { useState } from 'react';
import { MenuItem, Stack, TextField, Typography } from '@mui/material';
import SectionHeader from '../../components/common/SectionHeader';
import EmptyState from '../../components/common/EmptyState';
import OrderCard from '../../components/orders/OrderCard';
import useMarketplace from '../../hooks/useMarketplace';
import { currency, dateTimeLabel } from '../../utils/commerce';

export default function SalesPage() {
  const { data } = useMarketplace();
  const [seller, setSeller] = useState('all');
  const sales = data.orders.filter(order => seller === 'all' || order.seller === seller).slice().sort((a, b) => b.date.localeCompare(a.date));
  return <>
    <SectionHeader title="Historial de ventas" description="Las ventas conservan los productos, cantidades y precios registrados al comprar, aunque la publicación se dé de baja." />
    <Stack spacing={2} sx={{ mb: 3 }}>
      <TextField select label="Vendedor" value={seller} onChange={event => setSeller(event.target.value)}><MenuItem value="all">Todos los vendedores de la demostración</MenuItem>{[...new Set(data.orders.map(order => order.seller))].map(name => <MenuItem key={name} value={name}>{name}</MenuItem>)}</TextField>
      <Typography sx={{ fontWeight: 800 }}>{sales.length} ventas · Total registrado: {currency(sales.reduce((total, order) => total + order.total, 0))}</Typography>
    </Stack>
    {sales.length ? <Stack spacing={2.5}>{sales.map(order => <OrderCard order={order} key={order.id} showAction={false}>
      <Typography variant="body2" sx={{ mt: 2 }}>Cliente: {order.customer || 'Cliente de ejemplo'}</Typography>
      {order.createdAt && <Typography variant="body2">Venta registrada: {dateTimeLabel(order.createdAt)}</Typography>}
      {order.items.map(item => <Typography variant="body2" key={item.productId}>{item.name} · {item.quantity} × {currency(item.price)} = {currency(item.quantity * item.price)}</Typography>)}
    </OrderCard>)}</Stack> : <EmptyState title="Aún no hay ventas registradas" />}
  </>;
}
