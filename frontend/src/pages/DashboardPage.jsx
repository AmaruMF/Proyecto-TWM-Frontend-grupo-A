import { Box, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';
import SectionHeader from '../components/common/SectionHeader';

const metrics = [
  ['Órdenes recibidas', '38'],
  ['Cotizaciones abiertas', '12'],
  ['Mensajes pendientes', '7'],
  ['Stock bajo', '5 SKU'],
];

const activity = [
  ['Pedido', '#1024 despacho', 'En preparación'],
  ['Cotización', 'Mesa madera', 'Respondida'],
  ['Devolución', '#1009', 'Por aprobar'],
  ['Pregunta', 'Servicio instalación', 'Sin responder'],
];

function DashboardPage() {
  return (
    <Box>
      <SectionHeader eyebrow="Resumen operativo" title="Panel de control emprendedor" description="Resumen operativo para ventas, cotizaciones, stock y atención al cliente." />
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1.35fr' }, gap: 3, alignItems: 'stretch' }}>
        <Paper variant="outlined" sx={{ p: 2.5, bgcolor: '#FFFFFF' }}>
          <Typography sx={{ fontWeight: 900, fontSize: 18, mb: 2 }}>Indicadores</Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2.5 }}>
            {metrics.map(([label, value]) => (
              <Stack key={label} direction="row" spacing={1.2} sx={{ alignItems: 'center' }}>
                <Box sx={{ bgcolor: '#FDF0D9', borderRadius: 99, px: 1.5, py: 0.9, flex: 1, minWidth: 0 }}>
                  <Typography sx={{ fontSize: 11, fontWeight: 900, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</Typography>
                </Box>
                <Typography sx={{ fontSize: 20, fontWeight: 900, whiteSpace: 'nowrap' }}>{value}</Typography>
              </Stack>
            ))}
          </Box>
        </Paper>
        <Paper variant="outlined" sx={{ p: 2.5, bgcolor: '#FFFFFF' }}>
          <Typography sx={{ fontWeight: 900, fontSize: 18, mb: 1.2 }}>Actividad pendiente</Typography>
          <TableContainer>
            <Table size="small">
              <TableHead><TableRow><TableCell>Tipo</TableCell><TableCell>Detalle</TableCell><TableCell>Estado</TableCell></TableRow></TableHead>
              <TableBody>{activity.map((row) => <TableRow key={row[1]}><TableCell>{row[0]}</TableCell><TableCell>{row[1]}</TableCell><TableCell>{row[2]}</TableCell></TableRow>)}</TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Box>
      <Typography sx={{ fontWeight: 900, fontSize: 18, mt: 5, mb: 1.2 }}>Gestión rápida</Typography>
      <Paper variant="outlined" sx={{ p: { xs: 2.5, md: 3 }, bgcolor: '#FFFFFF' }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }, gap: 3 }}>
          {[
            ['Producto/Servicio', 'Alta de catálogo'],
            ['Oferta', 'Publicar promoción'],
            ['Stock', 'Actualizar SKU'],
            ['Despacho', 'Registrar seguimiento'],
            ['Mensajes', 'Responder cliente'],
            ['Devolución', 'Aprobar o rechazar'],
          ].map(([title, helper]) => <Box key={title} sx={{ p: 2, border: '1px solid #E0DCD1', borderRadius: 2, bgcolor: '#FDF0D9' }}><Typography sx={{ fontWeight: 900, fontSize: 16 }}>{title}</Typography><Typography sx={{ color: '#6F6B78', fontSize: 13, mt: 0.5 }}>{helper}</Typography></Box>)}
        </Box>
      </Paper>
    </Box>
  );
}

export default DashboardPage;
