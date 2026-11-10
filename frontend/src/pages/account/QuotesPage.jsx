import { useState } from 'react';
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Divider, Stack, TextField, Typography } from '@mui/material';
import PagePanel from '../../components/common/PagePanel';
import SectionHeader from '../../components/common/SectionHeader';
import StatusProgress from '../../components/common/StatusProgress';
import EmptyState from '../../components/common/EmptyState';
import useMarketplace from '../../hooks/useMarketplace';
import { currency, dateLabel, dateTimeLabel, today } from '../../utils/commerce';
import { quoteIsAvailable, quoteStatusLabel } from '../../utils/quotes';

function QuoteLines({ quote }) {
  return <Stack spacing={1.5} sx={{ my: 2.5 }}>{quote.items.map(line => <Box key={line.id} sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}><Box sx={{ minWidth: 0 }}><Typography variant="body2" sx={{ overflowWrap: 'anywhere' }}>{line.name}{line.variantLabel ? ` · ${line.variantLabel}` : ''}</Typography><Typography variant="caption">SKU {line.sku || 'No registrado'} · {line.quantity} × {currency(line.price)}</Typography></Box><Typography variant="body2" sx={{ fontWeight: 800, whiteSpace: 'nowrap' }}>{currency(line.quantity * line.price)}</Typography></Box>)}</Stack>;
}

