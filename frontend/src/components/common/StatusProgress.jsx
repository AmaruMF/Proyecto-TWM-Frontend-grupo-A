import { Box, Typography } from '@mui/material';

export default function StatusProgress({ labels = ['Recibido', 'En preparación', 'Enviado', 'Entregado'], step = 0 }) {
  return <Box role="list" aria-label={`Estado: ${labels[step]}`} sx={{ display: 'flex', alignItems: 'flex-start', my: 3 }}>
    {labels.map((label, index) => <Box role="listitem" key={label} sx={{ flex: 1, minWidth: 0, textAlign: 'center', position: 'relative', '&::before': index ? { content: '""', position: 'absolute', top: { xs: 13, sm: 20 }, right: '65%', width: '70%', height: 3, bgcolor: index <= step ? 'primary.main' : 'rgba(11,8,41,0.22)' } : {} }}>
      <Box aria-hidden="true" sx={{ mx: 'auto', width: { xs: 28, sm: 42 }, height: { xs: 28, sm: 42 }, borderRadius: '50%', bgcolor: index <= step ? 'primary.main' : 'rgba(11,8,41,0.22)' }} />
      <Typography sx={{ mt: 1, px: 0.25, fontSize: { xs: 10, sm: 13 }, fontWeight: 800, overflowWrap: 'anywhere' }}>{label}</Typography>
    </Box>)}
  </Box>;
}
