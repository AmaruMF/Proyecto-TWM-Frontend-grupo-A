import { Box, Button, Stack, TextField, Typography } from '@mui/material';

export default function PhoneFields({ value = [''], onChange, readOnly = false, prefix = '' }) {
  const phones = value.length ? value : [''];
  return <Box><Stack spacing={2}>{phones.map((phone, index) => <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} key={index} sx={{ alignItems: { sm: 'flex-end' } }}>
    <TextField fullWidth label={index === 0 ? 'Teléfono principal' : `Teléfono adicional ${index + 1}`} type="tel" name={`${prefix}phone-${index}`} value={phone} required onChange={event => onChange(phones.map((item, itemIndex) => itemIndex === index ? event.target.value : item))} slotProps={{ input: { readOnly }, htmlInput: { pattern: '[+0-9 .\\(\\)\\-]{8,20}', maxLength: 20 } }} autoComplete="tel" />
    {!readOnly && <Button variant="outlined" disabled={phones.length === 1} onClick={() => onChange(phones.filter((_, itemIndex) => itemIndex !== index))}>Quitar teléfono</Button>}
  </Stack>)}</Stack>{!readOnly && <><Button variant="outlined" sx={{ mt: 2 }} onClick={() => onChange([...phones, ''])}>＋ Agregar otro teléfono</Button><Typography variant="caption" display="block" sx={{ mt: 1 }}>Debes mantener al menos un teléfono.</Typography></>}</Box>;
}
