import { useState } from 'react';
import { Alert, Box, Button, Chip, Divider, MenuItem, Paper, Stack, TextField, Typography } from '@mui/material';
import DesignIcon from '../../components/common/DesignIcon';
import PagePanel from '../../components/common/PagePanel';
import EmptyState from '../../components/common/EmptyState';
import CatalogGrid from '../../components/catalog/CatalogGrid';
import QuoteDialog from '../../components/catalog/QuoteDialog';
import ReviewPanel from '../../components/catalog/ReviewPanel';
import useMarketplace from '../../hooks/useMarketplace';
import { navigate } from '../../hooks/useNavigation';
import { currency, getVariants, today } from '../../utils/commerce';
import { isAdult } from '../../utils/validation';
import { recommendedProducts } from '../../utils/categories';
import { isFavorite } from '../../context/catalogActions';

function PublicQuestion({ question, canAnswer, onAnswer }) {
  const [answer, setAnswer] = useState('');
  return <Box sx={{ py: 2, borderTop: '1px solid', borderColor: 'divider' }}><Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{question.text}</Typography><Typography variant="body2" color="text.secondary" sx={{ ml: 2, mt: 1, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>↳ {question.answer || 'Esperando respuesta del vendedor.'}</Typography>{canAnswer && !question.answer && <Box component="form" onSubmit={async event => { event.preventDefault(); if (answer.trim() && await onAnswer(question.id, answer.trim())) setAnswer(''); }} sx={{ display: 'flex', gap: 1, mt: 2, flexDirection: { xs: 'column', sm: 'row' } }}><TextField label="Tu respuesta pública" value={answer} onChange={event => setAnswer(event.target.value)} required fullWidth multiline slotProps={{ htmlInput: { maxLength: 500 } }} /><Button type="submit" variant="contained">Responder</Button></Box>}</Box>;
}

const attributeLabels = { color: 'Color', size: 'Talla / Tamaño', talla: 'Talla', model: 'Modelo', modelo: 'Modelo', material: 'Material' };

export default function ProductDetailPage({ id, service = false }) {
  const { data, session, addToCart, toggleFavorite, openChat, startCheckout, askQuestion, answerQuestion } = useMarketplace();
  const product = (service ? data.services : data.products).find(item => item.id === id);
  const [quantity, setQuantity] = useState(1);
  const [variantId, setVariantId] = useState('');
  const [question, setQuestion] = useState('');
  const [quoteOpen, setQuoteOpen] = useState(false);
  if (!product || product.hidden) return <EmptyState title="Publicación no encontrada" actionLabel="Explorar catálogo" onAction={() => navigate('/productos')} />;
  const variants = service ? [] : getVariants(product);
  const variant = variants.find(item => item.id === variantId) || variants[0];
  const stock = variant?.stock ?? product.stock ?? 0;
  const selectedQuantity = Math.max(1, Math.min(quantity, Math.max(1, stock)));
  const currentPrice = variant?.price ?? product.price;
  const originalPrice = variant?.originalPrice ?? product.originalPrice;
  const attributeKeys = [...new Set(variants.flatMap(item => Object.keys(item.attributes || {})))].filter(key => new Set(variants.map(item => item.attributes?.[key] ?? '')).size > 1);
  const allowedAge = !product.adultOnly || !session || isAdult(data.profile.birthday, today());
  const ownsItem = session?.role === 'seller' && (service ? data.ownedServices : data.ownedProducts)?.some(item => item.id === id);
  const favorite = isFavorite(data.wishlists.find(list => list.id === 'favorites'), id, service ? 'service' : 'product');
  const askLogin = action => { if (!session) { navigate('/acceso'); return; } return action(); };
  const changeAttribute = (key, value) => {
    const candidates = variants.filter(item => String(item.attributes?.[key] ?? '') === value);
    const next = candidates.find(item => attributeKeys.every(other => other === key || item.attributes?.[other] === variant.attributes?.[other])) || candidates[0];
    if (next) { setVariantId(next.id); setQuantity(1); }
  };
  const buyNow = () => askLogin(() => startCheckout(product.seller, { productId: id, quantity: selectedQuantity, variantId: variant?.id, buyNow: true }));
  const submitQuestion = async event => {
    event.preventDefault();
    if (!question.trim()) return;
    const saved = await askLogin(() => askQuestion({ itemId: id, itemType: service ? 'service' : 'product', text: question.trim() }));
    if (saved) setQuestion('');
  };
  return <>
    <PagePanel sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 0.95fr) minmax(0, 1.5fr)' }, gap: { xs: 3, md: 5 } }}>
      <Box sx={{ bgcolor: 'background.paper', borderRadius: 1.5, overflow: 'hidden', display: 'grid', placeItems: 'center' }}>{product.image ? <Box component="img" src={variant?.image || product.detailImage || product.image} alt={product.name} sx={{ width: '100%', aspectRatio: '1 / 1', maxHeight: 380, objectFit: service ? 'cover' : 'contain' }} /> : <Typography sx={{ p: 5 }}>Sin imagen</Typography>}</Box>
      <Stack spacing={1.5} sx={{ alignItems: 'flex-start', justifyContent: 'center' }}><Chip label={product.brand || product.category} size="small" sx={{ bgcolor: 'background.paper' }} /><Typography component="h1" sx={{ fontSize: { xs: 25, md: 30 }, fontWeight: 800, maxWidth: 510 }}>{product.name}</Typography>
        {service ? <><Typography>{product.description}</Typography><Typography variant="body2">Profesional: {product.seller}</Typography><Typography variant="body2">Duración: {product.duration || (product.durationMinutes ? product.durationMinutes + ' minutos' : '')}</Typography><Typography sx={{ fontSize: 32, fontWeight: 900 }}>{currency(product.price || 0)}</Typography>{product.originalPrice > product.price && <Typography variant="body2" sx={{ textDecoration: 'line-through' }}>{currency(product.originalPrice)}</Typography>}{product.discount > 0 && <Chip label={product.discount + '% OFF'} size="small" sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', borderRadius: 0.5 }} />}{product.adultOnly && <Chip label="Para mayores de 18 años" size="small" />}<Button variant="contained" onClick={() => setQuoteOpen(true)} disabled={!allowedAge}>Solicitar cotización</Button></> : <>
          <Typography sx={{ fontSize: 32, fontWeight: 900 }}>{currency(currentPrice)}</Typography><Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}><Typography sx={{ textDecoration: 'line-through', fontSize: 13 }}>{originalPrice > currentPrice ? currency(originalPrice) : ''}</Typography>{product.discount > 0 && <Chip label={product.discount + '% OFF'} size="small" sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', borderRadius: 0.5 }} />}</Stack>
          <Typography variant="body2">Vendido por {product.seller} · {stock ? stock + ' disponibles' : 'Sin stock'}</Typography>
          {variants.length > 1 && attributeKeys.map(key => <TextField select key={key} label={attributeLabels[key] || key} value={String(variant.attributes?.[key] ?? '')} onChange={event => changeAttribute(key, event.target.value)} sx={{ minWidth: 210, maxWidth: '100%' }}>{[...new Set(variants.map(item => String(item.attributes?.[key] ?? '')))].map(value => <MenuItem key={value} value={value}>{value || 'Sin especificar'}</MenuItem>)}</TextField>)}
          {variants.length > 1 && !attributeKeys.length && <TextField select label="Variante" value={variant.id} onChange={event => { setVariantId(event.target.value); setQuantity(1); }} sx={{ minWidth: 210 }}>{variants.map(item => <MenuItem key={item.id} value={item.id}>{item.sku || item.id}</MenuItem>)}</TextField>}
          <TextField label="Cantidad" type="number" value={selectedQuantity} onChange={event => setQuantity(Number(event.target.value))} disabled={!stock} slotProps={{ htmlInput: { min: 1, max: stock, step: 1 } }} sx={{ minWidth: 210, mt: 1 }} />
          {product.adultOnly && <Chip label="Para mayores de 18 años" size="small" />}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1, width: '100%', pt: 1 }}><Button variant="outlined" startIcon={<DesignIcon name="favorite" />} onClick={() => askLogin(() => toggleFavorite(id))}>{favorite ? 'Quitar de Lista de deseos' : 'Agregar a Lista de deseos'}</Button><Button variant="outlined" startIcon={<DesignIcon name="message" />} onClick={() => askLogin(() => openChat(product.companyId || product.sellerId || product.seller, 'Consulta de producto #' + product.id))}>Consultar a vendedor</Button><Button variant="contained" color="secondary" startIcon={<DesignIcon name="cart" />} onClick={() => askLogin(() => addToCart(id, selectedQuantity, variant?.id))} disabled={!stock || !allowedAge || !Number.isInteger(selectedQuantity)}>Agregar al carrito</Button><Button variant="contained" color="primary" onClick={buyNow} disabled={!stock || !allowedAge || !Number.isInteger(selectedQuantity)}>Comprar ahora</Button></Box>
        </>}
        {service && <Button variant="outlined" startIcon={<DesignIcon name="favorite" />} onClick={() => askLogin(() => toggleFavorite(id, 'favorites', 'service'))}>{favorite ? 'Quitar de Lista de deseos' : 'Agregar a Lista de deseos'}</Button>}
        {!allowedAge && <Alert severity="warning">Debes tener 18 años cumplidos para adquirir {service ? 'este servicio' : 'este producto'}.</Alert>}
      </Stack>
    </PagePanel>
    <PagePanel sx={{ mt: 2 }}><Typography component="h2" variant="h3" sx={{ mb: 2 }}>{service ? 'Detalles del servicio' : 'Características del producto'}</Typography><Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>{(service ? [['Profesional', product.seller], ['Categoría', product.category], ['SKU', product.sku], ['Duración', product.duration || product.durationMinutes + ' minutos'], ['Restricción de edad', product.adultOnly ? 'Mayores de 18 años' : 'Sin restricción']] : [['Nombre', product.name], ['SKU', variant?.sku || product.sku], ['Peso', product.weight || 'Consultar al vendedor'], ['Categoría', product.category], ['Color', variant?.attributes?.color || product.color || 'Según publicación'], ['Tamaño', variant?.attributes?.size || variant?.attributes?.talla || product.size || 'Consultar al vendedor'], ['Material principal', variant?.attributes?.material || product.material || 'Consultar al vendedor'], ...(variant?.attributes?.model ? [['Modelo', variant.attributes.model]] : [])]).map(([label, value]) => <Typography key={label} sx={{ fontSize: 13 }}><strong>{label}:</strong> {value || 'Consultar al vendedor'}</Typography>)}</Box>{service && <Button sx={{ mt: 3 }} startIcon={<DesignIcon name="message" />} onClick={() => askLogin(() => openChat(product.companyId || product.sellerId || product.seller, 'Consulta de servicio #' + product.id))}>Consultar al profesional</Button>}</PagePanel>
    <ReviewPanel key={(service ? 'service-' : 'product-') + id} item={product} service={service} />
    <Paper elevation={0} sx={{ p: { xs: 3, md: 4 }, mt: 4, borderRadius: 2 }}><Typography component="h2" variant="h3">Preguntas y respuestas</Typography><Typography variant="body2" sx={{ mt: 1, mb: 2 }}>¿Tienes dudas? Pregúntale al vendedor directamente.</Typography>{!ownsItem && <Box component="form" onSubmit={submitQuestion} sx={{ display: 'flex', gap: 1, flexDirection: { xs: 'column', sm: 'row' } }}><TextField label="Escribe tu pregunta al vendedor" value={question} onChange={event => setQuestion(event.target.value)} required fullWidth slotProps={{ htmlInput: { maxLength: 500 } }} /><Button type="submit" variant="contained">Preguntar</Button></Box>}<Typography sx={{ fontSize: 11, color: 'text.secondary', my: 2 }}>{ownsItem ? 'Responde las consultas de tus clientes. Las respuestas son públicas.' : 'El vendedor responderá tu consulta aquí.'}</Typography><Divider /><Typography sx={{ my: 2, fontWeight: 800 }}>Últimas preguntas</Typography>{data.questions.filter(item => (item.itemId || item.productId) === id && (!item.itemType || item.itemType === (service ? 'service' : 'product'))).map(item => <PublicQuestion key={item.id} question={item} canAnswer={ownsItem} onAnswer={answerQuestion} />)}</Paper>
    {!service && recommendedProducts(product, data.products).length > 0 && <Box sx={{ mt: 5, maxWidth: 800, mx: 'auto' }}><Typography component="h2" variant="h3" align="center" sx={{ mb: 3 }}>Productos recomendados por el vendedor</Typography><CatalogGrid columns={3} items={recommendedProducts(product, data.products)} /></Box>}
    {quoteOpen && <QuoteDialog service={product} onClose={() => setQuoteOpen(false)} />}
  </>;
}
