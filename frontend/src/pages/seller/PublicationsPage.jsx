import { Box, Button, Chip, Stack, Typography } from '@mui/material';
import SectionHeader from '../../components/common/SectionHeader';
import PagePanel from '../../components/common/PagePanel';
import useMarketplace from '../../hooks/useMarketplace';
import { navigate } from '../../hooks/useNavigation';
import { currency } from '../../utils/commerce';
export default function PublicationsPage({
  servicesOnly = false
}) {
  const {
    data,
    setData,
    notify
  } = useMarketplace();
  const publications = servicesOnly ? data.services.map(item => ({
    ...item,
    isService: true
  })) : [...data.products, ...data.services.map(item => ({
    ...item,
    isService: true
  }))];
  const toggleVisibility = item => {
    setData(current => ({
      ...current,
      [item.isService ? 'services' : 'products']: current[item.isService ? 'services' : 'products'].map(record => record.id === item.id ? {
        ...record,
        hidden: !record.hidden
      } : record)
    }));
    notify(item.hidden ? 'Publicación visible en el catálogo.' : 'Publicación pausada.');
  };
  return <><SectionHeader title={servicesOnly ? 'Mis servicios' : 'Gestionar publicaciones'} description="Edita los detalles y controla la visibilidad de tus publicaciones." actionLabel={servicesOnly ? '＋ Agregar servicio' : '＋ Agregar producto'} onAction={() => navigate(servicesOnly ? '/nuevo-servicio' : '/nuevo-producto')} extraActions={!servicesOnly && <Button variant="outlined" onClick={() => navigate('/nuevo-servicio')}>Agregar servicio</Button>} />
    <Stack spacing={2}>{publications.map(item => <PagePanel key={item.id} sx={{
        p: 2.5
      }}><Stack direction={{
          xs: 'column',
          sm: 'row'
        }} sx={{
          gap: 2,
          alignItems: {
            sm: 'center'
          }
        }}>{item.image && <Box component="img" src={item.image} alt={item.name} sx={{
            width: 90,
            height: 80,
            objectFit: item.isService ? 'cover' : 'contain',
            bgcolor: 'background.paper',
            borderRadius: 1
          }} />}<Box sx={{
            flex: 1,
            minWidth: 0
          }}><Typography component="h2" sx={{
              fontWeight: 800
            }}>{item.name}</Typography><Typography variant="body2" sx={{
              mt: 0.5
            }}>{item.isService ? 'Servicio · Cotización personalizada' : `${currency(item.price)} · Stock: ${item.stock}`}</Typography><Chip label={item.hidden ? 'Pausada' : 'Publicada'} size="small" sx={{
              mt: 1,
              bgcolor: 'background.paper'
            }} /></Box><Stack direction="row" sx={{
            gap: 1
          }}><Button variant="outlined" onClick={() => navigate(`/editar-${item.isService ? 'servicio' : 'producto'}/${item.id}`)}>Editar</Button><Button variant="contained" onClick={() => toggleVisibility(item)}>{item.hidden ? 'Publicar' : 'Pausar'}</Button></Stack></Stack></PagePanel>)}</Stack>
  </>;
}
