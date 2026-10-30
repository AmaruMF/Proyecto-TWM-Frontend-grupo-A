import { Box, Button, ButtonBase, Chip, IconButton, Stack, Tooltip, Typography } from '@mui/material';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import FavoriteIcon from '@mui/icons-material/Favorite';
import useMarketplace from '../../hooks/useMarketplace';
import { navigate } from '../../hooks/useNavigation';
import { currency } from '../../utils/commerce';
export default function ProductCard({
  product,
  service = false,
  onQuote,
  listId = 'favorites'
}) {
  const {
    data,
    session,
    toggleFavorite
  } = useMarketplace();
  const favorite = data.wishlists.find(list => list.id === listId)?.productIds.includes(product.id);
  const open = () => navigate(`/${service ? 'servicio' : 'producto'}/${product.id}`);
  return <Box component="article" sx={{
    p: 1.25,
    bgcolor: 'background.paper',
    border: '1px solid',
    borderColor: 'divider',
    borderRadius: 1.5,
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
    position: 'relative',
    transition: 'transform 150ms, box-shadow 150ms',
    '&:hover': {
      transform: 'translateY(-3px)',
      boxShadow: '0 8px 20px rgba(11,8,41,0.12)',
      borderColor: 'primary.main'
    }
  }}>
    <Chip label={product.category} size="small" sx={{
      alignSelf: 'flex-start',
      maxWidth: '100%',
      mb: 1,
      bgcolor: 'secondary.main',
      color: 'secondary.contrastText',
      fontSize: 10,
      height: 24
    }} />
    <ButtonBase onClick={open} aria-label={`Ver ${product.name}`} sx={{
      bgcolor: 'background.paper',
      borderRadius: 1,
      overflow: 'hidden',
      width: '100%',
      mb: 1.5
    }}>
      {product.image ? <Box component="img" src={product.image} alt={product.name} loading="lazy" sx={{
        width: '100%',
        aspectRatio: '219 / 184',
        objectFit: service ? 'cover' : 'contain',
        display: 'block'
      }} /> : <Box sx={{
        width: '100%',
        aspectRatio: '219 / 184',
        display: 'grid',
        placeItems: 'center',
        color: 'text.secondary'
      }}>Sin imagen</Box>}
    </ButtonBase>
    <ButtonBase onClick={open} sx={{
      textAlign: 'left',
      alignItems: 'flex-start',
      justifyContent: 'flex-start',
      mb: 1,
      borderRadius: 0.5
    }}><Typography sx={{
        fontSize: 14,
        fontWeight: 600,
        minHeight: 42,
        lineHeight: 1.45,
        textDecoration: service ? 'none' : 'underline'
      }}>{product.name}</Typography></ButtonBase>
    <Typography sx={{
      fontSize: 12,
      mt: 'auto',
      mb: 1
    }}>{service ? product.seller : product.brand}</Typography>
    {service ? <Stack direction="row" spacing={1}><Button onClick={open} variant="outlined" size="small" fullWidth>Ver</Button><Button onClick={() => onQuote(product)} variant="contained" color="primary" size="small" fullWidth>Cotizar</Button></Stack> : <>
      <Typography sx={{
        fontSize: 12,
        textDecoration: 'line-through'
      }}>{product.originalPrice > product.price ? currency(product.originalPrice) : '\u00a0'}</Typography>
      <Stack direction="row" sx={{
        justifyContent: "space-between",
        alignItems: "center",
        gap: 0.5
      }}>
        <Typography sx={{
          fontWeight: 900,
          fontSize: {
            xs: 16,
            sm: 20
          },
          whiteSpace: 'nowrap'
        }}>{currency(product.price)}</Typography>
        {product.discount > 0 && <Chip label={`${product.discount}% OFF`} size="small" sx={{
          height: 20,
          borderRadius: 0.5,
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
          fontSize: 10,
          fontWeight: 800,
          '& .MuiChip-label': {
            px: 0.75
          }
        }} />}
      </Stack>
      <Tooltip title={favorite ? 'Quitar de favoritos' : 'Guardar en favoritos'}><IconButton size="small" aria-label={`${favorite ? 'Quitar' : 'Guardar'} ${product.name} en favoritos`} onClick={() => session ? toggleFavorite(product.id, listId) : navigate('/acceso')} sx={{
          position: 'absolute',
          top: 42,
          right: 15,
          bgcolor: 'background.paper',
          '&:hover': {
            bgcolor: 'secondary.light'
          }
        }}>{favorite ? <FavoriteIcon fontSize="small" /> : <FavoriteBorderIcon fontSize="small" />}</IconButton></Tooltip>
    </>}
  </Box>;
}
