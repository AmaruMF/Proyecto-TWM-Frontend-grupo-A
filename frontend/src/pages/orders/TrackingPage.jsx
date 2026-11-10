import { Box, Button, Stack, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import OrderCard from '../../components/orders/OrderCard';
import { isServiceOrder, orderStatusLabels } from '../../components/orders/orderStatus';
import PagePanel from '../../components/common/PagePanel';
import EmptyState from '../../components/common/EmptyState';
import useMarketplace from '../../hooks/useMarketplace';
import { navigate } from '../../hooks/useNavigation';
import { currency, dateTimeLabel, resolveVariant } from '../../utils/commerce';

export default function TrackingPage({ id, postSale = false }) {
  const { data, addToCart, openChat, notify } = useMarketplace();
  const order = data.orders.find(item => item.id === id);
  if (!order) return <EmptyState title="Pedido no encontrado" actionLabel="Ver mis pedidos" onAction={() => navigate('/pedidos')} />;
  const item = order.items[0];
  const isService = isServiceOrder(order);
  const buyAgain = () => {
    if (isService) { navigate('/servicio/' + item.serviceId); return; }
    const product = data.products.find(entry => entry.id === item.productId);
    const variant = product && resolveVariant(product, item.variantId);
    if (!product || product.hidden) { notify('Este producto está dado de baja.', 'warning'); return; }
    if (!variant) { notify('Selecciona una variante para volver a comprar este producto.', 'info'); navigate('/producto/' + product.id); return; }
    if (!variant.stock) { notify('Esta variante no tiene stock disponible.', 'warning'); return; }
    if (addToCart(product.id, Math.min(item.quantity, variant.stock), variant.id) !== false) navigate('/carrito');
  };
  const information = isService ? [['Profesional', order.seller]] : order.delivery ? [['Empresa de transporte', order.carrier || 'Por asignar'], ['N.º de seguimiento', order.tracking || 'Por asignar'], ['Dirección de envío', order.address]] : [['Punto de retiro', order.seller], ['Dirección de retiro', order.address]];
  return <><Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/pedidos')} sx={{ mb: 2 }}>Volver a mis pedidos</Button><Typography component="h1" variant="h3" sx={{ mb: 3 }}>{postSale ? 'Detalle de compra y postventa' : isService ? 'Seguimiento del servicio' : order.delivery ? 'Seguimiento de despacho' : 'Seguimiento del retiro'}</Typography>
    {postSale && <PagePanel sx={{ mb: 2, display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '220px minmax(0, 1fr)' }, gap: 4 }}>{item.image ? <Box component="img" src={item.image} alt={item.name} sx={{ width: '100%', maxHeight: 240, objectFit: 'contain', bgcolor: 'background.paper', borderRadius: 1 }} /> : <Box sx={{ minHeight: 90, display: 'grid', placeItems: 'center', bgcolor: 'background.paper', borderRadius: 1 }}><Typography variant="body2">Sin imagen</Typography></Box>}<Box><Typography component="h2" variant="h3">{item.name}</Typography>{(item.variantLabel || item.sku) && <Typography variant="body2" sx={{ mt: 1 }}>{item.variantLabel}{item.sku ? ' · SKU ' + item.sku : ''}</Typography>}<Typography sx={{ fontSize: 26, fontWeight: 900, my: 2 }}>{currency(item.price)}</Typography><Stack direction={{ xs: 'column', sm: 'row' }} sx={{ gap: 1 }}><Button variant="contained" onClick={buyAgain}>{isService ? 'Volver a contratar' : 'Volver a comprar'}</Button><Button variant="outlined" onClick={() => openChat(order.companyId || order.sellerId || order.seller, 'Postventa pedido #' + order.id)}>Habla con tu vendedor</Button></Stack></Box></PagePanel>}
    <OrderCard order={order} showAction={false} />
    <PagePanel sx={{ mt: 2.5 }}><Typography component="h2" variant="h3" sx={{ mb: 3 }}>Información {isService ? 'del servicio' : order.delivery ? 'del envío' : 'de retiro'}</Typography><Stack spacing={2}>{information.map(([label, value]) => <Stack key={label} direction={{ xs: 'column', sm: 'row' }} sx={{ justifyContent: 'space-between', gap: 1 }}><Typography sx={{ fontWeight: 800 }}>{label}</Typography><Typography sx={{ textAlign: { sm: 'right' } }}>{value || 'Por coordinar'}</Typography></Stack>)}</Stack><Box sx={{ mt: 3, p: 2, bgcolor: 'rgba(255,248,240,0.35)', borderRadius: 1 }}><Typography sx={{ fontSize: 13, fontWeight: 700 }}>Último estado: {orderStatusLabels(order)[order.step]}</Typography></Box>{order.statusHistory?.length > 0 && <Stack spacing={1} sx={{ mt: 2 }}>{order.statusHistory.map((entry, index) => <Typography key={entry.id || index} variant="body2" color="text.secondary">{orderStatusLabels(order)[entry.step]} · {dateTimeLabel(entry.createdAt || entry.at)}</Typography>)}</Stack>}{postSale && !isService && <Button sx={{ mt: 3 }} variant="outlined" onClick={() => navigate('/devoluciones')}>Solicitar devolución</Button>}</PagePanel>
  </>;
}
