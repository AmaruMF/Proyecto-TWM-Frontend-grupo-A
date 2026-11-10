import { useState } from 'react';
import { Alert, Box, Button, Checkbox, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, Stack, TextField, Typography } from '@mui/material';
import useMarketplace from '../../hooks/useMarketplace';
import { currency, orderTotals, today } from '../../utils/commerce';
import { isAdult } from '../../utils/validation';
import { navigate } from '../../hooks/useNavigation';

export default function QuoteDialog({ service, onClose }) {
  const { session, data, requestQuote } = useMarketplace();
  const [date, setDate] = useState('');
  const [detail, setDetail] = useState('');
  const [serviceIds, setServiceIds] = useState(() => service ? [service.id] : []);
  const [error, setError] = useState('');
  const companyId = service?.companyId || service?.sellerId;
  const candidates = data.services.filter(item => !item.hidden && (item.companyId || item.sellerId) === companyId);
  const selected = candidates.filter(item => serviceIds.includes(item.id));
  const allowed = !session || selected.every(item => !item.adultOnly && !item.restrictionAge || isAdult(data.profile.birthday, today()));
  const total = orderTotals(selected.map(item => ({ ...item, quantity: 1 }))).total;
  const submit = async event => {
    event.preventDefault();
    if (!session) { onClose(); navigate('/acceso'); return; }
    if (!selected.length) { setError('Selecciona al menos un servicio del mismo vendedor.'); return; }
    if (!allowed) { setError('Debes tener 18 años cumplidos para solicitar los servicios seleccionados.'); return; }
    if (!date || date < today() || !detail.trim()) { setError('Elige una fecha válida y describe lo que necesitas.'); return; }
    if (await requestQuote(service, { date, detail: detail.trim(), serviceIds })) { onClose(); navigate('/cotizaciones'); }
  };
  return <Dialog open={Boolean(service)} onClose={onClose} fullWidth maxWidth="sm"><form onSubmit={submit}>
    <DialogTitle>Solicitar cotización</DialogTitle>
    <DialogContent><Stack spacing={3} sx={{ pt: 1 }}><Typography>{service?.name}</Typography><Typography variant="body2">Vendedor: {service?.seller}. Puedes incluir otros servicios de este mismo vendedor.</Typography>
      <Box><Typography sx={{ fontWeight: 800, mb: 1 }}>Servicios a cotizar</Typography><Stack spacing={0.5}>{candidates.map(item => <FormControlLabel key={item.id} control={<Checkbox checked={serviceIds.includes(item.id)} onChange={event => { setServiceIds(current => event.target.checked ? [...current, item.id] : current.filter(id => id !== item.id)); setError(''); }} />} label={<Box sx={{ minWidth: 0 }}><Typography variant="body2" sx={{ overflowWrap: 'anywhere' }}>{item.name}</Typography><Typography variant="caption">{currency(item.price)}{item.adultOnly || item.restrictionAge ? ' · Mayores de 18 años' : ''}</Typography></Box>} />)}</Stack></Box>
      <Typography variant="body2">Total de referencia vigente: {currency(total)}</Typography>{!allowed && <Alert severity="warning">Debes tener 18 años cumplidos para solicitar los servicios seleccionados.</Alert>}
      <TextField label="Fecha solicitada" type="date" value={date} onChange={event => setDate(event.target.value)} required slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: today() } }} /><TextField label="Cuéntanos qué necesitas" multiline minRows={4} value={detail} onChange={event => setDetail(event.target.value)} required slotProps={{ htmlInput: { maxLength: 1500 } }} /><Typography variant="caption">La cotización tendrá una vigencia de 15 días desde su emisión. El vendedor confirmará los valores y condiciones.</Typography>{error && <Alert severity="error">{error}</Alert>}</Stack></DialogContent>
    <DialogActions sx={{ px: 3, pb: 3 }}><Button onClick={onClose}>Cancelar</Button><Button type="submit" variant="contained" disabled={!allowed || !selected.length}>{session ? 'Solicitar cotización' : 'Iniciar sesión para cotizar'}</Button></DialogActions>
  </form></Dialog>;
}
