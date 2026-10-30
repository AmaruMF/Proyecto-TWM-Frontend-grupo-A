import { useState } from 'react';
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, Checkbox, Stack, TextField, Typography } from '@mui/material';
import DesignIcon from '../../components/common/DesignIcon';
import PagePanel from '../../components/common/PagePanel';
import SectionHeader from '../../components/common/SectionHeader';
import useMarketplace from '../../hooks/useMarketplace';
import { initialMarketplace } from '../../data/marketplaceData';

export default function ProfilePage() {
  const { data, setData, session, notify, logout } = useMarketplace();
  const [profile, setProfile] = useState(data.profile);
  const [editing, setEditing] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [error, setError] = useState('');
  const change = (event) => setProfile((current) => ({ ...current, [event.target.name]: event.target.value }));
  const submit = (event) => {
    event.preventDefault();
    if (password && (!/^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(password) || password !== confirm)) { setError('Las contraseñas deben coincidir y tener al menos 8 caracteres, una mayúscula, un número y un símbolo.'); return; }
    setData((current) => ({ ...current, profile })); setPassword(''); setConfirm(''); setEditing(false); setError('');
    notify(password ? 'Perfil actualizado. La contraseña de ejemplo no se guarda.' : 'Perfil actualizado.');
  };

  return <PagePanel sx={{ border: '1px solid', borderColor: 'primary.main' }}><SectionHeader title={session.role === 'seller' ? 'Perfil de vendedor' : 'Mi cuenta'} description={session.role === 'seller' ? 'Administra tu perfil, publicaciones, ofertas y cotizaciones.' : 'Actualiza tus datos personales y gestiona tu cuenta.'} actionLabel={editing ? 'Cancelar edición' : 'Editar'} actionIcon={<DesignIcon name="edit" inverse />} onAction={() => { setEditing(!editing); setProfile(data.profile); setError(''); setPassword(''); setConfirm(''); }} />
    <Box component="form" onSubmit={submit}><Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 3 }}>
      {[['name', 'Nombres'], ['lastName', 'Apellidos'], ['run', 'RUN'], ['email', 'Correo electrónico'], ['phone', 'Teléfono'], ['location', 'Ubicación']].map(([name, label]) => <TextField key={name} name={name} label={label} value={profile[name] || ''} onChange={change} slotProps={{ input: { readOnly: !editing || name === 'run' } }} required={name !== 'lastName'} type={name === 'email' ? 'email' : name === 'phone' ? 'tel' : 'text'} helperText={name === 'run' ? 'Este dato no se puede modificar.' : undefined} />)}
      <TextField label="Nueva contraseña" type={show ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} slotProps={{ input: { readOnly: !editing } }} autoComplete="new-password" helperText="Opcional; no se almacena en esta demostración." />
      <TextField label="Confirmar contraseña" type={show ? 'text' : 'password'} value={confirm} onChange={(event) => setConfirm(event.target.value)} slotProps={{ input: { readOnly: !editing } }} required={Boolean(password)} autoComplete="new-password" error={Boolean(error)} />
    </Box>{editing && <FormControlLabel label="Mostrar contraseñas" control={<Checkbox checked={show} onChange={(event) => setShow(event.target.checked)} />} />}
      {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 3 }}><Button type="submit" variant="contained" disabled={!editing} startIcon={<DesignIcon name="save" inverse />}>Guardar cambios</Button><Button variant="outlined" startIcon={<DesignIcon name="delete" />} onClick={() => setDeleteOpen(true)}>Eliminar cuenta</Button></Stack>
    </Box>
    <Alert severity="warning" sx={{ mt: 3 }}>Al eliminar tu cuenta de ejemplo se quitarán tus cambios y datos guardados en este navegador.</Alert>
    {data.company && <Box sx={{ mt: 3 }}><Typography component="h2" variant="h3">Mi empresa</Typography><Typography sx={{ mt: 1 }}>{data.company.name} · RUT {data.company.rut}</Typography></Box>}
    <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)} maxWidth="xs" fullWidth><DialogTitle>¿Eliminar tu cuenta de ejemplo?</DialogTitle><DialogContent>Se borrarán los datos personales y cambios locales. La tienda volverá a sus datos de ejemplo.</DialogContent><DialogActions sx={{ px: 3, pb: 3 }}><Button onClick={() => setDeleteOpen(false)}>Cancelar</Button><Button variant="contained" color="secondary" onClick={() => { setData(initialMarketplace); setDeleteOpen(false); logout(); notify('Cuenta de ejemplo eliminada de este navegador.'); }}>Eliminar cuenta</Button></DialogActions></Dialog>
  </PagePanel>;
}
