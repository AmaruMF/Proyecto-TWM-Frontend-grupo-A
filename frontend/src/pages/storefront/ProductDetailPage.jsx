import { useState } from 'react';
import { Box, Button, Chip, Divider, MenuItem, Paper, Rating, Stack, TextField, Typography } from '@mui/material';
import DesignIcon from '../../components/common/DesignIcon';
import PagePanel from '../../components/common/PagePanel';
import EmptyState from '../../components/common/EmptyState';
import CatalogGrid from '../../components/catalog/CatalogGrid';
import QuoteDialog from '../../components/catalog/QuoteDialog';
import useMarketplace from '../../hooks/useMarketplace';
import { navigate } from '../../hooks/useNavigation';
import { currency } from '../../utils/commerce';
export default function ProductDetailPage({
  id,
  service = false
}) {
  const {
    data,
    setData,
    session,
    addToCart,
    toggleFavorite,
    openChat,
    notify,
    setCheckout
  } = useMarketplace();
  const product = (service ? data.services : data.products).find(item => item.id === id);
  const [quantity, setQuantity] = useState(1);
  const [question, setQuestion] = useState('');
  const [quoteOpen, setQuoteOpen] = useState(false);
  if (!product) return <EmptyState title="Publicación no encontrada" actionLabel="Explorar catálogo" onAction={() => navigate('/productos')} />;
  const askLogin = action => {
    if (!session) {
      navigate('/acceso');
      return;
    }
    action();
  };
  const favorite = data.wishlists[0].productIds.includes(id);
  const buyNow = () => askLogin(() => {
    setData(current => ({
      ...current,
      cart: [...current.cart.filter(item => item.productId !== id), {
        productId: id,
        quantity
      }]
    }));
    setCheckout(current => ({
      ...current,
      seller: product.seller
    }));
    navigate('/resumen');
  });
  const submitQuestion = event => {
    event.preventDefault();
    askLogin(() => {
      setData(current => ({
        ...current,
        questions: [{
          id: crypto.randomUUID(),
          productId: id,
          text: question.trim()
        }, ...current.questions]
      }));
      setQuestion('');
      notify('Tu pregunta quedó publicada.');
    });
  };
  return <>
    <PagePanel sx={{
      display: 'grid',
      gridTemplateColumns: {
        xs: '1fr',
        md: 'minmax(0, 0.95fr) minmax(0, 1.5fr)'
      },
      gap: {
        xs: 3,
        md: 5
      }
    }}>
      <Box sx={{
        bgcolor: 'background.paper',
        borderRadius: 1.5,
        overflow: 'hidden',
        display: 'grid',
        placeItems: 'center'
      }}>{product.image ? <Box component="img" src={product.detailImage || product.image} alt={product.name} sx={{
          width: '100%',
          aspectRatio: '1 / 1',
          maxHeight: 380,
          objectFit: service ? 'cover' : 'contain'
        }} /> : <Typography sx={{
          p: 5
        }}>Sin imagen</Typography>}</Box>
      <Stack spacing={1.5} sx={{
        alignItems: "flex-start",
        justifyContent: "center"
      }}><Chip label={product.brand || product.category} size="small" sx={{
          bgcolor: 'background.paper'
        }} /><Typography component="h1" sx={{
          fontSize: {
            xs: 25,
            md: 30
          },
          fontWeight: 800,
          maxWidth: 510
        }}>{product.name}</Typography>
        {service ? <><Typography>{product.description}</Typography><Typography variant="body2">Profesional: {product.seller}</Typography><Typography variant="body2">Duración: {product.duration}</Typography>{product.adultOnly && <Chip label="Para mayores de 18 años" size="small" />}<Button variant="contained" onClick={() => setQuoteOpen(true)}>Solicitar cotización</Button></> : <>
          <Typography sx={{
            fontSize: 32,
            fontWeight: 900
          }}>{currency(product.price)}</Typography><Stack direction="row" spacing={1.5} sx={{
            alignItems: "center"
          }}><Typography sx={{
              textDecoration: 'line-through',
              fontSize: 13
            }}>{product.originalPrice > product.price ? currency(product.originalPrice) : ''}</Typography>{product.discount > 0 && <Chip label={`${product.discount}% OFF`} size="small" sx={{
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              borderRadius: 0.5
            }} />}</Stack>
          <Typography variant="body2">Vendido por {product.seller} · {product.stock ? `${product.stock} disponibles` : 'Sin stock'}</Typography>
          <TextField select label="Cantidad" value={Math.min(quantity, Math.max(1, product.stock))} onChange={event => setQuantity(Number(event.target.value))} disabled={!product.stock} sx={{
            minWidth: 210,
            mt: 1
          }}><MenuItem value={1}>1 unidad</MenuItem>{Array.from({
              length: Math.max(0, Math.min(product.stock, 20) - 1)
            }, (_, index) => index + 2).map(value => <MenuItem key={value} value={value}>{value} unidades</MenuItem>)}</TextField>
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: '1fr 1fr'
            },
            gap: 1,
            width: '100%',
            pt: 1
          }}><Button variant="outlined" startIcon={<DesignIcon name="favorite" />} onClick={() => askLogin(() => toggleFavorite(id))}>{favorite ? 'Quitar de Lista de deseos' : 'Agregar a Lista de deseos'}</Button><Button variant="outlined" startIcon={<DesignIcon name="message" />} onClick={() => askLogin(() => openChat(product.seller))}>Consultar a vendedor</Button><Button variant="contained" color="secondary" startIcon={<DesignIcon name="cart" />} onClick={() => askLogin(() => addToCart(id, quantity))} disabled={!product.stock}>Agregar al carrito</Button><Button variant="contained" color="primary" onClick={buyNow} disabled={!product.stock}>Comprar ahora</Button></Box>
        </>}
      </Stack>
    </PagePanel>
    <PagePanel sx={{
      mt: 2
    }}><Typography component="h2" variant="h3" sx={{
        mb: 2
      }}>{service ? 'Detalles del servicio' : 'Características del producto'}</Typography><Box sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: '1fr',
          sm: '1fr 1fr'
        },
        gap: 2
      }}>{(service ? [['Profesional', product.seller], ['Categoría', product.category], ['Duración', product.duration]] : [['Nombre', product.name], ['Peso', product.weight || 'Consultar al vendedor'], ['Categoría', product.category], ['Color', product.color || 'Según publicación'], ['Tamaño', product.size || 'Consultar al vendedor'], ['Material principal', product.material || 'Consultar al vendedor']]).map(([label, value]) => <Typography key={label} sx={{
          fontSize: 13
        }}><strong>{label}:</strong> {value}</Typography>)}</Box>{service && <Button sx={{
        mt: 3
      }} startIcon={<DesignIcon name="message" />} onClick={() => askLogin(() => openChat(product.seller, 'Consulta de servicio'))}>Consultar al profesional</Button>}</PagePanel>
    {!service && <Paper elevation={0} sx={{
      p: {
        xs: 3,
        md: 4
      },
      mt: 4,
      borderRadius: 2
    }}><Stack direction="row" sx={{
        alignItems: "center",
        gap: 2
      }}><Typography sx={{
          fontSize: 48,
          fontWeight: 900
        }}>4.0</Typography><Rating value={4} readOnly size="large" sx={{
          color: 'primary.main'
        }} /></Stack><Typography component="h2" variant="h3" sx={{
        mt: 1
      }}>Deja tu calificación aquí</Typography><Rating aria-label="Tu calificación" value={data.ratings[id] || 0} size="large" onChange={(_, value) => askLogin(() => {
        setData(current => ({
          ...current,
          ratings: {
            ...current.ratings,
            [id]: value
          }
        }));
        notify('Calificación guardada.');
      })} sx={{
        color: 'primary.main',
        my: 1.5
      }} /><Divider /><Typography sx={{
        fontWeight: 800,
        mt: 2,
        fontSize: 13
      }}>Gabriela Villanueva</Typography><Rating value={4} readOnly size="small" sx={{
        color: 'primary.main'
      }} /><Typography variant="body2">Excelente producto, aunque a mi parecer es excesivo el precio.</Typography></Paper>}
    <Paper elevation={0} sx={{
      p: {
        xs: 3,
        md: 4
      },
      mt: 4,
      borderRadius: 2
    }}><Typography component="h2" variant="h3">Preguntas y respuestas</Typography><Typography variant="body2" sx={{
        mt: 1,
        mb: 2
      }}>¿Tienes dudas? Pregúntale al vendedor directamente.</Typography><Box component="form" onSubmit={submitQuestion} sx={{
        display: 'flex',
        gap: 1,
        flexDirection: {
          xs: 'column',
          sm: 'row'
        }
      }}><TextField label="Escribe tu pregunta al vendedor" value={question} onChange={event => setQuestion(event.target.value)} required fullWidth slotProps={{
          htmlInput: {
            maxLength: 800
          }
        }} /><Button type="submit" variant="contained">Preguntar</Button></Box><Typography sx={{
        fontSize: 11,
        color: 'text.secondary',
        my: 2
      }}>El vendedor responderá tu consulta aquí.</Typography><Divider /><Typography sx={{
        my: 2,
        fontWeight: 800
      }}>Últimas preguntas</Typography>{data.questions.filter(item => item.productId === id).map(item => <Box key={item.id} sx={{
        py: 2,
        borderTop: '1px solid',
        borderColor: 'divider'
      }}><Typography variant="body2">{item.text}</Typography><Typography variant="body2" color="text.secondary" sx={{
          ml: 2,
          mt: 1
        }}>↳ {item.answer || 'Esperando respuesta del vendedor.'}</Typography></Box>)}</Paper>
    {!service && <Box sx={{
      mt: 5, maxWidth: 800, mx: 'auto'
    }}><Typography component="h2" variant="h3" align="center" sx={{
        mb: 3
      }}>Quienes compraron este producto también compraron...</Typography><CatalogGrid columns={3} items={data.products.filter(item => item.id !== id && ['air-jordan', 'iphone', 'nespresso'].includes(item.id))} /></Box>}
    {quoteOpen && <QuoteDialog service={product} onClose={() => setQuoteOpen(false)} />}
  </>;
}
