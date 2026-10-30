import { useState } from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField, Typography } from '@mui/material';
import useMarketplace from '../../hooks/useMarketplace';
import { today } from '../../utils/commerce';
import { navigate } from '../../hooks/useNavigation';

export default function QuoteDialog({ service, onClose }) {
  const { session, data, setData, notify } = useMarketplace();
  const [date, setDate] = useState('');
  const [detail, setDetail] = useState('');
  const submit = (event) => {
    event.preventDefault();
    if (!session) { onClose(); navigate('/acceso'); return; }
    setData((current) => ({ ...current, quotes: [{ id: Date.now().toString(), serviceId: service.id, serviceName: service.name, seller: service.seller, customer: `${data.profile.name} ${data.profile.lastName}`, date, detail: detail.trim(), step: 0 }, ...current.quotes] }));
    notify('Solicitud de cotización enviada.');
    onClose(); navigate('/cotizaciones');
  };
  return <Dialog open={Boolean(service)} onClose={onClose} fullWidth maxWidth="sm"><form onSubmit={submit}>
    <DialogTitle>Solicitar cotización</DialogTitle>
    <DialogContent><Stack spacing={3} sx={{ pt: 1 }}><Typography>{service?.name}</Typography><TextField label="Fecha solicitada" type="date" value={date} onChange={(event) => setDate(event.target.value)} required slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: today() } }} /><TextField label="Cuéntanos qué necesitas" multiline minRows={4} value={detail} onChange={(event) => setDetail(event.target.value)} required slotProps={{ htmlInput: { maxLength: 1500 } }} /></Stack></DialogContent>
    <DialogActions sx={{ px: 3, pb: 3 }}><Button onClick={onClose}>Cancelar</Button><Button type="submit" variant="contained">{session ? 'Solicitar cotización' : 'Iniciar sesión para cotizar'}</Button></DialogActions>
  </form></Dialog>;
}
