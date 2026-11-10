import { useState } from 'react';
import { Alert, Box, Button, Divider, FormControlLabel, Checkbox, Stack, TextField, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import SectionHeader from '../../components/common/SectionHeader';
import PagePanel from '../../components/common/PagePanel';
import AddressFields from '../../components/forms/AddressFields';
import PhoneFields from '../../components/forms/PhoneFields';
import useMarketplace from '../../hooks/useMarketplace';
import { navigate } from '../../hooks/useNavigation';
import { isAdult, validRut } from '../../utils/validation';
import { today } from '../../utils/commerce';
const emptyAddress = {
  region: '',
  commune: '',
  city: '',
  street: '',
  number: ''
};
export default function RegistrationPage({
  company = false,
  seller = false
}) {
  const {
    data,
    saveCompany,
    registerProfile,
    notify
  } = useMarketplace();
  const [business, setBusiness] = useState(seller);
  const [physical, setPhysical] = useState(company ? data.company?.physical ?? true : true);
  const [offering, setOffering] = useState(company ? data.company?.offering || 'Producto' : 'Producto');
  const [phones, setPhones] = useState(company && data.company?.phones?.length ? [...data.company.phones] : ['']);
  const [addresses, setAddresses] = useState(company && data.company?.address ? [{ ...data.company.address, id: data.company.address.id || crypto.randomUUID() }] : [{
    id: crypto.randomUUID(), label: 'Casa',
    ...emptyAddress
  }]);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [touched, setTouched] = useState({});
  const [values, setValues] = useState({
    name: '',
    lastName: '',
    run: '',
    email: '',
    birthday: '',
    password: '',
    confirm: '',
    companyName: company ? data.company?.name || '' : '',
    rut: company ? data.company?.rut || '' : '',
    companyEmail: company ? data.company?.email || '' : '',
    website: company ? data.company?.website || '' : ''
  });
  const update = field => event => {
    setValues(current => ({
      ...current,
      [field]: event.target.value
    }));
    setError('');
  };
  const setAddress = (index, address) => setAddresses(current => current.map((item, itemIndex) => itemIndex === index ? address : item));
  const submit = async event => {
    event.preventDefault();
    if (submitting) return;
    setTouched({ run: true, rut: true, birthday: true });
    if (company ? !values.companyName.trim() : !values.name.trim() || !values.lastName.trim()) { setError('Completa el nombre y los apellidos o la razón social con texto válido.'); return; }
    if (!validRut(company ? values.rut : values.run)) {
      setError('El RUT/RUN es inválido. Revisa el número y el dígito verificador.');
      return;
    }
    if ((company || business) && !isAdult(company ? data.profile.birthday : values.birthday, today())) {
      setError(company ? 'Para vender debes tener 18 años cumplidos. Revisa tu fecha de nacimiento en Mi cuenta.' : 'Para registrarte como vendedor debes tener 18 años cumplidos.');
      return;
    }
    if (!company && !/^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(values.password)) {
      setError('Usa al menos 8 caracteres, una mayúscula, un número y un símbolo.');
      return;
    }
    if (!company && values.password !== values.confirm) {
      setError('Las contraseñas deben coincidir.');
      return;
    }
    const normalizedPhones = phones.map(phone => phone.trim());
    if (!normalizedPhones.length || normalizedPhones.some(phone => !/^\+?\d{8,15}$/.test(phone.replace(/[() .-]/g, ''))) || new Set(normalizedPhones.map(phone => phone.replace(/\D/g, ''))).size !== normalizedPhones.length) { setError('Agrega al menos un teléfono válido y no repitas números.'); return; }
    if ((!company || physical) && addresses.some(address => ['region', 'commune', 'city', 'street', 'number', ...(!company ? ['label'] : [])].some(field => !String(address[field] || '').trim()))) { setError('Completa todos los campos de las direcciones.'); return; }
    if (company && values.website.trim()) { try { const website = new URL(values.website); if (!['http:', 'https:'].includes(website.protocol)) throw new Error(); } catch { setError('El sitio web debe comenzar con http:// o https:// y ser válido.'); return; } }
    setSubmitting(true);
    try {
    if (company) {
      const saved = await saveCompany({
          name: values.companyName.trim(),
          rut: values.rut.trim(),
          email: values.companyEmail.trim(),
          website: values.website,
          phones: normalizedPhones,
          physical,
          offering,
          address: physical ? addresses[0] : null,
          shippingRates: data.company?.shippingRates || [],
          defaultShipping: data.company?.defaultShipping ?? 7990
      });
      if (!saved) return;
      notify('Empresa registrada. Ya puedes gestionar tus publicaciones.');
      navigate('/inicio');
    } else {
      if (!await registerProfile({
        name: values.name.trim(),
        lastName: values.lastName.trim(),
        run: values.run,
        email: values.email.trim(),
        phone: normalizedPhones[0],
        phones: normalizedPhones,
        birthday: values.birthday,
        location: `${addresses[0].city}, Chile`,
        addresses
      }, business, values.password)) return;
      notify(business ? 'Cuenta de vendedor creada. Completa los datos de tu empresa.' : 'Cuenta creada.');
      navigate(business ? '/registro-empresa' : '/inicio');
    }
    } catch { setError('No fue posible guardar el registro. Inténtalo nuevamente.'); }
    finally { setSubmitting(false); }
  };
  return <Box sx={{
    maxWidth: 1064,
    mx: 'auto'
  }}><SectionHeader title={company ? 'Registra tu empresa' : business ? 'Crea tu cuenta de vendedor' : 'Crea tu cuenta'} description={company ? 'Completa la información comercial para comenzar a vender en Multiplaza.' : 'Compra de forma segura y guarda tus direcciones para tus próximos pedidos.'} />
    {company && <Alert severity="info" sx={{
      mb: 3
    }}>{data.profile.accountType === 'seller' ? 'Tu cuenta de vendedor está creada.' : 'Completa tu empresa para activar tu cuenta de vendedor.'} Tus datos personales ya están guardados. Usaremos la información de {data.profile.name} para identificar al emprendedor.</Alert>}
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
        {company ? <><TextField label="Razón social / Nombre de la empresa" required value={values.companyName} onChange={update('companyName')} /><TextField label="RUT" error={Boolean(touched.rut && !validRut(values.rut))} helperText={touched.rut && !validRut(values.rut) ? "RUT inválido: revisa el dígito verificador." : "Ejemplo: 76.123.456-0"} onBlur={() => setTouched(current => ({ ...current, rut: true }))} placeholder="76.123.456-0" required value={values.rut} onChange={update('rut')} /></> : <><TextField label="Nombres" required value={values.name} onChange={update('name')} autoComplete="given-name" /><TextField label="Apellidos" required value={values.lastName} onChange={update('lastName')} autoComplete="family-name" /><TextField label="RUN" error={Boolean(touched.run && !validRut(values.run))} helperText={touched.run && !validRut(values.run) ? "RUN inválido: revisa el dígito verificador." : "Ejemplo: 12.345.678-5"} onBlur={() => setTouched(current => ({ ...current, run: true }))} placeholder="12.345.678-5" required value={values.run} onChange={update('run')} /></>}
        <TextField label="Correo electrónico" type="email" value={company ? values.companyEmail : values.email} onChange={update(company ? 'companyEmail' : 'email')} required autoComplete="email" />
        {company && <TextField label="Sitio web (opcional)" type="url" placeholder="https://www.empresa.cl" value={values.website} onChange={update('website')} />}
      </Box>
      <PhoneFields value={phones} onChange={setPhones} prefix={company ? 'company-registration-' : 'registration-'} />
      {!company && <TextField label="Fecha de nacimiento" error={Boolean(business && touched.birthday && !isAdult(values.birthday, today()))} helperText={business ? "Para vender debes tener 18 años cumplidos." : undefined} onBlur={() => setTouched(current => ({ ...current, birthday: true }))} type="date" required value={values.birthday} onChange={update('birthday')} slotProps={{
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
      {(!company || physical) && <><Typography component="h2" variant="h3">{company ? 'Ubicación de la tienda' : 'Dirección de envío'}</Typography>{addresses.map((address, index) => <Box key={address.id}>{index > 0 && <Divider sx={{
              mb: 3
            }} />}<AddressFields value={address} onChange={next => setAddress(index, next)} prefix={`address-${index}-`} showLabel={!company} />{index > 0 && <Button onClick={() => setAddresses(current => current.filter((_, itemIndex) => itemIndex !== index))} sx={{
              mt: 1
            }}>Quitar dirección</Button>}</Box>)}{!company && <Box><Button variant="outlined" onClick={() => setAddresses(current => [...current, {
              ...emptyAddress, id: crypto.randomUUID(), label: ''
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
          }}><TextField label="Contraseña" type={showPassword ? 'text' : 'password'} required value={values.password} onChange={update('password')} autoComplete="new-password" /><TextField label="Confirmar contraseña" type={showPassword ? 'text' : 'password'} required value={values.confirm} onChange={update('confirm')} autoComplete="new-password" error={Boolean(values.confirm && values.password !== values.confirm)} /></Box><FormControlLabel label="Mostrar contraseñas" control={<Checkbox checked={showPassword} onChange={event => setShowPassword(event.target.checked)} />} /></>}
      {error && <Alert severity="error" role="alert">{error}</Alert>}
      <Stack direction="row" sx={{
          justifyContent: "space-between"
        }}><Button variant="outlined" onClick={() => navigate(company ? '/cuenta' : '/acceso')}>Volver</Button><Button type="submit" variant="contained" disabled={submitting} sx={{
            minWidth: {
              sm: 240
            }
          }}>{company ? 'Registrar empresa' : business ? 'Continuar' : 'Crear cuenta'}</Button></Stack>
    </Stack></PagePanel>
  </Box>;
}
