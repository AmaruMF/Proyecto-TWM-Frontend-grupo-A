import { useState } from 'react';
import { Alert, Box, Button, Divider, FormControlLabel, Checkbox, Stack, TextField, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import SectionHeader from '../../components/common/SectionHeader';
import PagePanel from '../../components/common/PagePanel';
import AddressFields from '../../components/forms/AddressFields';
import useMarketplace from '../../hooks/useMarketplace';
import { navigate } from '../../hooks/useNavigation';
import { today } from '../../utils/commerce';
const emptyAddress = {
  region: '',
  commune: '',
  city: '',
  street: '',
  number: ''
};
export default function RegistrationPage({
  company = false
}) {
  const {
    data,
    setData,
    login,
    notify
  } = useMarketplace();
  const [business, setBusiness] = useState(false);
  const [physical, setPhysical] = useState(true);
  const [offering, setOffering] = useState('Producto');
  const [phones, setPhones] = useState(['']);
  const [addresses, setAddresses] = useState([{
    ...emptyAddress
  }]);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [values, setValues] = useState({
    name: '',
    run: '',
    email: '',
    birthday: '',
    password: '',
    confirm: '',
    companyName: '',
    rut: '',
    companyEmail: '',
    website: ''
  });
  const update = field => event => {
    setValues(current => ({
      ...current,
      [field]: event.target.value
    }));
    setError('');
  };
  const setAddress = (index, address) => setAddresses(current => current.map((item, itemIndex) => itemIndex === index ? address : item));
  const submit = event => {
    event.preventDefault();
    if (!company && !/^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(values.password)) {
      setError('Usa al menos 8 caracteres, una mayúscula, un número y un símbolo.');
      return;
    }
    if (!company && values.password !== values.confirm) {
      setError('Las contraseñas deben coincidir.');
      return;
    }
    if (company) {
      setData(current => ({
        ...current,
        company: {
          name: values.companyName.trim(),
          rut: values.rut.trim(),
          email: values.companyEmail.trim(),
          website: values.website,
          phones,
          physical,
          offering,
          address: physical ? addresses[0] : null
        }
      }));
      login('seller');
      notify('Empresa registrada. Ya puedes gestionar tus publicaciones.');
      navigate('/inicio');
    } else {
      const parts = values.name.trim().split(/\s+/);
      setData(current => ({
        ...current,
        profile: {
          ...current.profile,
          name: parts.shift(),
          lastName: parts.join(' '),
          run: values.run,
          email: values.email.trim(),
          phone: phones[0],
          phones,
          birthday: values.birthday,
          location: `${addresses[0].city}, Chile`,
          addresses
        }
      }));
      login('client');
      notify(business ? 'Datos personales guardados. Completa tu empresa.' : 'Cuenta de ejemplo creada.');
      navigate(business ? '/registro-empresa' : '/inicio');
    }
  };
  return <Box sx={{
    maxWidth: 1064,
    mx: 'auto'
  }}><SectionHeader title={company ? 'Registra tu empresa' : 'Crea tu cuenta'} description={company ? 'Completa la información comercial para comenzar a vender en Multiplaza.' : 'Compra de forma segura y guarda tus direcciones para tus próximos pedidos.'} />
    {company && <Alert severity="info" sx={{
      mb: 3
    }}>Tus datos personales ya están guardados. Usaremos la información de {data.profile.name} para identificar al emprendedor.</Alert>}
    <PagePanel component="form" onSubmit={submit} sx={{
      borderRadius: 3
    }}><Stack spacing={3.5}>
      {company ? <Typography component="h2" variant="h3">Datos de la empresa</Typography> : <Box><Typography component="h2" variant="h3">¿Tienes un negocio?</Typography><Typography variant="body2" sx={{
            mt: 1,
            mb: 2
          }}>Si eliges Sí, después de tus datos personales continuarás al registro de empresa.</Typography><ToggleButtonGroup exclusive value={business} onChange={(_, next) => next !== null && setBusiness(next)} size="small" aria-label="¿Tienes un negocio?"><ToggleButton value={true}>Sí</ToggleButton><ToggleButton value={false}>No</ToggleButton></ToggleButtonGroup><Typography component="h2" variant="h3" sx={{
            mt: 3
          }}>Datos personales</Typography></Box>}
      <Typography variant="body2">Todos los campos marcados con * son obligatorios.</Typography>
      <Box sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: '1fr 1fr'
          },
          gap: 2.5
        }}>
        {company ? <><TextField label="Razón social / Nombre de la empresa" required value={values.companyName} onChange={update('companyName')} /><TextField label="RUT" placeholder="76.123.456-7" required value={values.rut} onChange={update('rut')} /></> : <><TextField label="Nombre completo" required value={values.name} onChange={update('name')} autoComplete="name" /><TextField label="RUN" placeholder="12.345.678-9" required value={values.run} onChange={update('run')} /></>}
        <TextField label="Teléfono principal" type="tel" value={phones[0]} onChange={event => setPhones(current => [event.target.value, ...current.slice(1)])} required autoComplete="tel" />
        <TextField label="Correo electrónico" type="email" value={company ? values.companyEmail : values.email} onChange={update(company ? 'companyEmail' : 'email')} required autoComplete="email" />
        {phones.slice(1).map((phone, index) => <TextField key={index} label={`Teléfono adicional ${index + 1}`} value={phone} type="tel" onChange={event => setPhones(current => current.map((item, itemIndex) => itemIndex === index + 1 ? event.target.value : item))} />)}
        {company && <TextField label="Sitio web (opcional)" placeholder="https://www.empresa.cl" value={values.website} onChange={update('website')} />}
      </Box>
      <Box><Button variant="outlined" onClick={() => setPhones(current => [...current, ''])}>＋ Agregar otro teléfono</Button></Box>
      {!company && <TextField label="Fecha de nacimiento" type="date" required value={values.birthday} onChange={update('birthday')} slotProps={{
          inputLabel: {
            shrink: true
          },
          htmlInput: {
            max: today()
          }
        }} sx={{
          maxWidth: 420
        }} />}
      {company && <Box><Typography component="h2" variant="h3">¿Tu negocio tiene una tienda física?</Typography><Typography variant="body2" sx={{
            mt: 1,
            mb: 2
          }}>Selecciona Sí para agregar la ubicación comercial.</Typography><ToggleButtonGroup value={physical} exclusive onChange={(_, next) => next !== null && setPhysical(next)} size="small" aria-label="Tienda física"><ToggleButton value={true}>Sí</ToggleButton><ToggleButton value={false}>No</ToggleButton></ToggleButtonGroup></Box>}
      {(!company || physical) && <><Typography component="h2" variant="h3">{company ? 'Ubicación de la tienda' : 'Dirección de envío'}</Typography>{addresses.map((address, index) => <Box key={index}>{index > 0 && <Divider sx={{
              mb: 3
            }} />}<AddressFields value={address} onChange={next => setAddress(index, next)} prefix={`address-${index}-`} />{index > 0 && <Button onClick={() => setAddresses(current => current.filter((_, itemIndex) => itemIndex !== index))} sx={{
              mt: 1
            }}>Quitar dirección</Button>}</Box>)}{!company && <Box><Button variant="outlined" onClick={() => setAddresses(current => [...current, {
              ...emptyAddress
            }])}>＋ Agregar otra dirección</Button></Box>}</>}
      {company ? <Box><Typography component="h2" variant="h3" sx={{
            mb: 2
          }}>¿Qué ofrecerás?</Typography><ToggleButtonGroup value={offering} exclusive onChange={(_, next) => next && setOffering(next)} size="small" aria-label="Tipo de oferta">{['Producto', 'Servicio', 'Ambos'].map(item => <ToggleButton value={item} key={item}>{item}</ToggleButton>)}</ToggleButtonGroup></Box> : <><Box><Typography component="h2" variant="h3">Crea tu contraseña</Typography><Typography variant="body2" sx={{
              mt: 1
            }}>Usa al menos 8 caracteres, una mayúscula, un número y un símbolo.</Typography></Box><Box sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: '1fr 1fr'
            },
            gap: 2.5
          }}><TextField label="Contraseña" type={showPassword ? 'text' : 'password'} required value={values.password} onChange={update('password')} autoComplete="new-password" /><TextField label="Confirmar contraseña" type={showPassword ? 'text' : 'password'} required value={values.confirm} onChange={update('confirm')} autoComplete="new-password" error={Boolean(error)} /></Box><FormControlLabel label="Mostrar contraseñas" control={<Checkbox checked={showPassword} onChange={event => setShowPassword(event.target.checked)} />} /></>}
      {error && <Alert severity="error" role="alert">{error}</Alert>}
      <Stack direction="row" sx={{
          justifyContent: "space-between"
        }}><Button variant="outlined" onClick={() => navigate(company ? '/cuenta' : '/acceso')}>Volver</Button><Button type="submit" variant="contained" sx={{
            minWidth: {
              sm: 240
            }
          }}>{company ? 'Registrar empresa' : business ? 'Continuar' : 'Crear cuenta'}</Button></Stack>
    </Stack></PagePanel>
  </Box>;
}
