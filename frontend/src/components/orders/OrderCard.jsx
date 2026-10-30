import { Button, Stack, Typography } from '@mui/material';
import PagePanel from '../common/PagePanel';
import StatusProgress from '../common/StatusProgress';
import { currency, dateLabel } from '../../utils/commerce';
import { navigate } from '../../hooks/useNavigation';
export default function OrderCard({
  order,
  children,
  showAction = true
}) {
  return <PagePanel sx={{
    p: {
      xs: 2.5,
      md: 3.5
    }
  }}>
    <Stack direction={{
      xs: 'column',
      sm: 'row'
    }} sx={{
      justifyContent: "space-between",
      gap: 1
    }}><Typography component="h2" sx={{
        fontWeight: 800,
        fontSize: 18
      }}>Pedido #{order.id} – {order.seller}</Typography><Typography sx={{
        fontWeight: 900
      }}>{currency(order.total)}</Typography></Stack>
    <Typography sx={{
      fontWeight: 700,
      mt: 1,
      fontSize: 14
    }}>{order.items.map(item => `${item.name} ×${item.quantity}`).join(', ')} – {dateLabel(order.date)}</Typography>
    <StatusProgress step={order.step} />
    <Stack direction={{
      xs: 'column',
      sm: 'row'
    }} sx={{
      justifyContent: "flex-end",
      gap: 2,
      alignItems: {
        sm: 'center'
      }
    }}><Typography variant="body2" sx={{
        fontWeight: 700
      }}>{order.delivery ? 'Despacho a domicilio' : order.step === 3 ? 'Retirado en tienda' : 'Retiro en tienda'}</Typography>{showAction && <Button variant="contained" size="small" onClick={() => navigate(`/${order.step === 3 ? 'postventa' : 'seguimiento'}/${order.id}`)}>{order.step === 3 ? 'Ver detalle de compra' : 'Ver seguimiento de despacho'}</Button>}</Stack>
    {children}
  </PagePanel>;
}
