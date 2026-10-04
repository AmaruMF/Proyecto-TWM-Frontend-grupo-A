import { Avatar, Box, Button, Divider, Paper, Stack, TextField, Typography } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import SectionHeader from '../components/common/SectionHeader';
import { userProfile } from '../data/initialData';

function ProfilePage() {
  const handleSubmit = (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const profileData = Object.fromEntries(formData.entries());
    console.log('Datos del perfil', profileData);
  };

  return (
    <Box>
      <SectionHeader
        eyebrow="Usuario"
        title="Perfil de cuenta"
        description="Informacion del usuario visible desde el menu de navegacion y desde el menu superior."
      />
      <Paper variant="outlined" sx={{ p: { xs: 2.5, md: 4 }, maxWidth: 900, bgcolor: '#FFF8F0' }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} alignItems={{ xs: 'flex-start', sm: 'center' }}>
          <Avatar sx={{ width: 76, height: 76, bgcolor: '#FF8400', color: '#0B0829', fontSize: 24, fontWeight: 900 }}>G5</Avatar>
          <Box>
            <Typography variant="h3">{userProfile.name}</Typography>
            <Typography color="text.secondary">{userProfile.role}</Typography>
          </Box>
        </Stack>
        <Divider sx={{ my: 3 }} />
        <Box component="form" onSubmit={handleSubmit}>
          <Stack spacing={2}>
            <TextField name="name" label="Nombre" defaultValue={userProfile.name} fullWidth />
            <TextField name="email" label="Correo" defaultValue={userProfile.email} fullWidth />
            <TextField name="phone" label="Telefono" defaultValue={userProfile.phone} fullWidth />
            <TextField name="location" label="Ubicacion" defaultValue={userProfile.location} fullWidth />
            <Box>
              <Button type="submit" variant="contained" color="secondary" startIcon={<SaveIcon />}>
                Guardar perfil
              </Button>
            </Box>
          </Stack>
        </Box>
      </Paper>
    </Box>
  );
}

export default ProfilePage;
