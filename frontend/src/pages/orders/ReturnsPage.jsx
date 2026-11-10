import { useState } from 'react';
import { Alert, Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Stack, Tab, Tabs, TextField, Typography } from '@mui/material';
import PagePanel from '../../components/common/PagePanel';
import SectionHeader from '../../components/common/SectionHeader';
import StatusProgress from '../../components/common/StatusProgress';
import EmptyState from '../../components/common/EmptyState';
import OrderCard from '../../components/orders/OrderCard';
import useMarketplace from '../../hooks/useMarketplace';
import { currency, dateLabel, dateTimeLabel } from '../../utils/commerce';
import { refundAvailability } from '../../context/returnActions';

export default function ReturnsPage() {
  const { data, session, requestReturn, reviewReturn, issueRefund } = useMarketplace();
  const [tab, setTab] = useState(0);
  const [order, setOrder] = useState(null);
  const [reason, setReason] = useState('');
  const [detail, setDetail] = useState('');
  const [refundTarget, setRefundTarget] = useState(null);
  const [reference, setReference] = useState('');
  const seller = session?.role === 'seller';
  const requests = (data.returns || []).filter(item => seller ? item.companyId === data.company?.id : item.customerId === session?.accountId);
  const completed = (data.orders || []).filter(item => item.step === 3 && item.customerId === session?.accountId);
  const financialState = { ...data, orders: [...(data.orders || []), ...(data.sales || [])], refunds: data.refunds || [] };
  const refund = refundTarget ? refundAvailability(financialState, refundTarget) : null;
  const submit = event => {
    event.preventDefault();
    if (!requestReturn(order.id, { reason, detail })) return;
    setOrder(null); setTab(0); setReason(''); setDetail('');
  };
  return <><SectionHeader title="Devoluciones y reembolsos" /><Tabs value={tab} onChange={(_, value) => setTab(value)} sx={{ mb: 3 }} variant="scrollable"><Tab label={seller ? 'Solicitudes recibidas' : 'Mis solicitudes'} />{!seller && <Tab label="Solicitar devolución" />}</Tabs>
    {tab === 0 || seller ? <Stack spacing={3}>{requests.map(item => {
      const receipt = (data.refunds || []).find(record => record.id === item.refundId || record.returnId === item.id);
      return <PagePanel key={item.id}><Stack direction={{ xs: 'column', sm: 'row' }} sx={{ justifyContent: 'space-between', gap: 1 }}><Typography component="h2" variant="h3" sx={{ overflowWrap: 'anywhere' }}>Devolución #{item.id} – {item.seller}</Typography><Typography sx={{ fontWeight: 900 }}>{currency(item.total || item.amount || 0)}</Typography></Stack><Typography sx={{ mt: 1, fontSize: 14 }}>{item.description} – {dateLabel(item.date)}</Typography>
        {item.orderId && <Typography variant="body2" sx={{ mt: 1, overflowWrap: 'anywhere' }}>Pedido: #{item.orderId}</Typography>}
        {item.reason && <Typography variant="body2" sx={{ mt: 1 }}>Motivo: {item.reason}</Typography>}{item.detail && <Typography variant="body2" sx={{ mt: 1, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{item.detail}</Typography>}
        <StatusProgress labels={item.status === 'Rechazada' ? ['Solicitada', 'En revisión', 'Rechazada'] : ['Solicitada', 'En revisión', 'Aprobada', 'Reembolso emitido']} step={item.step} /><Chip label={item.status} size="small" sx={{ bgcolor: item.status === 'Rechazada' ? 'secondary.light' : 'background.paper', fontWeight: 700 }} />
        {seller && item.step < 2 && <Stack direction="row" sx={{ mt: 2, gap: 1 }}><Button variant="contained" onClick={() => reviewReturn(item.id, 'Aprobada')}>Aprobar</Button><Button variant="outlined" onClick={() => reviewReturn(item.id, 'Rechazada')}>Rechazar</Button></Stack>}
        {seller && item.status === 'Aprobada' && <Button sx={{ ml: 2 }} variant="contained" onClick={() => { setRefundTarget(item); setReference(''); }}>Registrar reembolso de simulación</Button>}
        {receipt && <Box sx={{ mt: 3 }}><Typography component="h3" sx={{ fontWeight: 800 }}>Comprobante de reembolso</Typography><Typography variant="body2">Referencia: {receipt.reference}</Typography><Typography variant="body2">Emitido: {dateTimeLabel(receipt.createdAt)}</Typography><Typography variant="body2">Importe: {currency(receipt.amount)} · Neto {currency(receipt.net)} · IVA {currency(receipt.tax)}</Typography><Typography variant="body2" sx={{ overflowWrap: 'anywhere' }}>Pago de origen: #{receipt.paymentId}</Typography><Typography variant="body2">Medio: {receipt.method}</Typography><Typography variant="body2">El costo de envío no está incluido.</Typography></Box>}
        {item.status === 'Reembolso emitido' && !receipt && <Alert severity="info" sx={{ mt: 2 }}>Este registro histórico no incluye un comprobante financiero de reembolso.</Alert>}
      </PagePanel>;
    })}{!requests.length && <EmptyState title={seller ? 'No hay solicitudes de devolución recibidas' : 'No tienes solicitudes de devolución'} />}</Stack> : <Stack spacing={3}>{completed.map(item => <OrderCard key={item.id} order={item}><Box sx={{ mt: 2 }}><Button variant="outlined" disabled={requests.some(request => request.orderId === item.id)} onClick={() => setOrder(item)}>{requests.some(request => request.orderId === item.id) ? 'Ya existe una solicitud' : 'Solicitar devolución'}</Button></Box></OrderCard>)}{!completed.length && <EmptyState title="No hay pedidos entregados para devolver" />}</Stack>}
    <Dialog open={Boolean(order)} onClose={() => setOrder(null)} fullWidth maxWidth="sm"><form onSubmit={submit}><DialogTitle>Solicitar devolución del pedido #{order?.id}</DialogTitle><DialogContent><Stack spacing={3} sx={{ pt: 1 }}><Typography variant="body2">La solicitud comprende el importe de los artículos o servicios. El costo de envío no se reembolsa.</Typography><TextField select label="Motivo" value={reason} onChange={event => setReason(event.target.value)} required>{['Producto defectuoso', 'Producto incorrecto', 'No corresponde a la descripción', 'Problema con el servicio', 'Otro motivo'].map(value => <MenuItem value={value} key={value}>{value}</MenuItem>)}</TextField><TextField label="Describe lo ocurrido" multiline minRows={3} value={detail} onChange={event => setDetail(event.target.value)} required slotProps={{ htmlInput: { maxLength: 1500 } }} /></Stack></DialogContent><DialogActions sx={{ px: 3, pb: 3 }}><Button onClick={() => setOrder(null)}>Cancelar</Button><Button type="submit" variant="contained">Enviar solicitud</Button></DialogActions></form></Dialog>
    <Dialog open={Boolean(refundTarget)} onClose={() => setRefundTarget(null)} fullWidth maxWidth="sm"><form onSubmit={event => { event.preventDefault(); if (issueRefund(refundTarget.id, reference)) setRefundTarget(null); }}><DialogTitle>Registrar reembolso</DialogTitle><DialogContent><Stack spacing={3} sx={{ pt: 1 }}>{refund?.error ? <Alert severity="warning">{refund.error}</Alert> : <><Typography>Importe a reembolsar: {currency(refund?.amount || 0)}</Typography><Typography variant="body2">Se reembolsan los artículos mediante el medio de pago de origen. El envío queda excluido. Esta operación es una simulación y no mueve dinero real.</Typography><TextField label="Referencia de reembolso (opcional)" value={reference} onChange={event => setReference(event.target.value)} helperText="Si se deja vacía, se genera una referencia única." slotProps={{ htmlInput: { maxLength: 100 } }} /></>}</Stack></DialogContent><DialogActions sx={{ px: 3, pb: 3 }}><Button onClick={() => setRefundTarget(null)}>Cancelar</Button><Button type="submit" variant="contained" disabled={Boolean(refund?.error)}>Registrar reembolso</Button></DialogActions></form></Dialog>
  </>;
}
