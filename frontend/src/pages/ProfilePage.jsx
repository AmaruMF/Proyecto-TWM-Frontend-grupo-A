import { useState } from 'react';
import { Avatar, Box, Button, Divider, Paper, Stack, TextField, Typography } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import SectionHeader from '../components/common/SectionHeader';
import { userProfile } from '../data/initialData';

function ProfilePage() {
  const [profile, setProfile] = useState(userProfile);
  const handleChange = (event) => setProfile((current) => ({ ...current, [event.target.name]: event.target.value }));
  const handleSubmit = (event) => { event.preventDefault(); console.log('Datos del perfil', profile); };

  return (
    <Box>
      <SectionHeader eyebrow="Mi cuenta" title="Perfil de usuario" description="Revisa y actualiza la información visible en tu cuenta." />
      <Paper variant="outlined" sx={{ p: { xs: 2.5, md: 4 }, maxWidth: 920, bgcolor: '#FFFFFF' }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} sx={{ alignItems: { xs: 'flex-start', sm: 'center' } }}>
          <Avatar sx={{ width: 76, height: 76, bgcolor: '#FF8400', color: '#0B0829', fontSize: 24, fontWeight: 900 }}>G5</Avatar>
          <Box><Typography sx={{ fontSize: 24, fontWeight: 900 }}>{profile.name}</Typography><Typography color="text.secondary">{profile.role}</Typography></Box>
        </Stack>
        <Divider sx={{ my: 3 }} />
        <Box component="form" onSubmit={handleSubmit}>
          <Stack spacing={2}><TextField name="name" label="Nombre" value={profile.name} onChange={handleChange} fullWidth /><TextField name="email" label="Correo" value={profile.email} onChange={handleChange} fullWidth /><TextField name="phone" label="Teléfono" value={profile.phone} onChange={handleChange} fullWidth /><TextField name="location" label="Ubicación" value={profile.location} onChange={handleChange} fullWidth /><Box><Button type="submit" variant="contained" color="primary" startIcon={<SaveIcon />}>Guardar perfil</Button></Box></Stack>
        </Box>
      </Paper>
    </Box>
  );
}

export default ProfilePage;
