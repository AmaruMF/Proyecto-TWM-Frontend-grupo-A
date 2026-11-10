import { useState } from 'react';
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Divider, FormControlLabel, Checkbox, Stack, TextField, Typography } from '@mui/material';
import DesignIcon from '../../components/common/DesignIcon';
import PagePanel from '../../components/common/PagePanel';
import SectionHeader from '../../components/common/SectionHeader';
import AddressFields from '../../components/forms/AddressFields';
import PhoneFields from '../../components/forms/PhoneFields';
import CompanyEditor from '../../components/forms/CompanyEditor';
import useMarketplace from '../../hooks/useMarketplace';
import MessagesPage from './MessagesPage';
import { isAdult } from '../../utils/validation';
import { navigate } from '../../hooks/useNavigation';
import { today } from '../../utils/commerce';

const newAddress = () => ({ id: crypto.randomUUID(), label: '', region: '', commune: '', city: '', street: '', number: '', details: '' });
const editableProfile = profile => ({ ...profile, phones: profile.phones?.length ? [...profile.phones] : [profile.phone || ''], addresses: profile.addresses?.length ? profile.addresses.map(address => ({ ...address, id: address.id || crypto.randomUUID() })) : [newAddress()] });

export default function ProfilePage() {
  const { data, session, saveProfile, deleteAccount, notify } = useMarketplace();
  const [profile, setProfile] = useState(() => editableProfile(data.profile));
  const [editing, setEditing] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const change = event => setProfile(current => ({ ...current, [event.target.name]: event.target.value }));
  const toggleEditing = () => { setEditing(!editing); setProfile(editableProfile(data.profile)); setError(''); setPassword(''); setConfirm(''); };
  const submit = async event => {
    event.preventDefault();
    if (submitting) return;
    if (!profile.name.trim() || !profile.lastName.trim()) { setError('Completa tus nombres y apellidos.'); return; }
    if ((session.role === 'seller' || profile.accountType === 'seller' || data.company) && !isAdult(profile.birthday, today())) { setError('Un vendedor debe tener 18 años cumplidos. Revisa la fecha de nacimiento.'); return; }
    const phones = profile.phones.map(phone => phone.trim());
    if (!phones.length || phones.some(phone => !/^\+?\d{8,15}$/.test(phone.replace(/[() .-]/g, ''))) || new Set(phones.map(phone => phone.replace(/\D/g, ''))).size !== phones.length) { setError('Mantén al menos un teléfono válido y no repitas números.'); return; }
    if (!profile.addresses.length || profile.addresses.some(address => ['label', 'region', 'commune', 'city', 'street', 'number'].some(field => !String(address[field] || '').trim()))) { setError('Mantén al menos una dirección y completa sus datos obligatorios.'); return; }
    if (password && (!/^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(password) || password !== confirm)) { setError('Las contraseñas deben coincidir y tener al menos 8 caracteres, una mayúscula, un número y un símbolo.'); return; }
    setError(''); setSubmitting(true);
    try {
      const saved = await saveProfile({ ...profile, run: data.profile.run, name: profile.name.trim(), lastName: profile.lastName.trim(), email: profile.email.trim(), phones, phone: phones[0] }, { password });
      if (!saved) return;
      setPassword(''); setConfirm(''); setEditing(false); notify('Perfil actualizado.');
    } catch { setError('No fue posible guardar el perfil. Inténtalo nuevamente.'); }
    finally { setSubmitting(false); }
  };
  return <PagePanel sx={{ border: '1px solid', borderColor: 'primary.main' }}><SectionHeader title={session.role === 'seller' ? 'Perfil de vendedor' : 'Mi cuenta'} description={session.role === 'seller' ? 'Administra tu perfil, publicaciones, ofertas y cotizaciones.' : 'Actualiza tus datos personales y gestiona tu cuenta.'} actionLabel={editing ? 'Cancelar edición' : 'Editar'} actionIcon={<DesignIcon name="edit" inverse />} onAction={toggleEditing} />
    <Box component="form" onSubmit={submit}><Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 3 }}>
      {[['name', 'Nombres'], ['lastName', 'Apellidos'], ['run', 'RUN'], ['email', 'Correo electrónico'], ['location', 'Ubicación']].map(([name, label]) => <TextField key={name} name={name} label={label} value={profile[name] || ''} onChange={change} slotProps={{ input: { readOnly: !editing || name === 'run' }, htmlInput: { maxLength: name === 'email' ? 255 : 100 } }} required type={name === 'email' ? 'email' : 'text'} helperText={name === 'run' ? 'Este dato no se puede modificar.' : undefined} />)}
      <TextField label="Fecha de nacimiento" type="date" value={profile.birthday || ''} name="birthday" onChange={change} required slotProps={{ input: { readOnly: !editing }, htmlInput: { max: today() }, inputLabel: { shrink: true } }} />
      <TextField label="Nueva contraseña" type={show ? 'text' : 'password'} value={password} onChange={event => setPassword(event.target.value)} slotProps={{ input: { readOnly: !editing } }} autoComplete="new-password" helperText="Opcional: deja vacío para conservar tu contraseña." />
      <TextField label="Confirmar contraseña" type={show ? 'text' : 'password'} value={confirm} onChange={event => setConfirm(event.target.value)} slotProps={{ input: { readOnly: !editing } }} required={Boolean(password)} autoComplete="new-password" error={Boolean(confirm && password !== confirm)} />
    </Box>{editing && <FormControlLabel label="Mostrar contraseñas" control={<Checkbox checked={show} onChange={event => setShow(event.target.checked)} />} />}
      <Box sx={{ mt: 3 }}><PhoneFields value={profile.phones} onChange={phones => setProfile(current => ({ ...current, phones, phone: phones[0] }))} readOnly={!editing} /></Box>
      <Box sx={{ mt: 3 }}><Typography component="h2" variant="h3" sx={{ mb: 3 }}>Direcciones de despacho</Typography><Stack spacing={3}>{profile.addresses.map((address, index) => <Box key={address.id}>{index > 0 && <Divider sx={{ mb: 3 }} />}<AddressFields value={address} onChange={next => setProfile(current => ({ ...current, addresses: current.addresses.map(item => item.id === address.id ? next : item) }))} prefix={`profile-address-${address.id}-`} readOnly={!editing} showLabel /><TextField label="Departamento, referencia u otros detalles (opcional)" value={address.details || ''} onChange={event => setProfile(current => ({ ...current, addresses: current.addresses.map(item => item.id === address.id ? { ...item, details: event.target.value } : item) }))} slotProps={{ input: { readOnly: !editing } }} fullWidth sx={{ mt: 2 }} />{editing && <Button variant="outlined" sx={{ mt: 2 }} disabled={profile.addresses.length === 1} onClick={() => setProfile(current => ({ ...current, addresses: current.addresses.filter(item => item.id !== address.id) }))}>Quitar dirección</Button>}</Box>)}</Stack>{editing && <><Button variant="outlined" sx={{ mt: 3 }} onClick={() => setProfile(current => ({ ...current, addresses: [...current.addresses, newAddress()] }))}>＋ Agregar otra dirección</Button><Typography variant="caption" display="block" sx={{ mt: 1 }}>Debes mantener al menos una dirección de despacho.</Typography></>}</Box>
      {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 3 }}><Button type="submit" variant="contained" disabled={!editing || submitting} startIcon={<DesignIcon name="save" inverse />}>Guardar cambios</Button><Button variant="outlined" startIcon={<DesignIcon name="delete" />} onClick={() => setDeleteOpen(true)}>Eliminar cuenta</Button></Stack>
    </Box>
    <Alert severity="warning" sx={{ mt: 3 }}>Al eliminar tu cuenta se quitarán sus datos personales y se cerrará tu sesión.</Alert>
    {!data.company && <Box sx={{ mt: 3 }}><Button variant="contained" onClick={() => navigate('/registro-empresa')}>Crear mi empresa</Button></Box>}
    {data.company && <CompanyEditor key={data.company.id} company={data.company} />}
    <Box sx={{ mt: 4 }}><MessagesPage embedded /></Box>
    <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)} maxWidth="xs" fullWidth><DialogTitle>¿Eliminar tu cuenta?</DialogTitle><DialogContent>Se eliminarán tus datos personales de este navegador. El historial comercial conservará sus registros sin tus datos personales.</DialogContent><DialogActions sx={{ px: 3, pb: 3 }}><Button onClick={() => setDeleteOpen(false)}>Cancelar</Button><Button variant="contained" color="secondary" onClick={async () => { await deleteAccount(); setDeleteOpen(false); }}>Eliminar cuenta</Button></DialogActions></Dialog>
  </PagePanel>;
}
