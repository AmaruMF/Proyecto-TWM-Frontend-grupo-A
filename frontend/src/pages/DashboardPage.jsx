import { Box, Grid, Paper, Stack, Typography } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import SectionHeader from '../components/common/SectionHeader';
import { dashboardStats } from '../data/initialData';

function DashboardPage() {
  return (
    <Box>
      <SectionHeader
        eyebrow="Resumen"
        title="Panel principal"
        description="Vista general del flujo solicitado: autenticacion, navegacion, perfil y dos modulos CRUD simulados en frontend."
      />
      <Grid container spacing={2.5}>
        {dashboardStats.map((stat) => (
          <Grid key={stat.label} item xs={12} md={4}>
            <Paper variant="outlined" sx={{ p: 3, height: '100%', bgcolor: '#FFF8F0' }}>
              <Stack spacing={2}>
                <Box sx={{ width: 46, height: 46, borderRadius: 2, display: 'grid', placeItems: 'center', bgcolor: '#8FA0D8', color: '#0B0829' }}>
                  <TrendingUpIcon />
                </Box>
                <Box>
                  <Typography color="text.secondary" fontWeight={700}>
                    {stat.label}
                  </Typography>
                  <Typography variant="h1" sx={{ fontSize: 42, mt: 1 }}>
                    {stat.value}
                  </Typography>
                  <Typography color="text.secondary">{stat.helper}</Typography>
                </Box>
              </Stack>
            </Paper>
          </Grid>
        ))}
        <Grid item xs={12}>
          <Paper variant="outlined" sx={{ p: 3, bgcolor: '#FFF8F0', borderLeft: '6px solid #FF8400' }}>
            <Typography variant="h3" sx={{ mb: 1 }}>
              Flujo implementado
            </Typography>
            <Typography color="text.secondary">
              Los formularios de login, registro, creacion, edicion y eliminacion imprimen en consola los objetos capturados. Los datos se mantienen en estado local para simular la experiencia completa sin backend.
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export default DashboardPage;
