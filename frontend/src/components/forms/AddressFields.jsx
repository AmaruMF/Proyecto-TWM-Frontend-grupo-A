import { Box, MenuItem, TextField } from '@mui/material';

const regions = ['Arica y Parinacota', 'Tarapacá', 'Antofagasta', 'Atacama', 'Coquimbo', 'Valparaíso', 'Metropolitana', 'O’Higgins', 'Maule', 'Ñuble', 'Biobío', 'La Araucanía', 'Los Ríos', 'Los Lagos', 'Aysén', 'Magallanes'];

export default function AddressFields({ value, onChange, required = true, prefix = '', readOnly = false, showLabel = false }) {
  const update = (field) => (event) => onChange({ ...value, [field]: event.target.value });
  return <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(6, minmax(0, 1fr))' }, gap: 2.5 }}>
    {showLabel && <TextField label="Nombre de la dirección" placeholder="Casa, trabajo…" value={value.label || ''} onChange={update('label')} required={required} slotProps={{ input: { readOnly } }} sx={{ gridColumn: { sm: 'span 6' } }} name={`${prefix}label`} />}
    <TextField select label="Región" value={value.region || ''} onChange={update('region')} required={required} slotProps={{ input: { readOnly } }} sx={{ gridColumn: { sm: 'span 2' } }} name={`${prefix}region`}><MenuItem value="" disabled>Selecciona una región</MenuItem>{regions.map((region) => <MenuItem key={region} value={region}>{region}</MenuItem>)}</TextField>
    <TextField label="Comuna" value={value.commune || ''} onChange={update('commune')} required={required} slotProps={{ input: { readOnly } }} sx={{ gridColumn: { sm: 'span 2' } }} name={`${prefix}commune`} />
    <TextField label="Ciudad" value={value.city || ''} onChange={update('city')} required={required} slotProps={{ input: { readOnly } }} sx={{ gridColumn: { sm: 'span 2' } }} name={`${prefix}city`} />
    <TextField label="Calle" value={value.street || ''} onChange={update('street')} required={required} slotProps={{ input: { readOnly } }} sx={{ gridColumn: { sm: 'span 4' } }} name={`${prefix}street`} autoComplete="address-line1" />
    <TextField label="Número" value={value.number || ''} onChange={update('number')} required={required} slotProps={{ input: { readOnly } }} sx={{ gridColumn: { sm: 'span 2' } }} name={`${prefix}number`} />
  </Box>;
}
