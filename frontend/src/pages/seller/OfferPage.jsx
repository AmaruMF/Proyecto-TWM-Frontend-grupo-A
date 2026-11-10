import { useState } from 'react';
import { Alert, Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Stack, TextField, Typography } from '@mui/material';
import SectionHeader from '../../components/common/SectionHeader';
import PagePanel from '../../components/common/PagePanel';
import useMarketplace from '../../hooks/useMarketplace';
import { currency, dateLabel, today } from '../../utils/commerce';
import { navigate } from '../../hooks/useNavigation';

export default function OfferPage() {
  const { data, setData, savePromotion, notify } = useMarketplace();
  const [editingId, setEditingId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [target, setTarget] = useState('');
  const [discount, setDiscount] = useState('');
  const [start, setStart] = useState(today());
  const [end, setEnd] = useState('');
  const [error, setError] = useState('');
  const options = [...(data.ownedProducts || []).map(item => ({ ...item, itemType: 'product' })), ...(data.ownedServices || []).map(item => ({ ...item, itemType: 'service' }))];
  const offers = data.ownedOffers || [];
  const item = options.find(option => `${option.itemType}::${option.id}` === target);
  const finalPrice = item ? Math.round((item.basePrice ?? item.price) * (1 - Number(discount) / 100)) : 0;
  const reset = () => { setEditingId(null); setTarget(''); setDiscount(''); setStart(today()); setEnd(''); setError(''); };
  const editOffer = offer => {
    setEditingId(offer.id);
    setTarget(`${offer.itemType || (offer.serviceId ? 'service' : 'product')}::${offer.serviceId || offer.productId}`);
    setDiscount(String(offer.discount)); setStart(offer.start); setEnd(offer.end); setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const submit = event => {
    event.preventDefault();
    if (!item || item.hidden || !Number.isInteger(Number(discount)) || Number(discount) < 1 || Number(discount) > 99) { setError('Selecciona una publicación activa y un descuento entero entre 1 y 99.'); return; }
    if (!start || !end || end < start) { setError('La fecha de término debe ser igual o posterior al inicio.'); return; }
    const offer = {
      id: editingId || crypto.randomUUID(), itemType: item.itemType,
      ...(item.itemType === 'service' ? { serviceId: item.id } : { productId: item.id }),
      discount: Number(discount), start, end,
      enabled: editingId ? offers.find(promotion => promotion.id === editingId)?.enabled ?? true : true,
    };
    if (!savePromotion(offer)) return;
    reset();
    notify('Oferta guardada. Se actualiza la publicación existente sin duplicarla.');
  };
  const offerName = offer => options.find(option => option.id === (offer.serviceId || offer.productId))?.name || 'Publicación no disponible';
  return <><SectionHeader title="Crear y gestionar ofertas" /><PagePanel component="form" onSubmit={submit} sx={{ borderRadius: 3 }}><Stack spacing={3}>
    <Typography component="h2" variant="h3">Seleccionar artículo</Typography>
    <TextField select label="Producto o servicio" disabled={Boolean(editingId)} value={target} onChange={event => setTarget(event.target.value)} required>{options.filter(option => !option.hidden || `${option.itemType}::${option.id}` === target).map(option => <MenuItem key={`${option.itemType}::${option.id}`} value={`${option.itemType}::${option.id}`}>{option.name} · {option.itemType === 'service' ? 'Servicio' : 'Producto'}</MenuItem>)}</TextField>
    {item && <Typography variant="body2">Categoría: {item.category} · Precio base: {currency(item.basePrice ?? item.price)}</Typography>}
    <Typography component="h2" variant="h3">Detalles de la oferta</Typography><Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 3 }}>
      <TextField label="Porcentaje de descuento (%)" type="number" value={discount} onChange={event => setDiscount(event.target.value)} required slotProps={{ htmlInput: { min: 1, max: 99, step: 1 } }} />
      <TextField label="Precio final calculado" value={item && discount ? currency(finalPrice) : ''} slotProps={{ input: { readOnly: true } }} />
      <TextField type="date" label="Fecha de inicio" value={start} onChange={event => setStart(event.target.value)} required slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: editingId ? undefined : today() } }} />
      <TextField type="date" label="Fecha de término" value={end} onChange={event => setEnd(event.target.value)} required slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: start } }} />
    </Box>{error && <Alert severity="error">{error}</Alert>}
    <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ gap: 2 }}><Button type="submit" variant="contained">{editingId ? 'Guardar cambios' : 'Publicar oferta'}</Button><Button variant="outlined" onClick={() => editingId ? reset() : navigate('/publicaciones')}>Cancelar</Button></Stack>
  </Stack></PagePanel>
    {offers.length > 0 && <><Typography component="h2" variant="h3" sx={{ mt: 5, mb: 3 }}>Ofertas publicadas</Typography><Stack spacing={2}>{offers.map(offer => <PagePanel key={offer.id}><Stack direction={{ xs: 'column', sm: 'row' }} sx={{ gap: 2, justifyContent: 'space-between' }}>
      <Box><Typography sx={{ fontWeight: 800 }}>{offerName(offer)}</Typography><Typography variant="body2" sx={{ mt: 1 }}>{offer.discount}% de descuento · {dateLabel(offer.start)} al {dateLabel(offer.end)}</Typography><Chip size="small" label={!offer.enabled ? 'Pausada' : offer.end < today() ? 'Finalizada' : offer.start > today() ? 'Programada' : 'Activa'} sx={{ mt: 1, bgcolor: 'background.paper' }} /></Box>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}><Button variant="outlined" onClick={() => editOffer(offer)}>Editar oferta</Button><Button color="error" variant="outlined" onClick={() => setDeleteTarget(offer)}>Eliminar oferta</Button><Button variant="outlined" onClick={() => setData(current => ({ ...current, offers: current.offers.map(promotion => promotion.id === offer.id ? { ...promotion, enabled: !promotion.enabled } : promotion) }))}>{offer.enabled ? 'Pausar oferta' : 'Activar oferta'}</Button></Stack>
    </Stack></PagePanel>)}</Stack></>}
    <Dialog open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth><DialogTitle>¿Eliminar oferta?</DialogTitle><DialogContent>La publicación seguirá disponible con su precio sin esta oferta. Las ventas anteriores se conservan.</DialogContent><DialogActions><Button onClick={() => setDeleteTarget(null)}>Cancelar</Button><Button color="error" onClick={() => { setData(current => ({ ...current, offers: current.offers.filter(offer => offer.id !== deleteTarget.id) })); if (editingId === deleteTarget.id) reset(); setDeleteTarget(null); notify('Oferta eliminada.'); }}>Eliminar oferta</Button></DialogActions></Dialog>
  </>;
}
