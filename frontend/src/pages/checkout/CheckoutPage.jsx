import { Box, Button, Stack, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import SectionHeader from '../../components/common/SectionHeader';
import PagePanel from '../../components/common/PagePanel';
import EmptyState from '../../components/common/EmptyState';
import AddressFields from '../../components/forms/AddressFields';
import OrderSummary from '../../components/checkout/OrderSummary';
import useMarketplace from '../../hooks/useMarketplace';
import { navigate } from '../../hooks/useNavigation';
import { cartItems, currency } from '../../utils/commerce';
export default function CheckoutPage() {
  const {
    data,
    checkout,
    setCheckout
  } = useMarketplace();
  const items = cartItems(data.cart, data.products).filter(item => item.seller === checkout.seller);
  const shipping = checkout.delivery ? checkout.commune.toLowerCase() === 'osorno' ? 4990 : checkout.region === 'Los Lagos' ? 5990 : 7990 : 0;
  if (!items.length) return <EmptyState title="Selecciona tu compra" description="Elige los productos y el vendedor en tu carrito." actionLabel="Ir al carrito" onAction={() => navigate('/carrito')} />;
  const submit = event => {
    event.preventDefault();
    setCheckout(current => ({
      ...current,
      shipping
    }));
    navigate('/pago');
  };
  return <Box sx={{
    maxWidth: 780,
    mx: 'auto'
  }}><SectionHeader title="Resumen del pedido" /><Box component="form" onSubmit={submit}><Stack spacing={3}>
    <PagePanel><Stack direction="row" sx={{
            justifyContent: "space-between",
            gap: 2
          }}><Typography sx={{
              fontWeight: 800
            }}>Vendedor</Typography><Typography sx={{
              fontWeight: 800
            }}>{checkout.seller}</Typography></Stack>{items.map(item => <Stack key={item.id} direction="row" sx={{
            my: 1.5,
            justifyContent: "space-between",
            gap: 2
          }}><Typography variant="body2">{item.name} ×{item.quantity}</Typography><Typography variant="body2" sx={{
              fontWeight: 800,
              whiteSpace: 'nowrap'
            }}>{currency(item.price * item.quantity)}</Typography></Stack>)}<Stack direction="row" sx={{
            justifyContent: "space-between"
          }}><Typography sx={{
              fontWeight: 800
            }}>Cliente</Typography><Typography>{data.profile.name} {data.profile.lastName}</Typography></Stack></PagePanel>
    <PagePanel><Typography component="h2" variant="h3" sx={{
            mb: 2
          }}>¿Requiere despacho?</Typography><ToggleButtonGroup value={checkout.delivery} exclusive onChange={(_, next) => next !== null && setCheckout(current => ({
            ...current,
            delivery: next
          }))} aria-label="Requiere despacho" size="small"><ToggleButton value={true}>Sí</ToggleButton><ToggleButton value={false}>No</ToggleButton></ToggleButtonGroup>
      {checkout.delivery ? <Box sx={{
            mt: 3
          }}><AddressFields value={checkout} onChange={address => setCheckout(address)} /><Typography sx={{
              mt: 3,
              fontWeight: 800
            }}>Costo de envío: {currency(shipping)}</Typography></Box> : <Typography sx={{
            mt: 3
          }}>Retiro coordinado con {checkout.seller}. Sin costo de envío.</Typography>}
    </PagePanel>
    <PagePanel><Typography component="h2" variant="h3" sx={{
            mb: 2
          }}>Medio de pago</Typography><ToggleButtonGroup value={checkout.method} exclusive onChange={(_, next) => next && setCheckout(current => ({
            ...current,
            method: next
          }))} aria-label="Medio de pago" size="small" sx={{
            flexWrap: 'wrap'
          }}>{['Tarjeta', 'Transferencia', 'Otro medio'].map(method => <ToggleButton key={method} value={method}>{method}</ToggleButton>)}</ToggleButtonGroup></PagePanel>
    <OrderSummary items={items} shipping={shipping} /><Stack direction={{
          xs: 'column-reverse',
          sm: 'row'
        }} sx={{
          gap: 2
        }}><Button variant="outlined" onClick={() => navigate('/carrito')}>Volver al carrito</Button><Button type="submit" variant="contained" size="large" fullWidth>Confirmar e ir al pago</Button></Stack>
  </Stack></Box></Box>;
}
