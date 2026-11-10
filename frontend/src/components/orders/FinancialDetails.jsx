import { Alert, Box, Divider, Stack, Typography } from '@mui/material';
import OrderSummary from '../checkout/OrderSummary';
import { currency, dateTimeLabel } from '../../utils/commerce';
import { transactionDetail } from '../../utils/financial';

export default function FinancialDetails({ transaction, orders = [] }) {
  const detail = transactionDetail(transaction, orders);
  const refund = detail.type === 'refund';
  return <Box sx={{ mt: 3 }}><Divider sx={{ mb: 2 }} />
    <Stack spacing={1}>
      {detail.orderId && <Typography variant="body2">Pedido: #{detail.orderId}</Typography>}
      <Typography variant="body2">Registro: {detail.createdAt ? dateTimeLabel(detail.createdAt) : detail.date || 'Fecha no registrada'}</Typography>
      <Typography variant="body2">Medio de pago: {detail.paymentMethod || 'No registrado'}</Typography>
      {detail.lastFour && <Typography variant="body2">Tarjeta terminada en {detail.lastFour}</Typography>}
      {detail.transferReference && <Typography variant="body2" sx={{ overflowWrap: 'anywhere' }}>Referencia de transferencia: {detail.transferReference}</Typography>}
      {detail.refundReference && <Typography variant="body2" sx={{ overflowWrap: 'anywhere' }}>Referencia de reembolso: {detail.refundReference}</Typography>}
      {detail.paymentId && refund && <Typography variant="body2">Pago de origen: #{detail.paymentId}</Typography>}
      {detail.returnId && <Typography variant="body2">Devolución: #{detail.returnId}</Typography>}
      {detail.items.map((item, index) => <Box key={item.id || `${item.productId || item.serviceId}-${item.variantId || index}`} sx={{ py: 1 }}><Typography variant="body2" sx={{ fontWeight: 800 }}>{item.name}{item.variantLabel ? ` · ${item.variantLabel}` : ''}</Typography><Typography variant="body2">{item.sku ? `SKU ${item.sku} · ` : ''}{item.quantity} × {currency(item.price)} = {currency(item.quantity * item.price)}</Typography></Box>)}
    </Stack>
    {detail.hasFinancialSnapshot ? <Box sx={{ mt: 2 }}><OrderSummary totals={detail} totalLabel={refund ? 'Total reembolsado' : 'Total registrado'} /></Box> : <Alert severity="info" sx={{ mt: 2 }}>Este registro histórico no incluye un desglose financiero completo.</Alert>}
    {detail.refundedAmount > 0 && <Typography variant="body2" sx={{ mt: 2 }}>Importe reembolsado: {currency(detail.refundedAmount)} · Saldo de la operación: {currency(detail.total - detail.refundedAmount)}</Typography>}
    {refund && <Typography variant="body2" sx={{ mt: 2 }}>Se reembolsan los artículos. El costo de envío no está incluido.</Typography>}
  </Box>;
}
