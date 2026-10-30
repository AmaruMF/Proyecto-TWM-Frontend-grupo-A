import { useState } from 'react';
import { Box, Button, ButtonBase, Chip, Paper, Stack, Typography } from '@mui/material';
import DesignIcon from '../../components/common/DesignIcon';
import PagePanel from '../../components/common/PagePanel';
import CatalogGrid from '../../components/catalog/CatalogGrid';
import QuoteDialog from '../../components/catalog/QuoteDialog';
import useMarketplace from '../../hooks/useMarketplace';
import { navigate } from '../../hooks/useNavigation';
import { currency } from '../../utils/commerce';
function CatalogSection({
  title,
  items,
  service = false,
  onQuote
}) {
  return <Box component="section" sx={{
    mt: 5
  }}><Stack direction="row" sx={{
      mb: 2,
      alignItems: "center",
      justifyContent: "space-between"
    }}><Typography component="h2" sx={{
        fontSize: {
          xs: 20,
          md: 24
        },
        fontWeight: 800
      }}>{title}</Typography><Button size="small" onClick={() => navigate(service ? '/servicios' : '/ofertas')} sx={{
        flexShrink: 0
      }}>Ver todo →</Button></Stack><CatalogGrid items={items} service={service} onQuote={onQuote} /></Box>;
}
export default function HomePage() {
  const {
    data,
    session
  } = useMarketplace();
  const [quote, setQuote] = useState(null);
  const seller = session?.role === 'seller';
  const displayProducts = data.products.filter(product => !['mouse', 'keyboard'].includes(product.id));
  if (!session) return <>
    <PagePanel sx={{
      display: 'grid',
      gridTemplateColumns: {
        xs: '1fr',
        md: '1.35fr 1fr'
      },
      gap: 3,
      borderRadius: 3
    }}>
      <Stack spacing={2} sx={{
        alignItems: "flex-start"
      }}><Chip label="Acceso público" icon={<DesignIcon name="lock" inverse />} sx={{
          bgcolor: 'primary.main',
          color: 'primary.contrastText'
        }} /><Typography component="h1" sx={{
          fontSize: {
            xs: 30,
            md: 36
          },
          lineHeight: 1.2,
          fontWeight: 900,
          letterSpacing: '-0.035em'
        }}>Explora Multiplaza sin iniciar sesión</Typography><Typography>Puedes ver ofertas, comparar precios y descubrir productos destacados antes de crear tu cuenta o iniciar sesión.</Typography><Stack direction={{
          xs: 'column',
          sm: 'row'
        }} sx={{
          gap: 1.5
        }}><Button onClick={() => navigate('/acceso')} variant="contained" startIcon={<DesignIcon name="login" inverse />}>Iniciar sesión</Button><Button onClick={() => navigate('/registro')} variant="outlined" startIcon={<DesignIcon name="register" />}>Crear cuenta</Button></Stack></Stack>
      <Paper variant="outlined" sx={{
        p: 3,
        border: '1px solid',
        borderColor: 'primary.main',
        borderRadius: 2,
        alignSelf: 'center'
      }}><Typography component="h2" variant="h3" sx={{
          mb: 2
        }}>¿Qué cambia cuando inicias sesión?</Typography>{[['heart', 'Guarda favoritos en Lista de deseos', 'Vuelve rápido a los productos que más te gustan.'], ['bag', 'Compras más rápidas', 'Tus datos listos para completar tu compra.']].map(([icon, title, text]) => <Stack key={title} direction="row" sx={{
          mt: 2,
          gap: 1.5,
          alignItems: "center"
        }}><Box sx={{
            p: 1,
            borderRadius: '50%',
            bgcolor: 'secondary.main',
            display: 'flex'
          }}><DesignIcon name={icon} /></Box><Box><Typography sx={{
              fontSize: 13,
              fontWeight: 800
            }}>{title}</Typography><Typography sx={{
              fontSize: 12,
              mt: 0.5
            }}>{text}</Typography></Box></Stack>)}</Paper>
    </PagePanel>
    <Stack direction="row" sx={{
      mt: 3,
      mb: 2,
      justifyContent: "space-between"
    }}><Typography component="h2" variant="h3">Ofertas destacadas</Typography><Button onClick={() => navigate('/ofertas')}>Ver todo</Button></Stack>
    <Stack spacing={2}>{['air-jordan', 'iphone'].map(id => {
        const product = data.products.find(item => item.id === id);
        return <ButtonBase key={id} onClick={() => navigate(`/producto/${id}`)} sx={{
          p: 2,
          gap: {
            xs: 2,
            sm: 3
          },
          border: '1px solid',
          borderColor: 'primary.main',
          bgcolor: 'background.paper',
          borderRadius: 2,
          textAlign: 'left',
          justifyContent: 'flex-start'
        }}><Box component="img" src={product.image} alt={product.name} sx={{
            width: {
              xs: 92,
              sm: 142
            },
            height: {
              xs: 112,
              sm: 144
            },
            objectFit: 'contain',
            borderRadius: 1
          }} /><Box sx={{
            flex: 1,
            minWidth: 0
          }}><Typography sx={{
              fontWeight: 800
            }}>{product.name}</Typography><Typography sx={{
              my: 1.5,
              fontSize: 12
            }}>{product.brand}</Typography><Stack direction="row" sx={{
              gap: 2,
              flexWrap: "wrap"
            }}><Typography sx={{
                fontWeight: 900
              }}>{currency(product.price)}</Typography><Typography sx={{
                textDecoration: 'line-through',
                fontSize: 13
              }}>{currency(product.originalPrice)}</Typography></Stack></Box><Chip label={`${product.discount}% OFF`} size="small" sx={{
            bgcolor: 'primary.main', color: 'primary.contrastText',
            display: {
              xs: 'none',
              sm: 'inline-flex'
            }
          }} /></ButtonBase>;
      })}</Stack>
  </>;
  return <>
    <Stack direction="row" sx={{
      mb: 3,
      justifyContent: "space-between",
      alignItems: "center",
      gap: 2
    }}><Box><Typography component="h1" variant="h3">¡Hola de nuevo, {data.profile.name}!</Typography><Typography sx={{
          mt: 1,
          fontSize: 14
        }}>{seller ? 'Administra tu negocio y sigue descubriendo productos, servicios y ofertas para ti.' : 'Continúa tu compra, revisa tus pedidos y encuentra ofertas pensadas para ti.'}</Typography></Box>{seller && <Chip label="Modo vendedor activo" sx={{
        bgcolor: 'secondary.main',
        fontWeight: 800
      }} />}</Stack>
    {seller ? <PagePanel sx={{
      border: '1px solid',
      borderColor: 'primary.main'
    }}>
      <Stack direction="row" sx={{
        justifyContent: "space-between",
        alignItems: "center"
      }}><Box><Typography component="h2" variant="h3">Tu negocio hoy</Typography><Typography variant="body2" sx={{
            mt: 0.5
          }}>Acciones prioritarias y rendimiento de tus publicaciones.</Typography></Box><Button onClick={() => navigate('/publicaciones')}>Ver panel completo</Button></Stack>
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: '1fr 1fr',
          md: 'repeat(4, 1fr)'
        },
        gap: 2,
        my: 3
      }}>{[['Ventas registradas', currency(data.transactions.filter(item => item.status === 'Completada').reduce((total, item) => total + item.total, 0)), 'Historial de transacciones'], ['Publicaciones activas', data.products.filter(item => !item.hidden).length, `${data.products.filter(item => item.stock < 3).length} con stock bajo`], ['Cotizaciones pendientes', data.quotes.filter(item => item.step === 0).length, 'Por responder'], ['Conversaciones', data.messages.length, 'Atención al cliente']].map(([label, value, helper]) => <Box key={label} sx={{
          bgcolor: 'rgba(255,248,240,0.35)',
          p: 2,
          borderRadius: 1
        }}><Typography sx={{
            fontSize: 12,
            fontWeight: 700
          }}>{label}</Typography><Typography sx={{
            fontSize: {
              xs: 21,
              md: 27
            },
            fontWeight: 900,
            my: 1
          }}>{value}</Typography><Typography sx={{
            fontSize: 11
          }}>{helper}</Typography></Box>)}</Box>
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: '1fr',
          sm: '1fr 1fr',
          lg: 'repeat(4, 1fr)'
        },
        gap: 2
      }}>{[['product', 'Agregar producto o servicio', 'Publica una nueva oferta en pocos pasos.', '/nuevo-producto'], ['publications', 'Gestionar publicaciones', 'Edita precios, stock, visibilidad y detalles.', '/publicaciones'], ['offer', 'Crear y gestionar ofertas', 'Activa descuentos para impulsar tus ventas.', '/oferta'], ['quote', 'Revisar cotizaciones', 'Responde solicitudes y confirma condiciones.', '/gestion']].map(([icon, title, helper, path], index) => <ButtonBase key={title} onClick={() => navigate(path)} sx={{
          display: 'flex',
          flexDirection: 'column',
          textAlign: 'left',
          alignItems: 'stretch',
          p: 2.5,
          border: '1px solid',
          borderColor: 'primary.main',
          borderRadius: 1.5,
          bgcolor: index ? 'background.paper' : 'primary.main',
          color: index ? 'text.primary' : 'primary.contrastText'
        }}><Stack direction="row" sx={{
            gap: 1.5,
            alignItems: "center"
          }}><DesignIcon name={icon} inverse={!index} /><Typography sx={{
              fontWeight: 800,
              fontSize: 16
            }}>{title}</Typography></Stack><Typography sx={{
            fontSize: 12,
            my: 2
          }}>{helper}</Typography><Typography sx={{
            fontSize: 12,
            fontWeight: 800,
            mt: 'auto',
            textDecoration: 'underline'
          }}>Ir ahora →</Typography></ButtonBase>)}</Box>
    </PagePanel> : <Box sx={{
      display: 'grid',
      gridTemplateColumns: {
        xs: '1fr',
        sm: '1fr 1fr'
      },
      gap: 2
    }}>{[['orders', `${data.orders.length} pedidos recientes`, 'Revisa el estado de tus compras.', 'Ver actividad', '/pedidos'], ['heart', `${data.wishlists[0].productIds.length} productos guardados`, 'Vuelve a encontrar tus favoritos.', 'Revisar favoritos', '/deseos']].map(([icon, title, helper, label, path]) => <PagePanel key={path} sx={{
        p: 2.5
      }}><Stack direction="row" sx={{
          gap: 2,
          alignItems: "center"
        }}><DesignIcon name={icon} /><Box><Typography sx={{
              fontWeight: 800
            }}>{title}</Typography><Typography variant="body2">{helper}</Typography></Box></Stack><Button variant="contained" size="small" onClick={() => navigate(path)} sx={{
          mt: 2
        }}>{label}</Button></PagePanel>)}</Box>}
    <CatalogSection title="¡Las mejores ofertas para ti en productos!" items={seller ? displayProducts.slice(8, 12) : displayProducts.slice(0, 12)} />
    <CatalogSection title="¡Contrata servicios de calidad aquí!" items={seller ? data.services.slice(4) : data.services} service onQuote={setQuote} />
    {quote && <QuoteDialog service={quote} onClose={() => setQuote(null)} />}
  </>;
}
