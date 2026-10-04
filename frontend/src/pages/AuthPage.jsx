import { useState } from 'react';
import {
  Avatar,
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  Link,
  Paper,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import PersonAddAltIcon from '@mui/icons-material/PersonAddAlt';
import LayersIcon from '@mui/icons-material/Layers';
import heroImage from '../assets/hero.png';

const loginInitial = {
  email: '',
  password: '',
  remember: true,
};

const registerInitial = {
  name: '',
  email: '',
  phone: '',
  password: '',
  acceptTerms: false,
};

function AuthPage({ onLogin }) {
  const [mode, setMode] = useState('login');
  const [loginData, setLoginData] = useState(loginInitial);
  const [registerData, setRegisterData] = useState(registerInitial);

  const handleLoginChange = (event) => {
    const { name, value, checked, type } = event.target;
    setLoginData((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleRegisterChange = (event) => {
    const { name, value, checked, type } = event.target;
    setRegisterData((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }));
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
    <Box
      sx={{
        minHeight: '100vh',
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: '1.05fr 0.95fr' },
        bgcolor: '#F9DFC6',
      }}
    >
      <Box
        sx={{
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
          justifyContent: 'space-between',
          p: { md: 5, lg: 7 },
          color: '#F9DFC6',
          background: `linear-gradient(140deg, rgba(11,8,41,0.98), rgba(143,160,216,0.76)), url(${heroImage}) center 70% / 360px no-repeat`,
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Avatar sx={{ bgcolor: '#FF8400', color: '#0B0829', fontWeight: 900 }}>T</Avatar>
          <Typography variant="h3" sx={{ color: '#F9DFC6' }}>
            TWM
          </Typography>
        </Stack>
        <Box sx={{ maxWidth: 560 }}>
          <Typography variant="h1" sx={{ color: '#F9DFC6', mb: 2 }}>
            Gestiona clientes y servicios desde un panel moderno.
          </Typography>
          <Typography sx={{ color: 'rgba(249,223,198,0.80)', fontSize: 18 }}>
            Flujo frontend simulado con React y Material UI: autenticacion visual, navegacion, perfil y CRUD operativos.
          </Typography>
        </Box>
        <Stack direction="row" spacing={2}>
          {['React', 'MUI', 'CRUD'].map((item) => (
            <Box key={item} sx={{ px: 2, py: 1, borderRadius: 2, bgcolor: 'rgba(255,132,0,0.18)', border: '1px solid rgba(249,223,198,0.22)' }}>
              {item}
            </Box>
          ))}
        </Stack>
      </Box>

      <Box sx={{ display: 'grid', placeItems: 'center', p: { xs: 2, sm: 4 } }}>
        <Paper
          elevation={0}
          sx={{
            width: '100%',
            maxWidth: 470,
            p: { xs: 3, sm: 4 },
            border: '1px solid rgba(11,8,41,0.14)',
            bgcolor: '#FFF8F0',
          }}
        >
          <Stack spacing={3}>
            <Box>
              <Avatar sx={{ bgcolor: '#0B0829', color: '#F9DFC6', mb: 2 }}>
                {mode === 'login' ? <LockOutlinedIcon /> : <PersonAddAltIcon />}
              </Avatar>
              <Typography variant="h2">{mode === 'login' ? 'Iniciar sesion' : 'Crear cuenta'}</Typography>
              <Typography color="text.secondary" sx={{ mt: 1 }}>
                {mode === 'login' ? 'Ingresa tus credenciales para acceder al panel.' : 'Completa tus datos para simular el registro.'}
              </Typography>
            </Box>

            <ToggleButtonGroup
              value={mode}
              exclusive
              onChange={(_, value) => value && setMode(value)}
              fullWidth
              color="primary"
              size="small"
              sx={{
                bgcolor: '#F9DFC6',
                '& .MuiToggleButton-root': {
                  borderColor: 'rgba(11,8,41,0.16)',
                  color: '#0B0829',
                  fontWeight: 800,
                },
                '& .Mui-selected': {
                  bgcolor: '#8FA0D8 !important',
                  color: '#0B0829 !important',
                },
              }}
            >
              <ToggleButton value="login">
                <LockOutlinedIcon fontSize="small" sx={{ mr: 1 }} />
                Login
              </ToggleButton>
              <ToggleButton value="register">
                <PersonAddAltIcon fontSize="small" sx={{ mr: 1 }} />
                Registro
              </ToggleButton>
            </ToggleButtonGroup>

            {mode === 'login' ? (
              <Box component="form" onSubmit={submitLogin}>
                <Stack spacing={2}>
                  <TextField name="email" label="Correo electronico" type="email" value={loginData.email} onChange={handleLoginChange} required fullWidth />
                  <TextField name="password" label="Contrasena" type="password" value={loginData.password} onChange={handleLoginChange} required fullWidth />
                  <FormControlLabel
                    control={<Checkbox name="remember" checked={loginData.remember} onChange={handleLoginChange} />}
                    label="Recordar sesion"
                  />
                  <Button type="submit" variant="contained" color="secondary" size="large" startIcon={<LayersIcon />}>
                    Entrar al panel
                  </Button>
                  <Typography variant="body2" color="text.secondary" align="center">
                    No tienes cuenta?{' '}
                    <Link component="button" type="button" color="secondary" onClick={() => setMode('register')}>
                      Registrate
                    </Link>
                  </Typography>
                </Stack>
              </Box>
            ) : (
              <Box component="form" onSubmit={submitRegister}>
                <Stack spacing={2}>
                  <TextField name="name" label="Nombre completo" value={registerData.name} onChange={handleRegisterChange} required fullWidth />
                  <TextField name="email" label="Correo electronico" type="email" value={registerData.email} onChange={handleRegisterChange} required fullWidth />
                  <TextField name="phone" label="Telefono" value={registerData.phone} onChange={handleRegisterChange} required fullWidth />
                  <TextField name="password" label="Contrasena" type="password" value={registerData.password} onChange={handleRegisterChange} required fullWidth />
                  <FormControlLabel
                    control={<Checkbox name="acceptTerms" checked={registerData.acceptTerms} onChange={handleRegisterChange} required />}
                    label="Acepto las condiciones de uso"
                  />
                  <Button type="submit" variant="contained" color="secondary" size="large" startIcon={<PersonAddAltIcon />}>
                    Crear cuenta
                  </Button>
                </Stack>
              </Box>
            )}
          </Stack>
        </Paper>
      </Box>
    </Box>
  );
}

export default AuthPage;
