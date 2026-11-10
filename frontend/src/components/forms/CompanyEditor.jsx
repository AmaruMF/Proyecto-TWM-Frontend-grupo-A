import { useState } from 'react';
import { Alert, Box, Button, Divider, FormControlLabel, Checkbox, MenuItem, Stack, TextField, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import AddressFields from './AddressFields';
import PhoneFields from './PhoneFields';
import useMarketplace from '../../hooks/useMarketplace';
import { validRut } from '../../utils/validation';

const regions = ['Arica y Parinacota', 'Tarapacá', 'Antofagasta', 'Atacama', 'Coquimbo', 'Valparaíso', 'Metropolitana', 'O’Higgins', 'Maule', 'Ñuble', 'Biobío', 'La Araucanía', 'Los Ríos', 'Los Lagos', 'Aysén', 'Magallanes'];
const formCompany = company => ({ ...company, name: company.name || '', rut: company.rut || '', email: company.email || '', website: company.website || '', phones: company.phones?.length ? [...company.phones] : [''], physical: Boolean(company.physical), offering: company.offering || 'Ambos', address: { id: company.address?.id || crypto.randomUUID(), region: '', commune: '', city: '', street: '', number: '', ...company.address }, shippingRates: (company.shippingRates || []).map(rule => ({ ...rule, id: rule.id || crypto.randomUUID() })), defaultShipping: company.defaultShipping ?? 7990 });
const validPhones = phones => phones.length > 0 && phones.every(phone => /^\+?\d{8,15}$/.test(phone.replace(/[() .-]/g, ''))) && new Set(phones.map(phone => phone.replace(/\D/g, ''))).size === phones.length;

export default function CompanyEditor({ company }) {
  const { saveCompany, notify } = useMarketplace();
  const [editing, setEditing] = useState(false);
  const [values, setValues] = useState(() => formCompany(company));
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const change = field => event => setValues(current => ({ ...current, [field]: event.target.value }));
  const changeRule = (id, field, value) => setValues(current => ({ ...current, shippingRates: current.shippingRates.map(rule => rule.id === id ? { ...rule, [field]: value } : rule) }));
  const toggleEditing = () => { setValues(formCompany(company)); setError(''); setEditing(!editing); };
  const submit = async event => {
    event.preventDefault();
    if (submitting) return;
    if (!values.name.trim() || !validRut(values.rut)) { setError('Completa la razón social y un RUT válido.'); return; }
    if (!validPhones(values.phones)) { setError('Agrega al menos un teléfono válido y no repitas números.'); return; }
    if (values.physical && ['region', 'commune', 'city', 'street', 'number'].some(field => !String(values.address[field] || '').trim())) { setError('Completa la dirección de tu tienda física.'); return; }
    if (values.website.trim()) {
      try { const url = new URL(values.website); if (!['https:', 'http:'].includes(url.protocol)) throw new Error(); }
      catch { setError('Usa una dirección web válida, comenzando con https:// o http://.'); return; }
    }
    if (!Number.isInteger(Number(values.defaultShipping)) || Number(values.defaultShipping) < 0 || values.shippingRates.some(rule => !rule.region || !Number.isInteger(Number(rule.price)) || Number(rule.price) < 0)) { setError('Las tarifas deben tener una región y un importe entero mayor o igual a cero.'); return; }
    const zones = values.shippingRates.map(rule => `${rule.region.toLocaleLowerCase('es')}|${rule.commune.trim().toLocaleLowerCase('es')}`);
    if (new Set(zones).size !== zones.length) { setError('No repitas la misma región y comuna en tus tarifas.'); return; }
    setError(''); setSubmitting(true);
    try {
      const saved = await saveCompany({ ...values, name: values.name.trim(), rut: values.rut.trim(), email: values.email.trim(), website: values.website.trim(), phones: values.phones.map(phone => phone.trim()), address: values.physical ? values.address : null, defaultShipping: Number(values.defaultShipping), shippingRates: values.shippingRates.map(rule => ({ ...rule, commune: rule.commune.trim(), price: Number(rule.price) })) });
      if (!saved) return;
      setEditing(false); notify('Datos comerciales actualizados.');
    } catch { setError('No fue posible guardar los datos comerciales. Inténtalo nuevamente.'); }
    finally { setSubmitting(false); }
  };
  return <Box sx={{ mt: 3 }}>
    <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', gap: 2 }}><Typography component="h2" variant="h3">Mi empresa</Typography><Button variant="outlined" onClick={toggleEditing}>{editing ? 'Cancelar edición' : 'Editar empresa'}</Button></Stack>
    <Typography sx={{ mt: 1 }}>{company.name} · RUT {company.rut}</Typography>
    {!editing && <Typography variant="body2" sx={{ mt: 1 }}>Ofrece: {company.offering || 'Ambos'}</Typography>}
    {editing && <Box component="form" onSubmit={submit} sx={{ mt: 3 }}><Stack spacing={3}>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 3 }}><TextField label="Razón social / Nombre de la empresa" value={values.name || ''} onChange={change('name')} required slotProps={{ htmlInput: { maxLength: 100 } }} /><TextField label="RUT de la empresa" value={values.rut || ''} onChange={change('rut')} required /><TextField label="Correo electrónico de la empresa" type="email" value={values.email || ''} onChange={change('email')} required /><TextField label="Sitio web (opcional)" type="url" value={values.website || ''} onChange={change('website')} placeholder="https://www.empresa.cl" /></Box>
      <PhoneFields value={values.phones} onChange={phones => setValues(current => ({ ...current, phones }))} prefix="company-" />
      <Box><Typography component="h3" sx={{ fontWeight: 800, mb: 2 }}>¿Qué ofrecerás?</Typography><ToggleButtonGroup exclusive value={values.offering} onChange={(_, offering) => offering && setValues(current => ({ ...current, offering }))} size="small" aria-label="Tipo de oferta comercial">{['Producto', 'Servicio', 'Ambos'].map(option => <ToggleButton value={option} key={option}>{option}</ToggleButton>)}</ToggleButtonGroup></Box>
      <FormControlLabel label="Mi negocio tiene una tienda física" control={<Checkbox checked={values.physical} onChange={event => setValues(current => ({ ...current, physical: event.target.checked }))} />} />
      {values.physical && <><AddressFields value={values.address} onChange={address => setValues(current => ({ ...current, address }))} prefix="company-address-" /><TextField label="Departamento, referencia u otros detalles (opcional)" value={values.address.details || ''} onChange={event => setValues(current => ({ ...current, address: { ...current.address, details: event.target.value } }))} fullWidth /></>}
      <Divider /><Typography component="h3" sx={{ fontWeight: 800 }}>Tarifas de envío</Typography><Typography variant="body2">Una tarifa de comuna tiene prioridad sobre la tarifa regional. La tarifa general se utiliza cuando no existe una zona coincidente.</Typography>
      <TextField label="Tarifa general (CLP)" value={values.defaultShipping} onChange={change('defaultShipping')} type="number" required slotProps={{ htmlInput: { min: 0, step: 1 } }} sx={{ maxWidth: 360 }} />
      {values.shippingRates.map(rule => <Stack spacing={2} key={rule.id}><Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 2 }}><TextField label="Región de la tarifa" select value={rule.region || ''} onChange={event => changeRule(rule.id, 'region', event.target.value)} required>{regions.map(region => <MenuItem value={region} key={region}>{region}</MenuItem>)}</TextField><TextField label="Comuna (opcional)" value={rule.commune || ''} onChange={event => changeRule(rule.id, 'commune', event.target.value)} helperText="Vacío: toda la región." /><TextField label="Costo de envío (CLP)" value={rule.price} onChange={event => changeRule(rule.id, 'price', event.target.value)} type="number" required slotProps={{ htmlInput: { min: 0, step: 1 } }} /></Box><Box><Button variant="outlined" onClick={() => setValues(current => ({ ...current, shippingRates: current.shippingRates.filter(item => item.id !== rule.id) }))}>Quitar tarifa</Button></Box></Stack>)}
      <Box><Button variant="outlined" onClick={() => setValues(current => ({ ...current, shippingRates: [...current.shippingRates, { id: crypto.randomUUID(), region: '', commune: '', price: 0 }] }))}>＋ Agregar tarifa por zona</Button></Box>
      {error && <Alert severity="error">{error}</Alert>}<Box><Button variant="contained" type="submit" disabled={submitting}>Guardar datos comerciales</Button></Box>
    </Stack></Box>}
  </Box>;
}
