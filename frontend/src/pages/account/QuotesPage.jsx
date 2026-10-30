import { useState } from 'react';
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField, Typography } from '@mui/material';
import PagePanel from '../../components/common/PagePanel';
import SectionHeader from '../../components/common/SectionHeader';
import StatusProgress from '../../components/common/StatusProgress';
import useMarketplace from '../../hooks/useMarketplace';
import { currency, dateLabel } from '../../utils/commerce';
export default function QuotesPage({
  management = false
}) {
  const {
    data,
    setData,
    notify,
    openChat
  } = useMarketplace();
  const [target, setTarget] = useState(null);
  const [price, setPrice] = useState('');
  const [reply, setReply] = useState('');
  const submit = event => {
    event.preventDefault();
    setData(current => ({
      ...current,
      quotes: current.quotes.map(quote => quote.id === target.id ? {
        ...quote,
        price: Number(price),
        reply: reply.trim(),
        step: 1
      } : quote)
    }));
    setTarget(null);
    setPrice('');
    setReply('');
    notify('Cotización respondida.');
  };
  return <><SectionHeader title={management ? 'Cotizaciones de clientes' : 'Mis cotizaciones'} description={management ? 'Responde solicitudes y confirma las condiciones del servicio.' : 'Consulta tus solicitudes y revisa las respuestas de los profesionales.'} /><Stack spacing={2.5}>{data.quotes.map(quote => <PagePanel key={quote.id}><Typography component="h2" sx={{
          fontWeight: 800,
          fontSize: 18
        }}>Cotización #{quote.id} – {quote.serviceName}</Typography><Typography variant="body2" sx={{
          mt: 1
        }}>Cliente: {quote.customer}</Typography><Typography variant="body2" sx={{
          mt: 0.5
        }}>Para fecha: {dateLabel(quote.date)}</Typography><StatusProgress labels={['Solicitada', 'Respondida', 'Aceptada por el cliente', 'Expirada']} step={quote.step} /><Typography sx={{
          fontSize: 14,
          mb: 2
        }}>{quote.detail}</Typography>{quote.price > 0 && <Typography sx={{
          mb: 2,
          fontWeight: 900
        }}>Valor cotizado: {currency(quote.price)}</Typography>}{quote.reply && <Alert icon={false} sx={{
          mb: 2
        }}>{quote.reply}</Alert>}<Stack direction={{
          xs: 'column',
          sm: 'row'
        }} sx={{
          gap: 1
        }}>{management && quote.step === 0 && <Button variant="contained" onClick={() => setTarget(quote)}>Responder cotización</Button>}{!management && quote.step === 1 && <Button variant="contained" onClick={() => {
            setData(current => ({
              ...current,
              quotes: current.quotes.map(item => item.id === quote.id ? {
                ...item,
                step: 2
              } : item)
            }));
            notify('Cotización aceptada.');
          }}>Aceptar cotización</Button>}<Button variant="outlined" onClick={() => openChat(management ? quote.customer : quote.seller || 'Profesional', `Cotización #${quote.id}`)}>Ver mensajes</Button></Stack></PagePanel>)}</Stack>
    <Dialog open={Boolean(target)} onClose={() => setTarget(null)} fullWidth maxWidth="sm"><form onSubmit={submit}><DialogTitle>Responder cotización #{target?.id}</DialogTitle><DialogContent><Stack spacing={3} sx={{
            pt: 1
          }}><TextField label="Valor del servicio (CLP)" type="number" required value={price} onChange={event => setPrice(event.target.value)} slotProps={{
              htmlInput: {
                min: 1,
                step: 1
              }
            }} /><TextField label="Respuesta y condiciones" multiline minRows={4} required value={reply} onChange={event => setReply(event.target.value)} /></Stack></DialogContent><DialogActions sx={{
          px: 3,
          pb: 3
        }}><Button onClick={() => setTarget(null)}>Cancelar</Button><Button variant="contained" type="submit">Enviar respuesta</Button></DialogActions></form></Dialog>
  </>;
}
