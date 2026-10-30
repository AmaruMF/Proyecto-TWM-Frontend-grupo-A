import { useState } from 'react';
import { Alert, Box, Button, Divider, IconButton, MenuItem, Radio, FormControlLabel, Stack, TextField, Typography } from '@mui/material';
import DesignIcon from '../../components/common/DesignIcon';
import SectionHeader from '../../components/common/SectionHeader';
import PagePanel from '../../components/common/PagePanel';
import EmptyState from '../../components/common/EmptyState';
import useMarketplace from '../../hooks/useMarketplace';
import { navigate } from '../../hooks/useNavigation';
import { cartItems, currency, orderTotals } from '../../utils/commerce';
export default function CartPage() {
  const {
    data,
    updateQuantity,
    removeFromCart,
    startCheckout,
    checkout
  } = useMarketplace();
  const items = cartItems(data.cart, data.products);
  const sellers = [...new Set(items.map(item => item.seller))];
  const [chosen, setChosen] = useState(checkout.seller);
  const selected = sellers.includes(chosen) ? chosen : sellers[0];
  const purchaseItems = items.filter(item => item.seller === selected);
  if (!items.length) return <EmptyState title="Tu carrito está vacío" description="Encuentra tu próxima compra en nuestro catálogo." actionLabel="Explorar productos" onAction={() => navigate('/productos')} icon="cart" />;
  return <><SectionHeader title={`Tu carrito (${items.length} productos)`} />
    <Stack spacing={2.5}>{sellers.map(seller => <Box key={seller}><FormControlLabel control={<Radio checked={seller === selected} onChange={() => setChosen(seller)} name="seller" />} label={<Typography sx={{
          fontWeight: 800
        }}>Comprar a {seller}</Typography>} />
      <Stack spacing={2}>{items.filter(item => item.seller === seller).map(item => <PagePanel key={item.id} sx={{
            p: 2,
            display: 'grid',
            gridTemplateColumns: {
              xs: '80px minmax(0, 1fr)',
              sm: '120px minmax(0, 1fr) auto auto auto'
            },
            alignItems: 'start',
            gap: 2
          }}>
        <Box component="img" src={item.detailImage || item.image} alt={item.name} sx={{
              width: '100%',
              height: {
                xs: 90,
                sm: 120
              },
              objectFit: 'contain',
              bgcolor: 'background.paper',
              borderRadius: 1
            }} />
        <Box><Button onClick={() => navigate(`/producto/${item.id}`)} sx={{
                fontWeight: 800,
                p: 0,
                minHeight: 0,
                textAlign: 'left',
                justifyContent: 'flex-start'
              }}>{item.name}</Button><Typography variant="body2" sx={{
                mt: 1
              }}>Vendedor: {item.seller} · Stock: {item.stock}</Typography>{item.quantity > item.stock && <Typography variant="body2" sx={{
                mt: 1,
                fontWeight: 800
              }}>Ajusta la cantidad al stock disponible.</Typography>}</Box>
        <TextField select label="Cantidad" value={item.quantity} onChange={event => updateQuantity(item.id, Number(event.target.value))} sx={{
              width: 96
            }} disabled={!item.stock}>{Array.from({
                length: Math.max(item.quantity, Math.min(item.stock, 20))
              }, (_, index) => index + 1).map(value => <MenuItem key={value} value={value} disabled={value > item.stock}>{value}</MenuItem>)}</TextField>
        <Typography sx={{
              fontWeight: 900,
              py: 1,
              whiteSpace: 'nowrap'
            }}>{currency(item.price * item.quantity)}</Typography>
        <IconButton aria-label={`Eliminar ${item.name} del carrito`} onClick={() => removeFromCart(item.id)}><DesignIcon name="delete" /></IconButton>
      </PagePanel>)}</Stack>
    </Box>)}</Stack>
    {sellers.length > 1 && <Alert severity="info" sx={{
      mt: 3
    }}>Solo puedes comprar productos de un mismo vendedor por compra. Selecciona el vendedor; los demás productos permanecerán en tu carrito.</Alert>}
    <Divider sx={{
      my: 3
    }} /><Stack direction="row" sx={{
      justifyContent: "space-between"
    }}><Typography sx={{
        fontWeight: 800
      }}>Subtotal · {selected}</Typography><Typography sx={{
        fontWeight: 900
      }}>{currency(orderTotals(purchaseItems).subtotal)}</Typography></Stack><Typography variant="body2" color="text.secondary" sx={{
      mt: 1
    }}>El costo de envío se calculará en el siguiente paso.</Typography>
    <Button fullWidth variant="contained" size="large" onClick={() => startCheckout(selected)} sx={{
      mt: 3,
      py: 1.75,
      fontSize: 20
    }}>Continuar compra</Button>
  </>;
}
