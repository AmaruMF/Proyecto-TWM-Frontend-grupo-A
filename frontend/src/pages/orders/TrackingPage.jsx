import { Box, Button, Stack, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import OrderCard from '../../components/orders/OrderCard';
import PagePanel from '../../components/common/PagePanel';
import EmptyState from '../../components/common/EmptyState';
import useMarketplace from '../../hooks/useMarketplace';
import { navigate } from '../../hooks/useNavigation';
import { currency } from '../../utils/commerce';
export default function TrackingPage({
  id,
  postSale = false
}) {
  const {
    data,
    setData,
    openChat,
    notify
  } = useMarketplace();
  const order = data.orders.find(item => item.id === id);
  if (!order) return <EmptyState title="Pedido no encontrado" actionLabel="Ver mis pedidos" onAction={() => navigate('/pedidos')} />;
  const item = order.items[0];
  const buyAgain = () => {
    const product = data.products.find(entry => entry.id === item.productId);
    if (!product?.stock) {
      notify('Este producto no tiene stock disponible.', 'warning');
      return;
    }
    setData(current => ({
      ...current,
      cart: [...current.cart.filter(entry => entry.productId !== product.id), {
        productId: product.id,
        quantity: Math.min(item.quantity, product.stock)
      }]
    }));
    navigate('/carrito');
  };
  return <><Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/pedidos')} sx={{
      mb: 2
    }}>Volver a mis pedidos</Button><Typography component="h1" variant="h3" sx={{
      mb: 3
    }}>{postSale ? 'Detalle de compra y postventa' : 'Seguimiento de despacho'}</Typography>
    {postSale && <PagePanel sx={{
      mb: 2,
      display: 'grid',
      gridTemplateColumns: {
        xs: '1fr',
        sm: '220px minmax(0, 1fr)'
      },
      gap: 4
    }}><Box component="img" src={item.image} alt={item.name} sx={{
        width: '100%',
        maxHeight: 240,
        objectFit: 'contain',
        bgcolor: 'background.paper',
        borderRadius: 1
      }} /><Box><Typography component="h2" variant="h3">{item.name}</Typography><Typography sx={{
          fontSize: 26,
          fontWeight: 900,
          my: 2
        }}>{currency(item.price)}</Typography><Stack direction={{
          xs: 'column',
          sm: 'row'
        }} sx={{
          gap: 1
        }}><Button variant="contained" onClick={buyAgain}>Volver a comprar</Button><Button variant="outlined" onClick={() => openChat(order.seller, `Postventa pedido #${order.id}`)}>Habla con tu vendedor</Button></Stack></Box></PagePanel>}
    <OrderCard order={order} showAction={false} />
    <PagePanel sx={{
      mt: 2.5
    }}><Typography component="h2" variant="h3" sx={{
        mb: 3
      }}>Información {order.delivery ? 'del envío' : 'de retiro'}</Typography><Stack spacing={2}>{[[order.delivery ? 'Empresa de transporte' : 'Punto de retiro', order.delivery ? order.carrier : order.seller], ['N.º de seguimiento', order.tracking], [order.delivery ? 'Dirección de envío' : 'Dirección de retiro', order.address]].map(([label, value]) => <Stack key={label} direction={{
          xs: 'column',
          sm: 'row'
        }} sx={{
          justifyContent: "space-between",
          gap: 1
        }}><Typography sx={{
            fontWeight: 800
          }}>{label}</Typography><Typography sx={{
            textAlign: {
              sm: 'right'
            }
          }}>{value}</Typography></Stack>)}</Stack><Box sx={{
        mt: 3,
        p: 2,
        bgcolor: 'rgba(255,248,240,0.35)',
        borderRadius: 1
      }}><Typography sx={{
          fontSize: 13,
          fontWeight: 700
        }}>Último estado: {['Pedido recibido', 'En preparación', 'Enviado', order.delivery ? 'Entregado' : 'Retirado en tienda'][order.step]}</Typography></Box>{postSale && <Button sx={{
        mt: 3
      }} variant="outlined" onClick={() => navigate('/devoluciones')}>Solicitar devolución</Button>}</PagePanel>
  </>;
}
