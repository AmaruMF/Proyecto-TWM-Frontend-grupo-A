import { Divider, Stack, Typography } from '@mui/material';
import { currency, orderTotals } from '../../utils/commerce';
export default function OrderSummary({
  items,
  shipping
}) {
  const totals = orderTotals(items, shipping);
  return <Stack spacing={1}>
    {[['Valor sin IVA (Neto)', totals.net], ['IVA (19%)', totals.tax], ['Costo de envío', totals.shipping]].map(([label, value]) => <Stack key={label} direction="row" sx={{
      justifyContent: "space-between",
      gap: 2
    }}><Typography variant="body2" sx={{
        fontWeight: 700
      }}>{label}</Typography><Typography variant="body2" sx={{
        fontWeight: 800
      }}>{currency(value)}</Typography></Stack>)}
    <Divider sx={{
      my: '16px !important'
    }} /><Stack direction="row" sx={{
      justifyContent: "space-between"
    }}><Typography sx={{
        fontWeight: 900
      }}>Total a pagar</Typography><Typography sx={{
        fontWeight: 900
      }}>{currency(totals.total)}</Typography></Stack>
  </Stack>;
}
