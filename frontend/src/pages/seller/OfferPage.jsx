import { useState } from 'react';
import { Alert, Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Stack, TextField, Typography } from '@mui/material';
import SectionHeader from '../../components/common/SectionHeader';
import PagePanel from '../../components/common/PagePanel';
import useMarketplace from '../../hooks/useMarketplace';
import { currency, dateLabel, today, saveOffer } from '../../utils/commerce';
import { navigate } from '../../hooks/useNavigation';
export default function OfferPage() {
  const {
    data,
    setData,
    notify
  } = useMarketplace();
  const [editingId, setEditingId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [productId, setProductId] = useState('');
  const [discount, setDiscount] = useState('');
  const [start, setStart] = useState(today());
  const [end, setEnd] = useState('');
  const [error, setError] = useState('');
  const product = data.products.find(item => item.id === productId);
  const finalPrice = product ? Math.round((product.basePrice || product.price) * (1 - Number(discount) / 100)) : 0;
  const reset = () => { setEditingId(null); setProductId(''); setDiscount(''); setStart(today()); setEnd(''); setError(''); };
  const editOffer = offer => {
    setEditingId(offer.id); setProductId(offer.productId); setDiscount(String(offer.discount)); setStart(offer.start); setEnd(offer.end); setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const submit = event => {
    event.preventDefault();
    if (!product || product.hidden || !Number.isInteger(Number(discount)) || Number(discount) < 1 || Number(discount) > 99) { setError('Selecciona un producto activo y un descuento entero entre 1 y 99.'); return; }
    if (!start || !end || end < start) {
      setError('La fecha de término debe ser igual o posterior al inicio.');
      return;
    }
    setData(current => ({
      ...current,
      offers: saveOffer(current.offers, {
        id: editingId || crypto.randomUUID(),
        productId,
        discount: Number(discount),
        start,
        end,
        enabled: editingId ? current.offers.find(item => item.id === editingId)?.enabled ?? true : true
      })
    }));
    reset();
    notify('Oferta guardada. Se actualiza el producto existente sin duplicarlo.');
  };
  return <><SectionHeader title="Crear y gestionar ofertas" /><PagePanel component="form" onSubmit={submit} sx={{
      borderRadius: 3
    }}><Stack spacing={3}><Typography component="h2" variant="h3">Seleccionar artículo</Typography><TextField select label="Producto" disabled={Boolean(editingId)} value={productId} onChange={event => setProductId(event.target.value)} required>{data.products.filter(item => !item.hidden || item.id === productId).map(item => <MenuItem key={item.id} value={item.id}>{item.name}</MenuItem>)}</TextField>{product && <Typography variant="body2">Categoría: {product.category} · Precio base: {currency(product.basePrice || product.price)}</Typography>}<Typography component="h2" variant="h3">Detalles de la oferta</Typography><Box sx={{
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
              min: editingId ? undefined : today()
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
        }}><Button type="submit" variant="contained">{editingId ? "Guardar cambios" : "Publicar oferta"}</Button><Button variant="outlined" onClick={() => editingId ? reset() : navigate('/publicaciones')}>Cancelar</Button></Stack></Stack></PagePanel>
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
              }} /></Box><Stack direction={{ xs: "column", sm: "row" }} spacing={1}><Button variant="outlined" onClick={() => editOffer(offer)}>Editar oferta</Button><Button color="error" variant="outlined" onClick={() => setDeleteTarget(offer)}>Eliminar oferta</Button><Button variant="outlined" onClick={() => setData(current => ({
              ...current,
              offers: current.offers.map(item => item.id === offer.id ? {
                ...item,
                enabled: !item.enabled
              } : item)
            }))}>{offer.enabled ? 'Pausar oferta' : 'Activar oferta'}</Button></Stack></Stack></PagePanel>)}</Stack></>}
    <Dialog open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth><DialogTitle>¿Eliminar oferta?</DialogTitle><DialogContent>El producto seguirá publicado con su precio sin esta oferta. Las ventas anteriores se conservan.</DialogContent><DialogActions><Button onClick={() => setDeleteTarget(null)}>Cancelar</Button><Button color="error" onClick={() => { setData(current => ({ ...current, offers: current.offers.filter(item => item.id !== deleteTarget.id) })); if (editingId === deleteTarget.id) reset(); setDeleteTarget(null); notify('Oferta eliminada.'); }}>Eliminar oferta</Button></DialogActions></Dialog>
  </>;
}
