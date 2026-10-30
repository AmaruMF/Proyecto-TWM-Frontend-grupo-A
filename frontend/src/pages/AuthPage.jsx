import { useState } from 'react';
import { Alert, Box, Button, Checkbox, Divider, FormControlLabel, InputAdornment, IconButton, Link, Paper, Stack, TextField, Typography } from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import Brand from '../components/common/Brand';
import useMarketplace from '../hooks/useMarketplace';
import { navigate } from '../hooks/useNavigation';
export default function AuthPage({
  onLogin
}) {
  const {
    login
  } = useMarketplace();
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const enter = (role = 'client') => {
    login(role, remember);
    if (onLogin) onLogin();else navigate('/inicio');
  };
  const submit = event => {
    event.preventDefault();
    enter();
  };
  return <Box sx={{
    minHeight: '100dvh',
    bgcolor: 'background.paper'
  }}>
    <Box component="header" sx={{
      bgcolor: 'primary.main',
      px: {
        xs: 2,
        md: 6
      },
      height: 84,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }}><Brand /><Button onClick={() => navigate('/')}>Explorar tienda</Button></Box>
    <Box component="main" sx={{
      display: 'grid',
      gridTemplateColumns: {
        xs: '1fr',
        md: '1fr 1fr'
      },
      minHeight: 'calc(100dvh - 84px)'
    }}>
      <Box sx={{
        display: {
          xs: 'none',
          md: 'grid'
        },
        placeItems: 'center',
        bgcolor: 'background.default',
        p: 8
      }}><Box sx={{
          width: '100%',
          maxWidth: 390,
          aspectRatio: '1',
          bgcolor: 'secondary.main',
          borderRadius: 6,
          p: 6,
          transform: 'rotate(-3deg)'
        }}><img src="/LogoAzulOscuro.svg" alt="Multiplaza" style={{
            display: 'block',
            width: '100%',
            height: '100%'
          }} /></Box></Box>
      <Box sx={{
        bgcolor: 'secondary.light',
        p: {
          xs: 3,
          sm: 6,
          lg: 9
        },
        display: 'grid',
        alignItems: 'center'
      }}>
        <Paper elevation={0} sx={{
          p: {
            xs: 3,
            sm: 4
          },
          borderRadius: 3,
          width: '100%',
          maxWidth: 560,
          mx: 'auto'
        }}>
          <Typography component="h1" sx={{
            fontSize: {
              xs: 30,
              md: 38
            },
            fontWeight: 900,
            mb: 1
          }}>Inicia sesión</Typography><Typography color="text.secondary" sx={{
            fontSize: 14,
            mb: 3
          }}>Accede a tu cuenta y continúa descubriendo Multiplaza.</Typography>
          <Alert severity="info" sx={{
            mb: 3
          }}>Acceso de demostración. Usa los botones de ejemplo para recorrer las vistas.</Alert>
          <Box component="form" onSubmit={submit}><Stack spacing={2.5}>
            <TextField name="identifier" label="Correo electrónico o RUN" placeholder="nombre@gmail.com o 12.345.678-9" required fullWidth autoComplete="username" />
            <TextField name="password" label="Contraseña" type={showPassword ? 'text' : 'password'} required fullWidth autoComplete="current-password" slotProps={{
                input: {
                  endAdornment: <InputAdornment position="end"><IconButton aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'} onClick={() => setShowPassword(!showPassword)} edge="end">{showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}</IconButton></InputAdornment>
                }
              }} />
            <FormControlLabel label="Mantener sesión activa" control={<Checkbox checked={remember} onChange={event => setRemember(event.target.checked)} />} />
            <Button variant="contained" type="submit" size="large">Iniciar sesión</Button>
          </Stack></Box>
          <Typography align="center" sx={{
            mt: 3,
            fontSize: 14
          }}>¿Aún no tienes una cuenta? <Link component="button" onClick={() => navigate('/registro')} sx={{
              fontWeight: 800
            }}>Crear cuenta</Link></Typography>
          <Divider sx={{
            my: 3
          }}>Cuentas de ejemplo</Divider><Stack direction={{
            xs: 'column',
            sm: 'row'
          }} sx={{
            gap: 1
          }}><Button variant="outlined" fullWidth onClick={() => enter('client')}>Entrar como cliente</Button><Button variant="outlined" fullWidth onClick={() => enter('seller')}>Entrar como vendedor</Button></Stack>
        </Paper>
      </Box>
    </Box>
  </Box>;
}
