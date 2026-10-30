import { useState } from 'react';
import { Alert, Box, Button, Chip, MenuItem, Stack, TextField, Typography } from '@mui/material';
import SectionHeader from '../../components/common/SectionHeader';
import PagePanel from '../../components/common/PagePanel';
import useMarketplace from '../../hooks/useMarketplace';
import { currency, dateLabel, today } from '../../utils/commerce';
import { navigate } from '../../hooks/useNavigation';
export default function OfferPage() {
  const {
    data,
    setData,
    notify
  } = useMarketplace();
  const [productId, setProductId] = useState('');
  const [discount, setDiscount] = useState('');
  const [start, setStart] = useState(today());
  const [end, setEnd] = useState('');
  const [error, setError] = useState('');
  const product = data.products.find(item => item.id === productId);
  const finalPrice = product ? Math.round((product.basePrice || product.price) * (1 - Number(discount) / 100)) : 0;
  const submit = event => {
    event.preventDefault();
    if (end < start) {
      setError('La fecha de término debe ser igual o posterior al inicio.');
      return;
    }
    setData(current => ({
      ...current,
      offers: [{
        id: crypto.randomUUID(),
        productId,
        discount: Number(discount),
        start,
        end,
        enabled: true
      }, ...current.offers.filter(item => item.productId !== productId)]
    }));
    setProductId('');
    setDiscount('');
    setEnd('');
    setError('');
    notify('Oferta publicada. El descuento se aplicará durante las fechas indicadas.');
  };
  return <><SectionHeader title="Crear y gestionar ofertas" /><PagePanel component="form" onSubmit={submit} sx={{
      borderRadius: 3
    }}><Stack spacing={3}><Typography component="h2" variant="h3">Seleccionar artículo</Typography><TextField select label="Producto" value={productId} onChange={event => setProductId(event.target.value)} required>{data.products.map(item => <MenuItem key={item.id} value={item.id}>{item.name}</MenuItem>)}</TextField>{product && <Typography variant="body2">Categoría: {product.category} · Precio base: {currency(product.basePrice || product.price)}</Typography>}<Typography component="h2" variant="h3">Detalles de la oferta</Typography><Box sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: '1fr 1fr'
          },
          gap: 3
        }}><TextField label="Porcentaje de descuento (%)" type="number" value={discount} onChange={event => setDiscount(event.target.value)} required slotProps={{
            htmlInput: {
              min: 1,
              max: 99,
              step: 1
            }
          }} /><TextField label="Precio final calculado" value={product && discount ? currency(finalPrice) : ''} slotProps={{
            input: {
              readOnly: true
            }
          }} /><TextField type="date" label="Fecha de inicio" value={start} onChange={event => setStart(event.target.value)} required slotProps={{
            inputLabel: {
              shrink: true
            },
            htmlInput: {
              min: today()
            }
          }} /><TextField type="date" label="Fecha de término" value={end} onChange={event => setEnd(event.target.value)} required slotProps={{
            inputLabel: {
              shrink: true
            },
            htmlInput: {
              min: start
            }
          }} /></Box>{error && <Alert severity="error">{error}</Alert>}<Stack direction={{
          xs: 'column',
          sm: 'row'
        }} sx={{
          gap: 2
        }}><Button type="submit" variant="contained">Publicar oferta</Button><Button variant="outlined" onClick={() => navigate('/publicaciones')}>Cancelar</Button></Stack></Stack></PagePanel>
    {data.offers.length > 0 && <><Typography component="h2" variant="h3" sx={{
        mt: 5,
        mb: 3
      }}>Ofertas publicadas</Typography><Stack spacing={2}>{data.offers.map(offer => <PagePanel key={offer.id}><Stack direction={{
            xs: 'column',
            sm: 'row'
          }} sx={{
            gap: 2,
            justifyContent: "space-between"
          }}><Box><Typography sx={{
                fontWeight: 800
              }}>{data.products.find(item => item.id === offer.productId)?.name}</Typography><Typography variant="body2" sx={{
                mt: 1
              }}>{offer.discount}% de descuento · {dateLabel(offer.start)} al {dateLabel(offer.end)}</Typography><Chip size="small" label={!offer.enabled ? 'Pausada' : offer.end < today() ? 'Finalizada' : offer.start > today() ? 'Programada' : 'Activa'} sx={{
                mt: 1,
                bgcolor: 'background.paper'
              }} /></Box><Button variant="outlined" onClick={() => setData(current => ({
              ...current,
              offers: current.offers.map(item => item.id === offer.id ? {
                ...item,
                enabled: !item.enabled
              } : item)
            }))}>{offer.enabled ? 'Pausar oferta' : 'Activar oferta'}</Button></Stack></PagePanel>)}</Stack></>}
  </>;
}
