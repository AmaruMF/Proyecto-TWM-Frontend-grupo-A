import { useState } from 'react';
import { Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Stack, Tab, Tabs, TextField, Typography } from '@mui/material';
import PagePanel from '../../components/common/PagePanel';
import SectionHeader from '../../components/common/SectionHeader';
import StatusProgress from '../../components/common/StatusProgress';
import EmptyState from '../../components/common/EmptyState';
import OrderCard from '../../components/orders/OrderCard';
import useMarketplace from '../../hooks/useMarketplace';
import { currency, dateLabel, today } from '../../utils/commerce';
export default function ReturnsPage() {
  const {
    data,
    setData,
    session,
    notify
  } = useMarketplace();
  const [tab, setTab] = useState(0);
  const [order, setOrder] = useState(null);
  const [reason, setReason] = useState('');
  const [detail, setDetail] = useState('');
  const submit = event => {
    event.preventDefault();
    setData(current => ({
      ...current,
      returns: [{
        id: Date.now().toString(),
        orderId: order.id,
        seller: order.seller,
        description: order.items.map(item => `${item.name} ×${item.quantity}`).join(', '),
        date: today(),
        total: order.total - order.shipping,
        step: 0,
        status: 'Solicitada',
        reason,
        detail: detail.trim()
      }, ...current.returns]
    }));
    setOrder(null);
    setTab(0);
    setReason('');
    setDetail('');
    notify('Solicitud de devolución registrada.');
  };
  const updateStatus = (id, status, step) => {
    setData(current => ({
      ...current,
      returns: current.returns.map(item => item.id === id ? {
        ...item,
        status,
        step
      } : item)
    }));
    notify(`Devolución: ${status.toLowerCase()}.`);
  };
  return <><SectionHeader title="Devoluciones y reembolsos" /><Tabs value={tab} onChange={(_, value) => setTab(value)} sx={{
      mb: 3
    }} variant="scrollable"><Tab label="Mis solicitudes" /><Tab label="Solicitar devolución" /></Tabs>
    {tab === 0 ? <Stack spacing={3}>{data.returns.map(item => <PagePanel key={item.id}><Stack direction={{
          xs: 'column',
          sm: 'row'
        }} sx={{
          justifyContent: "space-between",
          gap: 1
        }}><Typography component="h2" variant="h3">Devolución #{item.id} – {item.seller}</Typography><Typography sx={{
            fontWeight: 900
          }}>{currency(item.total)}</Typography></Stack><Typography sx={{
          mt: 1,
          fontSize: 14
        }}>{item.description} – {dateLabel(item.date)}</Typography><StatusProgress labels={item.status === 'Rechazada' ? ['Solicitada', 'En revisión', 'Rechazada'] : ['Solicitada', 'En revisión', 'Aprobada', 'Reembolso emitido']} step={item.step} /><Chip label={item.status} size="small" sx={{
          bgcolor: item.status === 'Rechazada' ? 'secondary.light' : 'background.paper',
          fontWeight: 700
        }} />{session.role === 'seller' && item.step < 2 && <Stack direction="row" sx={{
          mt: 2,
          gap: 1
        }}><Button variant="contained" onClick={() => updateStatus(item.id, 'Aprobada', 2)}>Aprobar</Button><Button variant="outlined" onClick={() => updateStatus(item.id, 'Rechazada', 2)}>Rechazar</Button></Stack>}{session.role === 'seller' && item.status === 'Aprobada' && <Button sx={{
          ml: 2
        }} variant="contained" onClick={() => updateStatus(item.id, 'Reembolso emitido', 3)}>Registrar reembolso de ejemplo</Button>}</PagePanel>)}{!data.returns.length && <EmptyState title="No tienes solicitudes de devolución" />}</Stack> : <Stack spacing={3}>{data.orders.filter(item => item.step === 3).map(item => <OrderCard key={item.id} order={item}><Box sx={{
          mt: 2
        }}><Button variant="outlined" disabled={data.returns.some(request => request.orderId === item.id)} onClick={() => setOrder(item)}>{data.returns.some(request => request.orderId === item.id) ? 'Ya existe una solicitud' : 'Solicitar devolución'}</Button></Box></OrderCard>)}{!data.orders.some(item => item.step === 3) && <EmptyState title="No hay pedidos entregados para devolver" />}</Stack>}
    <Dialog open={Boolean(order)} onClose={() => setOrder(null)} fullWidth maxWidth="sm"><form onSubmit={submit}><DialogTitle>Solicitar devolución del pedido #{order?.id}</DialogTitle><DialogContent><Stack spacing={3} sx={{
            pt: 1
          }}><TextField select label="Motivo" value={reason} onChange={event => setReason(event.target.value)} required>{['Producto defectuoso', 'Producto incorrecto', 'No corresponde a la descripción', 'Otro motivo'].map(value => <MenuItem value={value} key={value}>{value}</MenuItem>)}</TextField><TextField label="Describe lo ocurrido" multiline minRows={3} value={detail} onChange={event => setDetail(event.target.value)} required /></Stack></DialogContent><DialogActions sx={{
          px: 3,
          pb: 3
        }}><Button onClick={() => setOrder(null)}>Cancelar</Button><Button variant="contained" type="submit">Enviar solicitud</Button></DialogActions></form></Dialog>
  </>;
}