export default function QuotesPage({ management = false }) {
  const { data, replyQuote, acceptQuote, openChat } = useMarketplace();
  const [target, setTarget] = useState(null);
  const [prices, setPrices] = useState({});
  const [reply, setReply] = useState('');
  const [error, setError] = useState('');
  const quotes = management ? data.receivedQuotes : data.myQuotes;
  const openReply = quote => { setTarget(quote); setPrices(Object.fromEntries(quote.items.map(line => [line.id, String(line.price)]))); setReply(''); setError(''); };
  const submit = event => {
    event.preventDefault();
    const values = target.items.map(line => ({ id: line.id, price: Number(prices[line.id]) }));
    if (values.some(line => !Number.isSafeInteger(line.price) || line.price < 1) || !reply.trim()) { setError('Indica un precio unitario entero positivo para cada artículo y las condiciones de la cotización.'); return; }
    if (!replyQuote(target.id, values, reply)) return;
    setTarget(null); setPrices({}); setReply(''); setError('');
  };
  return <><SectionHeader title={management ? 'Cotizaciones de clientes' : 'Mis cotizaciones'} description={management ? 'Responde solicitudes de productos y servicios y confirma sus condiciones.' : 'Consulta tus solicitudes, sus valores y fechas de vigencia.'} /><Stack spacing={2.5}>
    {quotes.map(quote => <PagePanel key={quote.id}><Typography component="h2" sx={{ fontWeight: 800, fontSize: 18, overflowWrap: 'anywhere' }}>Cotización #{quote.id} – {quote.sourceType === 'service' ? 'Servicios' : 'Productos'}</Typography><Typography variant="body2" sx={{ mt: 1 }}>Cliente: {quote.customer}</Typography><Typography variant="body2" sx={{ mt: 0.5 }}>Vendedor: {quote.seller}</Typography>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 1.5 }}><Typography variant="body2">Emitida: {dateLabel(quote.emissionDate)}</Typography><Typography variant="body2">Vigente hasta: {dateLabel(quote.expiresAt)}</Typography></Stack>
      {quote.requestedDate && <Typography variant="body2" sx={{ mt: 1 }}>Fecha solicitada para los servicios: {dateLabel(quote.requestedDate)}</Typography>}
      <Typography variant="body2" sx={{ mt: 0.5 }}>Enviada: {dateTimeLabel(quote.sentAt)}{quote.sentAt ? ' (hora de Chile)' : ''}</Typography>
      <Typography variant="body2" sx={{ mt: 1 }}>Estado: {quoteStatusLabel(quote)}</Typography>
      <StatusProgress labels={quote.step === 3 ? quote.repliedAt ? ['Solicitada', 'Respondida', 'Expirada'] : ['Solicitada', 'Expirada'] : ['Solicitada', 'Respondida', 'Aceptada por el cliente']} step={quote.step === 3 ? quote.repliedAt ? 2 : 1 : quote.step} />
      <Typography sx={{ fontSize: 14, mb: 2, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{quote.detail}</Typography><QuoteLines quote={quote} /><Divider />
      <Stack spacing={0.5} sx={{ my: 2.5 }}>{[['Neto sin IVA', quote.net], ['IVA (19%)', quote.tax], ['Total cotizado', quote.total]].map(([label, value]) => <Stack direction="row" key={label} sx={{ justifyContent: 'space-between', gap: 2 }}><Typography variant="body2" sx={{ fontWeight: label === 'Total cotizado' ? 900 : 400 }}>{label}</Typography><Typography variant="body2" sx={{ fontWeight: label === 'Total cotizado' ? 900 : 400 }}>{currency(value)}</Typography></Stack>)}</Stack>
      {quote.reply && <Alert icon={false} sx={{ mb: 2, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{quote.reply}</Alert>}
      {quote.step === 3 && <Alert severity="warning" sx={{ mb: 2 }}>Esta cotización está expirada y no puede aceptarse. Sus precios se actualizan cada semana después de la vigencia inicial y se elimina después de 45 días desde la emisión. Puedes solicitar una nueva.</Alert>}
      {quote.step === 2 && <Typography variant="body2" sx={{ mb: 2, overflowWrap: 'anywhere' }}>Aceptada{quote.orderId ? ` · Pedido #${quote.orderId}` : ''}. El pedido conserva los valores registrados aunque la cotización se elimine.</Typography>}
      {quote.priceHistory?.length > 0 && <Box sx={{ mb: 2 }}><Typography sx={{ fontWeight: 800, mb: 1 }}>Actualizaciones de precios</Typography>{quote.priceHistory.map(change => <Typography variant="body2" key={change.at}>{dateLabel(change.at)} · {currency(change.previousTotal)} → {currency(change.total)}</Typography>)}</Box>}
      <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ gap: 1 }}>{management && quote.step === 0 && today() <= quote.expiresAt && <Button variant="contained" onClick={() => openReply(quote)}>Responder cotización</Button>}{!management && quoteIsAvailable(quote) && <Button variant="contained" onClick={() => acceptQuote(quote.id)}>Aceptar cotización e ir al pago</Button>}<Button variant="outlined" onClick={() => openChat(quote.companyId || quote.seller, `Cotización #${quote.id}`, quote.customer, quote.customerId)}>Ver mensajes</Button></Stack>
    </PagePanel>)}
    {!quotes.length && <EmptyState title={management ? 'No hay cotizaciones recibidas' : 'Aún no tienes cotizaciones'} description="Las solicitudes y sus respuestas aparecerán aquí." />}
  </Stack>
    <Dialog open={Boolean(target)} onClose={() => setTarget(null)} fullWidth maxWidth="sm"><form onSubmit={submit}><DialogTitle sx={{ overflowWrap: 'anywhere' }}>Responder cotización #{target?.id}</DialogTitle><DialogContent><Stack spacing={3} sx={{ pt: 1 }}>{target?.items.map((line, index) => <Box key={line.id}><Typography variant="body2" sx={{ mb: 1, overflowWrap: 'anywhere' }}>{line.name}{line.variantLabel ? ` · ${line.variantLabel}` : ''} · Cantidad: {line.quantity}</Typography><TextField label={`Precio unitario artículo ${index + 1} (CLP)`} type="number" required fullWidth value={prices[line.id] ?? ''} onChange={event => setPrices(current => ({ ...current, [line.id]: event.target.value }))} slotProps={{ htmlInput: { min: 1, step: 1 } }} /></Box>)}<TextField label="Respuesta y condiciones" multiline minRows={4} required value={reply} onChange={event => setReply(event.target.value)} slotProps={{ htmlInput: { maxLength: 1500 } }} />{error && <Alert severity="error">{error}</Alert>}</Stack></DialogContent><DialogActions sx={{ px: 3, pb: 3 }}><Button onClick={() => setTarget(null)}>Cancelar</Button><Button variant="contained" type="submit">Enviar respuesta</Button></DialogActions></form></Dialog>
  </>;
}
