import { useState } from 'react';
import { Alert, Box, Button, Divider, MenuItem, Paper, Rating, Stack, TextField, Typography } from '@mui/material';
import useMarketplace from '../../hooks/useMarketplace';
import { navigate } from '../../hooks/useNavigation';
import { dateLabel } from '../../utils/commerce';

export default function ReviewPanel({ item, service = false }) {
  const { data, session, canReview, submitReview } = useMarketplace();
  const [target, setTarget] = useState('item');
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const targetType = target === 'seller' ? 'seller' : service ? 'service' : 'product';
  const targetId = target === 'seller' ? item.companyId || item.sellerId : item.id;
  const reviews = (data.reviews || []).filter(review => review.targetType === targetType && review.targetId === targetId);
  const average = reviews.length ? reviews.reduce((sum, review) => sum + Number(review.rating), 0) / reviews.length : 0;
  const eligible = Boolean(session && targetId && canReview(targetType, targetId));
  const submit = async event => {
    event.preventDefault();
    if (!session) { navigate('/acceso'); return; }
    if (!eligible) { setError('Solo puedes publicar una reseña de una compra completada y verificada.'); return; }
    if (!Number.isInteger(rating) || rating < 1 || rating > 5 || !comment.trim() || comment.trim().length > 500) { setError('Selecciona una puntuación y escribe tu reseña.'); return; }
    if (await submitReview({ targetType, targetId, rating, comment: comment.trim() })) {
      setRating(0); setComment(''); setError('');
    }
  };
  return <Paper elevation={0} sx={{ p: { xs: 3, md: 4 }, mt: 4, borderRadius: 2 }}>
    <TextField select label="Calificaciones y reseñas" value={target} onChange={event => { setTarget(event.target.value); setRating(0); setComment(''); setError(''); }} sx={{ minWidth: { sm: 280 }, mb: 2 }} fullWidth>
      <MenuItem value="item">{service ? 'Del servicio' : 'Del producto'}</MenuItem><MenuItem value="seller">Del vendedor: {item.seller}</MenuItem>
    </TextField>
    <Stack direction="row" sx={{ alignItems: 'center', gap: 2 }}><Typography sx={{ fontSize: 48, fontWeight: 900 }}>{reviews.length ? average.toFixed(1) : '—'}</Typography><Box><Rating value={average} precision={0.1} readOnly size="large" sx={{ color: 'primary.main' }} /><Typography variant="body2">{reviews.length} {reviews.length === 1 ? 'reseña' : 'reseñas'}</Typography></Box></Stack>
    <Typography component="h2" variant="h3" sx={{ mt: 1 }}>Deja tu calificación aquí</Typography>
    {eligible ? <Box component="form" onSubmit={submit}><Rating aria-label="Tu calificación" value={rating} size="large" onChange={(_, value) => setRating(value || 0)} sx={{ color: 'primary.main', my: 1.5 }} /><TextField label="Tu reseña" value={comment} onChange={event => setComment(event.target.value)} required fullWidth multiline minRows={2} slotProps={{ htmlInput: { maxLength: 500 } }} /><Button variant="contained" type="submit" sx={{ my: 2 }}>Publicar reseña</Button>{error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}</Box> : <Typography variant="body2" sx={{ my: 2 }}>{session ? 'Puedes calificar después de recibir tu compra o finalizar el servicio. Se permite una reseña por destinatario.' : 'Inicia sesión para publicar una reseña de una compra verificada.'}</Typography>}
    {!session && <Button variant="outlined" onClick={() => navigate('/acceso')} sx={{ mb: 2 }}>Iniciar sesión</Button>}
    <Divider />
    {reviews.length ? reviews.map(review => <Box key={review.id} sx={{ py: 2, borderBottom: '1px solid', borderColor: 'divider' }}><Typography sx={{ fontWeight: 800, fontSize: 13 }}>{review.customerName || review.customer || 'Cliente'}{review.orderId ? ' · Compra verificada' : ''}</Typography><Rating value={review.rating} readOnly size="small" sx={{ color: 'primary.main', my: 0.5 }} /><Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{review.comment}</Typography>{review.createdAt && <Typography variant="caption" color="text.secondary">{dateLabel(review.createdAt.slice(0, 10))}</Typography>}</Box>) : <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>Todavía no hay reseñas para {target === 'seller' ? 'este vendedor' : service ? 'este servicio' : 'este producto'}.</Typography>}
  </Paper>;
}
