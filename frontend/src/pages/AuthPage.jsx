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
import logo from '../assets/figma/twm-logo.svg';
import authLockLogo from '../assets/figma/auth-lock-correct.png';

const COLORS = {
  ink: '#0B0829', lavender: '#8FA0D8', orange: '#FF8400', cream: '#F9DFC6',
  paper: '#FFFAF5', border: '#EADFD5', muted: '#6F6B78',
};

const loginInitial = { email: '', password: '', remember: true, showPassword: false };
const registerInitial = { name: '', phone: '', email: '', password: '', confirmPassword: '', acceptTerms: false, showPassword: false, showConfirmPassword: false };
const gmailPattern = /^[^\s@]+@gmail\.com$/i;
const gmailErrorMessage = 'Ingresa un correo válido que termine en @gmail.com.';

function AuthTopBar() {
  return (
    <Box component="header" sx={{ height: 72, px: { xs: 2, md: 6 }, display: 'flex', alignItems: 'center', bgcolor: COLORS.paper }}>
      <Box component="img" src={logo} alt="TWM" sx={{ width: 62, height: 62, objectFit: 'contain', flexShrink: 0 }} />
    </Box>
  );
}

function LockArtwork({ register = false }) {
  return (
    <Box sx={{ position: 'relative', height: '100%', minHeight: 480, overflow: 'hidden', bgcolor: register ? COLORS.ink : COLORS.lavender }}>
      <Box sx={{ position: 'absolute', top: register ? 40 : 36, left: register ? 44 : 104, width: register ? 182 : 180, height: register ? 140 : 180, borderRadius: register ? '30px' : '36px', bgcolor: register ? COLORS.lavender : COLORS.orange }} />
      <Box sx={{ position: 'absolute', top: register ? 192 : 151, right: register ? 72 : 39, width: register ? 274 : 250, height: register ? 230 : 250, borderRadius: register ? '42px' : '48px', bgcolor: register ? COLORS.orange : COLORS.ink }} />
      <Box component="img" src={authLockLogo} alt="Logo TWM" sx={{ position: 'absolute', left: '50%', bottom: 24, transform: 'translateX(-50%)', width: register ? '78%' : '68%', maxWidth: 466, height: 'auto', display: 'block' }} />
    </Box>
  );
}

function Field({ name, label, value, onChange, type = 'text', placeholder, required = true, endAdornment, error = false, helperText }) {
  return <TextField name={name} label={label} placeholder={placeholder} type={type} value={value} onChange={onChange} required={required} error={error} helperText={helperText} fullWidth slotProps={{ input: { endAdornment } }} />;
}

