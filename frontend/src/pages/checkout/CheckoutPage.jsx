import { Alert, Box, Button, MenuItem, Stack, TextField, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import SectionHeader from '../../components/common/SectionHeader';
import PagePanel from '../../components/common/PagePanel';
import EmptyState from '../../components/common/EmptyState';
import AddressFields from '../../components/forms/AddressFields';
import OrderSummary from '../../components/checkout/OrderSummary';
import useMarketplace from '../../hooks/useMarketplace';
import { navigate } from '../../hooks/useNavigation';
import { currency } from '../../utils/commerce';
import { shippingCost } from '../../utils/identity';
import { checkoutHasProducts, findCheckoutQuote, getCheckoutItems } from '../../utils/financial';
import { quoteIsAvailable } from '../../utils/quotes';
export default function CheckoutPage() {
  const {
    data,
    checkout,
    setCheckout
  } = useMarketplace();
  const company = data.companies.find(item => item.id === checkout.companyId);
  const items = getCheckoutItems(data, checkout);
  const hasProducts = checkoutHasProducts(items);
  const quote = findCheckoutQuote(data, checkout);
  const unavailableQuote = Boolean(checkout.quoteId && !quoteIsAvailable(quote));
  const delivery = hasProducts && checkout.delivery;
  const shipping = shippingCost(company, checkout, delivery);
  if (!items.length) return <EmptyState title="Selecciona tu compra" description="Elige los productos y el vendedor en tu carrito." actionLabel="Ir al carrito" onAction={() => navigate('/carrito')} />;
  const submit = event => {
    event.preventDefault();
    if (unavailableQuote) return;
    setCheckout(current => ({
      ...current,
      shipping,
      delivery: Boolean(delivery)
    }));
    navigate('/pago');
  };
  return <Box sx={{
    maxWidth: 780,
    mx: 'auto'
  }}><SectionHeader title="Resumen del pedido" />{unavailableQuote && <Alert severity="warning" sx={{ mb: 3 }}>La cotización ha expirado o ya no está disponible. Solicita una nueva antes de continuar.</Alert>}<Box component="form" onSubmit={submit}><Stack spacing={3}>
    <PagePanel><Stack direction="row" sx={{
            justifyContent: "space-between",
            gap: 2
          }}><Typography sx={{
              fontWeight: 800
            }}>Vendedor</Typography><Typography sx={{
              fontWeight: 800
        }}>{company?.name || checkout.seller}</Typography></Stack>{items.map(item => <Stack key={item.cartKey} direction="row" sx={{
            my: 1.5,
            justifyContent: "space-between",
            gap: 2
          }}><Typography variant="body2">{item.name}{item.variantLabel ? ` · ${item.variantLabel}` : ''} ×{item.quantity}</Typography><Typography variant="body2" sx={{
              fontWeight: 800,
              whiteSpace: 'nowrap'
            }}>{currency(item.price * item.quantity)}</Typography></Stack>)}<Stack direction="row" sx={{
            justifyContent: "space-between"
          }}><Typography sx={{
              fontWeight: 800
          }}>Cliente</Typography><Typography>{data.profile.name} {data.profile.lastName}</Typography></Stack>{quote && <Typography variant="body2" sx={{ mt: 2 }}>Cotización #{quote.id} · Valores pactados en la respuesta del vendedor.</Typography>}</PagePanel>
    <PagePanel><Typography component="h2" variant="h3" sx={{
            mb: 2
          }}>{hasProducts ? '¿Requiere despacho?' : 'Prestación de servicios'}</Typography>{hasProducts && <ToggleButtonGroup value={checkout.delivery} exclusive onChange={(_, next) => next !== null && setCheckout(current => ({
            ...current,
            delivery: next
          }))} aria-label="Requiere despacho" size="small"><ToggleButton value={true}>Sí</ToggleButton><ToggleButton value={false}>No</ToggleButton></ToggleButtonGroup>}
      {delivery ? <Box sx={{
            mt: 3
          }}><TextField select label="Dirección guardada" fullWidth value={(data.profile.addresses || []).some(address => address.id === checkout.addressId) ? checkout.addressId : ''} onChange={event => { const address = data.profile.addresses.find(item => item.id === event.target.value); if (address) setCheckout(current => ({ ...current, ...address, addressId: address.id })); }} sx={{ mb: 3 }}>{(data.profile.addresses || []).map(address => <MenuItem value={address.id} key={address.id}>{address.label || 'Dirección'} · {address.street} {address.number}, {address.commune}</MenuItem>)}</TextField><AddressFields value={checkout} onChange={address => setCheckout(address)} /><TextField label="Departamento, referencia u otros detalles (opcional)" fullWidth value={checkout.details || ''} onChange={event => setCheckout(current => ({ ...current, details: event.target.value }))} sx={{ mt: 3 }} /><Typography sx={{
              mt: 3,
              fontWeight: 800
            }}>Costo de envío: {currency(shipping)}</Typography></Box> : <Typography sx={{
            mt: 3
          }}>{hasProducts ? `Retiro coordinado con ${checkout.seller}. Sin costo de envío.` : `Servicios coordinados con ${company?.name || checkout.seller}. Sin costo de envío.`}{!hasProducts && quote?.requestedDate ? ` Fecha solicitada: ${quote.requestedDate}.` : ''}</Typography>}
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
        }}><Button variant="outlined" onClick={() => navigate(quote ? '/cotizaciones' : '/carrito')}>{quote ? 'Volver a cotizaciones' : 'Volver al carrito'}</Button><Button type="submit" variant="contained" size="large" fullWidth disabled={unavailableQuote}>Confirmar e ir al pago</Button></Stack>
  </Stack></Box></Box>;
}
