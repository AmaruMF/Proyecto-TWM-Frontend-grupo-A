import { useState } from 'react';
import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  Link,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import PersonAddAltIcon from '@mui/icons-material/PersonAddAlt';

const COLORS = {
  ink: '#0B0829',
  lavender: '#8FA0D8',
  orange: '#FF8400',
  cream: '#F9DFC6',
  white: '#FFFDFC',
};

const loginInitial = { email: '', password: '', remember: true };
const registerInitial = { name: '', email: '', phone: '', password: '', acceptTerms: false };

function BrandMark() {
  return (
    <Stack direction="row" spacing={1.2} alignItems="center">
      <Box aria-label="Logo TWM" sx={{ width: 48, height: 48, position: 'relative', flexShrink: 0 }}>
        <Box sx={{ position: 'absolute', left: 10, top: 2, width: 23, height: 23, border: `4px solid ${COLORS.ink}`, borderBottom: 0, borderRadius: '14px 14px 0 0' }} />
        <Box sx={{ position: 'absolute', left: 5, top: 18, width: 33, height: 23, bgcolor: COLORS.orange, borderRadius: '2px 2px 0 0' }} />
        <Box sx={{ position: 'absolute', left: 21, top: 25, width: 21, height: 21, bgcolor: COLORS.lavender, border: `4px solid ${COLORS.white}`, borderRadius: '50%' }} />
      </Box>
      <Typography sx={{ color: COLORS.ink, fontWeight: 900, fontSize: 24, letterSpacing: '-0.04em' }}>TWM</Typography>
    </Stack>
  );
}

function DecorativePanel() {
  return (
    <Box sx={{ display: { xs: 'none', md: 'block' }, position: 'relative', overflow: 'hidden', bgcolor: COLORS.ink, minHeight: 0 }}>
      <Box sx={{ position: 'absolute', top: 32, left: 34, width: 142, height: 112, bgcolor: COLORS.lavender, borderRadius: '32px' }} />
      <Box sx={{ position: 'absolute', top: 150, right: 52, width: 214, height: 180, bgcolor: COLORS.orange, borderRadius: '34px' }} />
      <Box sx={{ position: 'absolute', left: 46, right: 46, bottom: 30, height: 280, bgcolor: COLORS.cream, borderRadius: '30px' }}>
        <Box sx={{ position: 'absolute', left: '50%', top: 42, transform: 'translateX(-50%)', width: 134, height: 92, border: `20px solid ${COLORS.ink}`, borderBottom: 0, borderRadius: '90px 90px 0 0' }} />
        <Box sx={{ position: 'absolute', left: 64, bottom: 40, width: 105, height: 120, bgcolor: COLORS.orange, borderRadius: '0 58px 0 0' }} />
        <Box sx={{ position: 'absolute', right: 64, bottom: 40, width: 105, height: 120, bgcolor: COLORS.lavender, borderRadius: '58px 0 0 0' }} />
        <Box sx={{ position: 'absolute', left: '50%', bottom: 0, transform: 'translateX(-50%)', width: 102, height: 76, border: `20px solid ${COLORS.cream}`, borderBottom: 0, borderRadius: '70px 70px 0 0' }} />
      </Box>
    </Box>
  );
}