function AuthPage({ onLogin }) {
  const [mode, setMode] = useState('login');
  const [loginData, setLoginData] = useState(loginInitial);
  const [registerData, setRegisterData] = useState(registerInitial);
  const [loginEmailError, setLoginEmailError] = useState(false);
  const [registerEmailError, setRegisterEmailError] = useState(false);
  const isLogin = mode === 'login';

  const updateData = (setter) => (event) => {
    const { name, value, checked, type } = event.target;
    setter((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }));
  };

  const submitLogin = (event) => {
    event.preventDefault();
    if (!gmailPattern.test(loginData.email.trim())) {
      setLoginEmailError(true);
      return;
    }
    console.log('[TWM] Datos de inicio de sesion', { ...loginData });
    onLogin();
  };

  const submitRegister = (event) => {
    event.preventDefault();
    if (!gmailPattern.test(registerData.email.trim())) {
      setRegisterEmailError(true);
      return;
    }
    console.log('[TWM] Datos de registro de usuario', { ...registerData });
    setMode('login');
  };

  const updateEmail = (setter, clearError) => (event) => {
    updateData(setter)(event);
    clearError(false);
  };

  const toggle = (setter, name) => () => setter((current) => ({ ...current, [name]: !current[name] }));

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: COLORS.paper, color: COLORS.ink }}>
      <AuthTopBar />
      {isLogin ? (
        <Box sx={{ display: { xs: 'block', md: 'grid' }, gridTemplateColumns: '1.25fr 1fr', minHeight: 'calc(100vh - 72px)' }}>
          <Box sx={{ display: 'grid', placeItems: 'center', px: { xs: 2, sm: 4, lg: 8 }, py: { xs: 4, md: 6 } }}>
            <Paper elevation={0} sx={{ width: '100%', maxWidth: 624, minHeight: { md: 588 }, p: { xs: 3, sm: 5 }, borderRadius: 3, border: `1px solid ${COLORS.border}`, bgcolor: '#FFFFFF', boxShadow: '0 18px 50px rgba(11,8,41,0.10)' }}>
              <Stack spacing={3} sx={{ height: '100%' }}>
                <Box>
                  <Typography sx={{ fontSize: { xs: 32, sm: 42 }, fontWeight: 900, lineHeight: 1.05, letterSpacing: '-0.05em' }}>Inicia sesión</Typography>
                  <Typography sx={{ color: COLORS.muted, fontSize: 15, mt: 1.5 }}>Accede a tu cuenta y continúa descubriendo tu estilo.</Typography>
                </Box>
                <Box component="form" onSubmit={submitLogin} sx={{ flex: 1 }}>
                  <Stack spacing={2.1}>
                    <Field name="email" label="Correo electrónico" placeholder="nombre@gmail.com" type="email" value={loginData.email} onChange={updateEmail(setLoginData, setLoginEmailError)} error={loginEmailError} helperText={loginEmailError ? gmailErrorMessage : undefined} />
                    <Field name="password" label="Contraseña" placeholder="••••••••" type={loginData.showPassword ? 'text' : 'password'} value={loginData.password} onChange={updateData(setLoginData)} endAdornment={<FormControlLabel control={<Checkbox size="small" name="showPassword" checked={loginData.showPassword} onChange={toggle(setLoginData, 'showPassword')} />} label="Mostrar contraseña" sx={{ mr: 0, whiteSpace: 'nowrap', '& .MuiFormControlLabel-label': { fontSize: 12, color: COLORS.muted } }} />} />
                    <FormControlLabel control={<Checkbox name="remember" checked={loginData.remember} onChange={updateData(setLoginData)} />} label="Recordarme" sx={{ '& .MuiFormControlLabel-label': { fontSize: 14, color: COLORS.muted } }} />
                    <Button type="submit" variant="contained" color="primary" endIcon={<ArrowForwardIcon />} sx={{ height: 58, borderRadius: '12px', fontWeight: 900, color: '#fff' }}>Iniciar sesión</Button>
                  </Stack>
                </Box>
                <Typography align="center" sx={{ color: COLORS.muted, fontSize: 14, pt: 2 }}>¿Aún no tienes una cuenta?{' '}<Link component="button" type="button" onClick={() => setMode('register')} sx={{ color: COLORS.orange, fontWeight: 900, fontSize: 14 }}>Crear cuenta</Link></Typography>
              </Stack>
            </Paper>
          </Box>
          <LockArtwork />
        </Box>
      ) : (
        <Box sx={{ display: { xs: 'block', md: 'grid' }, gridTemplateColumns: '0.8fr 1fr', minHeight: 'calc(100vh - 72px)' }}>
          <LockArtwork register />
          <Box sx={{ display: 'grid', placeItems: 'center', px: { xs: 2, sm: 4, lg: 8 }, py: { xs: 4, md: 5 } }}>
            <Paper elevation={0} sx={{ width: '100%', maxWidth: 700, p: { xs: 3, sm: 5 }, borderRadius: 3, border: `1px solid ${COLORS.border}`, bgcolor: '#FFFFFF', boxShadow: '0 18px 50px rgba(11,8,41,0.10)' }}>
              <Stack spacing={1.4}>
                <Box sx={{ mb: 0.5 }}>
                  <Typography sx={{ fontSize: { xs: 32, sm: 40 }, fontWeight: 900, lineHeight: 1.05, letterSpacing: '-0.05em' }}>Crea tu cuenta</Typography>
                  <Typography sx={{ color: COLORS.muted, fontSize: 15, mt: 1.2 }}>Completa tus datos para guardar favoritos y comprar más rápido.</Typography>
                </Box>
                <Box component="form" onSubmit={submitRegister}>
                  <Stack spacing={1.5}>
                    <Field name="name" label="Nombre completo" placeholder="Tu nombre" value={registerData.name} onChange={updateData(setRegisterData)} />
                    <Field name="phone" label="Teléfono principal" placeholder="+56 9 5555 1122" value={registerData.phone} onChange={updateData(setRegisterData)} />
                    <Field name="email" label="Correo electrónico" placeholder="nombre@gmail.com" type="email" value={registerData.email} onChange={updateEmail(setRegisterData, setRegisterEmailError)} error={registerEmailError} helperText={registerEmailError ? gmailErrorMessage : undefined} />
                    <Field name="password" label="Contraseña" placeholder="Mínimo 8 caracteres" type={registerData.showPassword ? 'text' : 'password'} value={registerData.password} onChange={updateData(setRegisterData)} endAdornment={<FormControlLabel control={<Checkbox size="small" name="showPassword" checked={registerData.showPassword} onChange={toggle(setRegisterData, 'showPassword')} />} label="Mostrar contraseña" sx={{ mr: 0, whiteSpace: 'nowrap', '& .MuiFormControlLabel-label': { fontSize: 12, color: COLORS.muted } }} />} />
                    <Field name="confirmPassword" label="Confirmar contraseña" placeholder="Repite tu contraseña" type={registerData.showConfirmPassword ? 'text' : 'password'} value={registerData.confirmPassword} onChange={updateData(setRegisterData)} endAdornment={<FormControlLabel control={<Checkbox size="small" name="showConfirmPassword" checked={registerData.showConfirmPassword} onChange={toggle(setRegisterData, 'showConfirmPassword')} />} label="Mostrar contraseña" sx={{ mr: 0, whiteSpace: 'nowrap', '& .MuiFormControlLabel-label': { fontSize: 12, color: COLORS.muted } }} />} />
                    <FormControlLabel control={<Checkbox name="acceptTerms" checked={registerData.acceptTerms} onChange={updateData(setRegisterData)} required />} label="Acepto los términos y la política de privacidad." sx={{ '& .MuiFormControlLabel-label': { fontSize: 12, color: COLORS.muted } }} />
                    <Button type="submit" variant="contained" color="secondary" endIcon={<ArrowForwardIcon />} sx={{ height: 58, borderRadius: '12px', fontWeight: 900, color: COLORS.ink }}>Crear cuenta</Button>
                  </Stack>
                </Box>
                <Typography align="center" sx={{ color: COLORS.muted, fontSize: 14, pt: 1 }}>¿Ya tienes una cuenta?{' '}<Link component="button" type="button" onClick={() => setMode('login')} sx={{ color: COLORS.orange, fontWeight: 900, fontSize: 14 }}>Inicia sesión</Link></Typography>
              </Stack>
            </Paper>
          </Box>
        </Box>
      )}
    </Box>
  );
}

export default AuthPage;
