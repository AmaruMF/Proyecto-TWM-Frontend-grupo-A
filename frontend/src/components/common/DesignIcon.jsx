import { Box } from '@mui/material';
import { useTheme } from '@mui/material/styles';

const icons = {
  search: '0004b.svg', chevron: '911bf.svg', account: 'd402e.svg', orders: 'f129c.svg', cart: 'fb7bc.svg',
  logout: 'f5651.svg', avatar: '8b945.svg', history: '323c2.svg', quote: 'e6bff.svg', favorite: '18909.svg',
  message: 'eed21.svg', product: 'a29e9.svg', service: '026ea.svg', offer: '7465e.svg', publications: 'b5814.svg',
  management: 'd14c1.svg', edit: '9d4b5.svg', save: '40cf8.svg', delete: 'b0f74.svg', alert: '5164f.svg',
  login: 'c2efd.svg', register: 'daec0.svg', heart: '68014.svg', bag: 'd4c70.svg', lock: '33729.svg',
};

export default function DesignIcon({ name, inverse = false }) {
  const { palette } = useTheme();
  const darkOnPrimary = palette.primary.contrastText === palette.text.primary;
  return <Box component="span" aria-hidden="true" sx={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, filter: name === 'avatar' ? 'url(#multiplaza-avatar-colors)' : inverse && !darkOnPrimary ? 'brightness(0) saturate(100%) invert(89%) sepia(18%) saturate(494%) hue-rotate(335deg) brightness(103%)' : 'brightness(0) saturate(100%) invert(5%) sepia(35%) saturate(4244%) hue-rotate(235deg) brightness(90%)' }}>
    <img src={`/assets/figma/${icons[name] || icons.product}`} alt="" style={{ display: 'block' }} />
  </Box>;
}