function AuthPage({ onLogin }) {
  const [mode, setMode] = useState('login');
  const [loginData, setLoginData] = useState(loginInitial);
  const [registerData, setRegisterData] = useState(registerInitial);
  const isLogin = mode === 'login';

  const updateData = (setter) => (event) => {
    const { name, value, checked, type } = event.target;
    setter((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }));
  };

  const submitLogin = (event) => {
    event.preventDefault();
    console.log('Datos de inicio de sesion', loginData);
    onLogin();
  };

  const submitRegister = (event) => {
    event.preventDefault();
    console.log('Datos de registro de usuario', registerData);
    setMode('login');
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#F5F3F0', color: COLORS.ink }}>
      <Box component="header" sx={{ height: { xs: 72, md: 94 }, px: { xs: 2.5, md: 4.5 }, display: 'grid', gridTemplateColumns: { xs: '1fr auto', md: '40% 60%' }, alignItems: 'center', bgcolor: COLORS.white, borderBottom: '1px solid rgba(11,8,41,0.06)' }}>
        <BrandMark />
        <Stack direction="row" spacing={{ xs: 1, md: 4 }} justifyContent="flex-end" alignItems="center">
          <Stack direction="row" spacing={{ xs: 1.5, md: 3.5 }} sx={{ display: { xs: 'none', md: 'flex' } }}>
            {[].map((item) => <Typography key={item} sx={{ fontSize: 13, fontWeight: 800, color: COLORS.ink }}>{item}</Typography>)}
          </Stack>

        </Stack>
      </Box>

      <Box sx={{ display: { xs: 'block', md: 'grid' }, gridTemplateColumns: '40% 60%', minHeight: { md: 'calc(100vh - 94px)' } }}>
        <DecorativePanel />
        <Box sx={{ display: 'grid', placeItems: 'center', px: { xs: 2, sm: 4, lg: 8 }, py: { xs: 4, md: 4 } }}>
          <Paper elevation={0} sx={{ width: '100%', maxWidth: 544, p: { xs: 3, sm: 5 }, borderRadius: '20px', bgcolor: COLORS.white, border: '1px solid rgba(11,8,41,0.08)', boxShadow: '0 18px 42px rgba(11,8,41,0.08)' }}>
            <Stack spacing={2.8}>
              <Box>
                <Typography sx={{ color: COLORS.orange, fontSize: 11, fontWeight: 900, textTransform: 'uppercase', mb: 1.2 }}>{isLogin ? 'Bienvenido de vuelta' : 'Grupos · Nueva cuenta'}</Typography>
                <Typography sx={{ color: COLORS.ink, fontSize: { xs: 31, sm: 38 }, lineHeight: 1.05, fontWeight: 900, letterSpacing: '-0.045em' }}>{isLogin ? 'Inicia sesión' : 'Crea tu cuenta'}</Typography>
                <Typography sx={{ mt: 1.2, color: 'rgba(11,8,41,0.58)', fontSize: 14 }}>{isLogin ? 'Ingresa tus datos para continuar con tu cuenta.' : 'Completa tus datos para guardar favoritos y comprar más rápido.'}</Typography>
              </Box>

              {isLogin ? (
                <Box component="form" onSubmit={submitLogin}>
                  <Stack spacing={2.2}>
                    <TextField name="email" label="Correo electrónico" placeholder="nombre@correo.com" type="email" value={loginData.email} onChange={updateData(setLoginData)} required fullWidth />
                    <TextField name="password" label="Contraseña" placeholder="Mínimo 8 caracteres" type="password" value={loginData.password} onChange={updateData(setLoginData)} required fullWidth />
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <FormControlLabel control={<Checkbox name="remember" checked={loginData.remember} onChange={updateData(setLoginData)} />} label="Recordar sesión" sx={{ '& .MuiFormControlLabel-label': { fontSize: 12, color: 'rgba(11,8,41,0.58)' } }} />
                      <Link component="button" type="button" underline="hover" sx={{ color: COLORS.orange, fontSize: 12, fontWeight: 800 }}>¿Olvidaste tu contraseña?</Link>
                    </Stack>
                    <Button type="submit" variant="contained" color="secondary" size="large" endIcon={<ArrowForwardIcon />} sx={{ height: 48, borderRadius: '10px', color: COLORS.ink, fontWeight: 900 }}>Iniciar sesión</Button>
                  </Stack>
                </Box>
              ) : (
                <Box component="form" onSubmit={submitRegister}>
                  <Stack spacing={1.8}>
                    <TextField name="name" label="Nombre completo" placeholder="Tu nombre" value={registerData.name} onChange={updateData(setRegisterData)} required fullWidth />
                    <TextField name="email" label="Correo electrónico" placeholder="nombre@correo.com" type="email" value={registerData.email} onChange={updateData(setRegisterData)} required fullWidth />
                    <TextField name="phone" label="Teléfono" placeholder="+56 9 1234 5678" value={registerData.phone} onChange={updateData(setRegisterData)} required fullWidth />
                    <TextField name="password" label="Contraseña" placeholder="Mínimo 8 caracteres" type="password" value={registerData.password} onChange={updateData(setRegisterData)} required fullWidth />
                    <FormControlLabel control={<Checkbox name="acceptTerms" checked={registerData.acceptTerms} onChange={updateData(setRegisterData)} required />} label="Acepto los términos y la política de privacidad." sx={{ '& .MuiFormControlLabel-label': { fontSize: 12, color: 'rgba(11,8,41,0.58)' } }} />
                    <Button type="submit" variant="contained" color="secondary" size="large" endIcon={<ArrowForwardIcon />} sx={{ height: 48, borderRadius: '10px', color: COLORS.ink, fontWeight: 900 }}>Crear cuenta</Button>
                  </Stack>
                </Box>
              )}

              <Typography align="center" sx={{ color: 'rgba(11,8,41,0.56)', fontSize: 12 }}>
                {isLogin ? '¿Todavía no tienes una cuenta?' : '¿Ya tienes una cuenta?'}{' '}
                <Link component="button" type="button" onClick={() => setMode(isLogin ? 'register' : 'login')} sx={{ color: COLORS.orange, fontWeight: 900, fontSize: 12 }}>{isLogin ? 'Regístrate' : 'Inicia sesión'}</Link>
              </Typography>
            </Stack>
          </Paper>
        </Box>
      </Box>
    </Box>
  );
}

export default AuthPage;
