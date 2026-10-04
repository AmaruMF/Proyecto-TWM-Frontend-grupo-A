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
  Stack,
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
import { userProfile } from '../../data/initialData';

const drawerWidth = 264;

const navItems = [
  { id: 'dashboard', label: 'Panel principal', icon: <DashboardIcon /> },
  { id: 'clients', label: 'Clientes', icon: <GroupIcon /> },
  { id: 'services', label: 'Servicios', icon: <Inventory2Icon /> },
  { id: 'profile', label: 'Perfil', icon: <PersonIcon /> },
];

function Sidebar({ activeView, onNavigate }) {
  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#0B0829', color: '#F9DFC6' }}>
      <Box sx={{ p: 3 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Avatar sx={{ bgcolor: '#FF8400', color: '#0B0829', width: 42, height: 42, fontWeight: 900 }}>T</Avatar>
          <Box>
            <Typography variant="h3" sx={{ color: '#F9DFC6', fontSize: 19 }}>
              TWM
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(249,223,198,0.68)' }}>
              Gestion operativa
            </Typography>
          </Box>
        </Stack>
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
              color: activeView === item.id ? '#0B0829' : 'rgba(249,223,198,0.78)',
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
            <ListItemText primary={item.label} primaryTypographyProps={{ fontWeight: 700 }} />
          </ListItemButton>
        ))}
      </List>
      <Box sx={{ p: 2 }}>
        <Box sx={{ border: '1px solid rgba(143,160,216,0.32)', borderRadius: 2, p: 2, bgcolor: 'rgba(143,160,216,0.10)' }}>
          <Typography variant="body2" sx={{ color: 'rgba(249,223,198,0.78)' }}>
            Frontend React + MUI con datos simulados en consola.
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

function AppShell({ activeView, onNavigate, onLogout, children }) {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg'));
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
          width: { lg: `calc(100% - ${drawerWidth}px)` },
          ml: { lg: `${drawerWidth}px` },
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: 'rgba(249, 223, 198, 0.92)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <Toolbar sx={{ minHeight: 72, gap: 2 }}>
          {!isDesktop ? (
            <IconButton aria-label="Abrir menu" onClick={() => setMobileOpen(true)}>
              <MenuIcon />
            </IconButton>
          ) : null}
          <Box sx={{ flex: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Proyecto TWM
            </Typography>
            <Typography variant="h3" sx={{ fontSize: 20 }}>
              Administracion del sistema
            </Typography>
          </Box>
          <Button
            color="inherit"
            onClick={(event) => setProfileAnchor(event.currentTarget)}
            endIcon={<KeyboardArrowDownIcon />}
            sx={{ px: 1 }}
          >
            <Avatar sx={{ width: 34, height: 34, mr: 1, bgcolor: '#FF8400', color: '#0B0829', fontWeight: 900 }}>G5</Avatar>
            <Box sx={{ display: { xs: 'none', sm: 'block' }, textAlign: 'left' }}>
              <Typography variant="body2" sx={{ fontWeight: 800, lineHeight: 1.1 }}>
                {userProfile.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {userProfile.role}
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

      <Box component="nav" sx={{ width: { lg: drawerWidth }, flexShrink: { lg: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', lg: 'none' },
            '& .MuiDrawer-paper': { width: drawerWidth, border: 0 },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', lg: 'block' },
            '& .MuiDrawer-paper': { width: drawerWidth, border: 0 },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          ml: { lg: `${drawerWidth}px` },
          pt: { xs: 11, lg: 12 },
          px: { xs: 2, sm: 3, xl: 5 },
          pb: 5,
          minHeight: '100vh',
          background: 'radial-gradient(circle at top right, rgba(143,160,216,0.30), transparent 28%), #F9DFC6',
        }}
      >
        {children}
      </Box>
    </Box>
  );
}

export default AppShell;
