import { useState } from 'react';
import { Alert, Box, Button, Stack, TextField, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import SectionHeader from '../../components/common/SectionHeader';
import PagePanel from '../../components/common/PagePanel';
import EmptyState from '../../components/common/EmptyState';
import OrderSummary from '../../components/checkout/OrderSummary';
import useMarketplace from '../../hooks/useMarketplace';
import { navigate } from '../../hooks/useNavigation';
import { currency, orderTotals } from '../../utils/commerce';
import { shippingCost } from '../../utils/identity';
import { checkoutHasProducts, findCheckoutQuote, getCheckoutItems } from '../../utils/financial';
import { quoteIsAvailable } from '../../utils/quotes';

export default function PaymentPage() {
  const { data, checkout, setCheckout, purchase } = useMarketplace();
  const [lastFour, setLastFour] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [reference, setReference] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const items = getCheckoutItems(data, checkout);
  const shipping = shippingCost(data.companies.find(item => item.id === checkout.companyId), checkout, checkoutHasProducts(items) && checkout.delivery);
  const quote = findCheckoutQuote(data, checkout);
  const unavailableQuote = Boolean(checkout.quoteId && !quoteIsAvailable(quote));
  if (!items.length) return <EmptyState title="No hay un pedido por pagar" actionLabel="Ir al carrito" onAction={() => navigate('/carrito')} />;
  const total = orderTotals(items, shipping).total;
  const submit = (event) => { event.preventDefault(); if (submitting || unavailableQuote) return; setSubmitting(true); const success = purchase({ method: checkout.method, lastFour: checkout.method === 'Tarjeta' ? lastFour : '', reference: checkout.method === 'Transferencia' ? reference.trim() : '' }); setCvv(''); setExpiry(''); if (!success) setSubmitting(false); };
  return <Box sx={{ maxWidth: 940, mx: 'auto' }}><SectionHeader title="Medio de pago" /><Alert severity="info" sx={{ mb: 3 }}>Pago de demostración: usa datos ficticios. No se realizará ningún cobro.</Alert>{unavailableQuote && <Alert severity="warning" sx={{ mb: 3 }}>La cotización ha expirado o ya no está disponible para pagar.</Alert>}<Box component="form" onSubmit={submit}><Stack spacing={3}>
    <PagePanel><ToggleButtonGroup value={checkout.method} exclusive onChange={(_, next) => next && setCheckout((current) => ({ ...current, method: next }))} aria-label="Medio de pago" size="small" sx={{ mb: 3, flexWrap: 'wrap' }}>{['Tarjeta', 'Transferencia', 'Otro medio'].map((method) => <ToggleButton key={method} value={method}>{method}</ToggleButton>)}</ToggleButtonGroup>
      {checkout.method === 'Tarjeta' ? <Stack spacing={3}><TextField label="Últimos 4 dígitos de tarjeta de ejemplo" placeholder="6802" value={lastFour} onChange={(event) => setLastFour(event.target.value.replace(/\D/g, '').slice(0, 4))} required slotProps={{ htmlInput: { inputMode: 'numeric', pattern: '[0-9]{4}', maxLength: 4 } }} /><Stack direction={{ xs: 'column', sm: 'row' }} spacing={3}><TextField label="Vencimiento de ejemplo (MM/AA)" placeholder="06/29" value={expiry} onChange={(event) => setExpiry(event.target.value)} required fullWidth slotProps={{ htmlInput: { pattern: '(0[1-9]|1[0-2])/[0-9]{2}', maxLength: 5 } }} /><TextField label="CVV de ejemplo" type="password" value={cvv} onChange={(event) => setCvv(event.target.value.replace(/\D/g, '').slice(0, 4))} required fullWidth slotProps={{ htmlInput: { inputMode: 'numeric', pattern: '[0-9]{3,4}', maxLength: 4 } }} /></Stack><Typography variant="body2">Solo se guardan los últimos cuatro dígitos. El CVV no se guarda.</Typography></Stack> : checkout.method === 'Transferencia' ? <Stack spacing={2}><Typography>Ingresa una referencia ficticia para registrar esta transferencia de ejemplo.</Typography><TextField label="Referencia de transferencia de ejemplo" value={reference} onChange={(event) => setReference(event.target.value)} required /></Stack> : <Typography>Se registrará un pago de ejemplo por otro medio.</Typography>}
    </PagePanel>
    <PagePanel><Typography component="h2" variant="h3" sx={{ mb: 3 }}>Resumen de pago</Typography>{quote && <Typography variant="body2" sx={{ mb: 2 }}>Cotización #{quote.id}. Se aceptará al registrar este pago.</Typography>}<OrderSummary items={items} shipping={shipping} /></PagePanel>
    <Button type="submit" disabled={submitting || unavailableQuote} variant="contained" fullWidth size="large" sx={{ py: 1.75, fontSize: 20 }}>Simular pago de {currency(total)}</Button><Button onClick={() => navigate('/resumen')}>Volver al resumen</Button>
  </Stack></Box></Box>;
}
