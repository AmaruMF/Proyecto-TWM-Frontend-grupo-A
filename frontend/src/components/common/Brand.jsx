import { Box, ButtonBase, Typography } from '@mui/material';
import { navigate } from '../../hooks/useNavigation';

export default function Brand({ compact = false }) {
  return <ButtonBase onClick={() => navigate('/')} aria-label="Multiplaza, ir al inicio" sx={{ gap: 1, borderRadius: 1, flexShrink: 0 }}>
    <Box sx={{ width: compact ? 40 : { xs: 42, md: 56 }, height: compact ? 40 : { xs: 42, md: 56 } }}>
      <Box component="img" src="/LogoAzulOscuro.svg" alt="" sx={{ display: 'block', width: '100%', height: '100%', objectFit: 'contain' }} />
    </Box>
    <Typography component="span" sx={{ fontSize: compact ? 24 : { xs: 26, md: 34 }, fontWeight: 900, letterSpacing: '-0.045em', color: 'text.primary', lineHeight: 1 }}>Multiplaza</Typography>
  </ButtonBase>;
}
