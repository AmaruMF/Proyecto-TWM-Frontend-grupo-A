import { useState } from 'react';
import {
  AppBar,
  Avatar,
  Box,
  Button,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Toolbar,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import DashboardIcon from '@mui/icons-material/Dashboard';
import GroupIcon from '@mui/icons-material/Group';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import MenuIcon from '@mui/icons-material/Menu';
import PersonIcon from '@mui/icons-material/Person';
import LogoutIcon from '@mui/icons-material/Logout';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import logo from '../../assets/figma/twm-logo.svg';

const navItems = [
  { id: 'dashboard', label: 'Inicio', icon: <DashboardIcon /> },
  { id: 'clients', label: 'Clientes', icon: <GroupIcon /> },
  { id: 'services', label: 'Servicios', icon: <Inventory2Icon /> },
  { id: 'profile', label: 'Perfil', icon: <PersonIcon /> },
];

function Sidebar({ activeView, onNavigate }) {
  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#0B0829', color: '#FFFDF9' }}>
      <Box sx={{ p: 3 }}>
        <Typography sx={{ color: '#F9DFC6', fontWeight: 900, fontSize: 22 }}>Menú</Typography>
        <Typography variant="body2" sx={{ color: 'rgba(255,253,249,0.62)', mt: 0.5 }}>Navegación del proyecto</Typography>
      </Box>
      <Divider sx={{ borderColor: 'rgba(249,223,198,0.18)' }} />
      <List sx={{ px: 1.5, py: 2, flex: 1 }}>
        {navItems.map((item) => (
          <ListItemButton
            key={item.id}
            selected={activeView === item.id}
            onClick={() => onNavigate(item.id)}
            sx={{
              borderRadius: 2,
              mb: 0.75,
              color: activeView === item.id ? '#0B0829' : 'rgba(255,253,249,0.78)',
              '&.Mui-selected': {
                bgcolor: '#FF8400',
              },
              '&.Mui-selected:hover': {
                bgcolor: '#F9DFC6',
              },
              '&:hover': {
                bgcolor: 'rgba(143,160,216,0.16)',
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 40, color: 'inherit' }}>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} slotProps={{ primary: { sx: { fontWeight: 700 } } }} />
          </ListItemButton>
        ))}
      </List>
    </Box>
  );
}

function AppShell({ activeView, onNavigate, onLogout, children }) {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileAnchor, setProfileAnchor] = useState(null);

  const handleNavigate = (view) => {
    onNavigate(view);
    setMobileOpen(false);
  };

  const drawer = <Sidebar activeView={activeView} onNavigate={handleNavigate} />;

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar
        position="fixed"
        color="inherit"
        elevation={0}
        sx={{
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: 'rgba(255, 250, 245, 0.96)',
          backdropFilter: 'blur(12px)',
          color: '#0B0829',
        }}
      >
        <Toolbar sx={{ minHeight: 72, gap: { xs: 1, md: 2.5 }, px: { xs: 2, md: 6 } }}>
          <IconButton aria-label="Ir al inicio" onClick={() => onNavigate('dashboard')} sx={{ width: 62, height: 62, p: 0, borderRadius: 0, flexShrink: 0 }}>
            <Box component="img" src={logo} alt="TWM" sx={{ width: 62, height: 62, objectFit: 'contain' }} />
          </IconButton>
          <Button
            onClick={() => setMobileOpen(true)}
            startIcon={<MenuIcon />}
            sx={{ display: { xs: 'none', md: 'inline-flex' }, fontSize: 18, color: '#0B0829', minWidth: 0, px: 0, mr: 2 }}
          >
            Menú
          </Button>
          {!isDesktop ? <IconButton aria-label="Abrir menu" onClick={() => setMobileOpen(true)}><MenuIcon /></IconButton> : null}
          <Box sx={{ flex: { xs: 1, md: 0 } }} />
          <Button
            color="inherit"
            onClick={(event) => setProfileAnchor(event.currentTarget)}
            endIcon={<KeyboardArrowDownIcon />}
            sx={{ px: 1.5, border: '1px solid #EADFD5', borderRadius: 99, minHeight: 40 }}
          >
            <Avatar sx={{ width: 24, height: 24, mr: 1, bgcolor: '#FF8400', color: '#0B0829', fontWeight: 900, fontSize: 12 }}>G5</Avatar>
            <Box sx={{ display: { xs: 'none', sm: 'block' }, textAlign: 'left' }}>
              <Typography variant="body2" sx={{ fontWeight: 800, lineHeight: 1.1 }}>
                Mi cuenta
              </Typography>
            </Box>
          </Button>
          <Menu
            anchorEl={profileAnchor}
            open={Boolean(profileAnchor)}
            onClose={() => setProfileAnchor(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          >
            <MenuItem onClick={() => { setProfileAnchor(null); onNavigate('profile'); }}>
              <ListItemIcon>
                <PersonIcon fontSize="small" />
              </ListItemIcon>
              Ver perfil
            </MenuItem>
            <MenuItem onClick={onLogout}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              Cerrar sesion
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Box component="nav">
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{ '& .MuiDrawer-paper': { width: 264, border: 0 } }}
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          pt: { xs: 11, md: 14 },
          px: { xs: 2, sm: 4, lg: 7 },
          pb: 7,
          minHeight: '100vh',
          background: '#F6F4ED',
        }}
      >
        {children}
      </Box>
    </Box>
  );
}

export default AppShell;
