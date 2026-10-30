import { useState } from 'react';
import { AppBar, Badge, Box, Button, Container, Divider, Drawer, IconButton, InputAdornment, List, ListItemButton, ListItemIcon, ListItemText, Menu, MenuItem, Stack, TextField, Typography } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import Brand from '../common/Brand';
import DesignIcon from '../common/DesignIcon';
import useMarketplace from '../../hooks/useMarketplace';
import { navigate } from '../../hooks/useNavigation';
const mainLinks = [['cuenta', 'Mi cuenta', 'account'], ['pedidos', 'Mis pedidos', 'orders'], ['devoluciones', 'Devoluciones y reembolsos', 'bag'], ['transacciones', 'Historial de transacciones', 'history'], ['carrito', 'Carrito', 'cart'], ['cotizaciones', 'Cotizaciones', 'quote'], ['deseos', 'Lista de deseos', 'favorite'], ['mensajes', 'Mensajes', 'message']];
const sellerLinks = [['inventario', 'Productos e inventario', 'product'], ['servicios-vendedor', 'Servicios', 'service'], ['oferta', 'Ofertas', 'offer'], ['publicaciones', 'Publicaciones', 'publications'], ['gestion', 'Gestión de cotizaciones', 'management'], ['clientes', 'Clientes', 'account']];
function Sidebar({
  activeView,
  onNavigate,
  onClose
}) {
  const {
    data,
    session,
    logout
  } = useMarketplace();
  return <Box component="aside" aria-label="Navegación de mi cuenta" sx={{
    display: 'flex',
    flexDirection: 'column',
    minHeight: {
      xs: '100dvh',
      md: 'calc(100dvh - 144px)'
    },
    bgcolor: 'background.default'
  }}>
    <Box sx={{
      py: 3,
      px: 2,
      textAlign: 'center',
      borderBottom: '1px solid',
      borderColor: 'divider',
      position: 'relative'
    }}>
      {onClose && <IconButton onClick={onClose} aria-label="Cerrar menú" sx={{
        position: 'absolute',
        top: 4,
        right: 4
      }}><CloseIcon /></IconButton>}
      <DesignIcon name="avatar" />
      <Typography sx={{
        fontWeight: 800,
        mt: 1
      }}>{data.profile.name} {data.profile.lastName?.slice(0, 1)}.</Typography>
      <Typography color="text.secondary" variant="body2">{session?.role === 'seller' ? 'Vendedor' : 'Cliente'}</Typography>
    </Box>
    <Box sx={{
      p: 1.5,
      flex: 1
    }}>
      <Typography variant="overline" sx={{
        px: 1.5,
        color: 'text.secondary'
      }}>Principales</Typography>
      <List disablePadding>{mainLinks.map(([path, label, icon]) => <ListItemButton key={path} selected={activeView === path || path === 'pedidos' && ['seguimiento', 'postventa'].includes(activeView)} onClick={() => onNavigate(`/${path}`)} sx={{
          my: 0.5,
          borderRadius: 1.5,
          px: 1.5,
          '&.Mui-selected': {
            bgcolor: 'primary.main',
            color: 'primary.contrastText'
          },
          '&.Mui-selected:hover': {
            bgcolor: 'primary.dark'
          }
        }}>
        <ListItemIcon sx={{
            minWidth: 32
          }}><DesignIcon name={icon} inverse={activeView === path || path === 'pedidos' && ['seguimiento', 'postventa'].includes(activeView)} /></ListItemIcon>
        <ListItemText primary={label} slotProps={{
            primary: {
              sx: {
                fontWeight: 700,
                fontSize: 13
              }
            }
          }} />
      </ListItemButton>)}</List>
      {session?.role === 'seller' && <>
        <Typography variant="overline" sx={{
          px: 1.5,
          color: 'text.secondary'
        }}>Vendedor</Typography>
        <List disablePadding>{sellerLinks.map(([path, label, icon]) => <ListItemButton key={path} selected={activeView === path} onClick={() => onNavigate(`/${path}`)} sx={{
            my: 0.5,
            borderRadius: 1.5,
            px: 1.5,
            '&.Mui-selected': {
              bgcolor: 'primary.main',
              color: 'primary.contrastText'
            },
            '&.Mui-selected:hover': {
              bgcolor: 'primary.dark'
            }
          }}>
          <ListItemIcon sx={{
              minWidth: 32
            }}><DesignIcon name={icon} inverse={activeView === path} /></ListItemIcon><ListItemText primary={label} slotProps={{
              primary: {
                sx: {
                  fontWeight: 700,
                  fontSize: 13
                }
              }
            }} />
        </ListItemButton>)}</List>
      </>}
    </Box>
    <Button onClick={logout} startIcon={<DesignIcon name="logout" />} sx={{
      justifyContent: 'flex-start',
      p: 2,
      borderTop: '1px solid',
      borderColor: 'divider',
      borderRadius: 0
    }}>Cerrar sesión</Button>
  </Box>;
}
export default function AppShell({
  activeView,
  accountLayout = false,
  children
}) {
  const {
    session,
    data,
    logout,
    switchRole
  } = useMarketplace();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountAnchor, setAccountAnchor] = useState(null);
  const [query, setQuery] = useState('');
  const handleNavigate = path => {
    navigate(path);
    setMobileOpen(false);
    setAccountAnchor(null);
  };
  const submitSearch = event => {
    event.preventDefault();
    handleNavigate(`/buscar/${encodeURIComponent(query.trim())}`);
  };
  const cartCount = data.cart.reduce((total, item) => total + item.quantity, 0);
  return <Box sx={{
    minHeight: '100dvh',
    bgcolor: 'background.default'
  }}>
    <svg width="0" height="0" aria-hidden="true" style={{ position: 'absolute' }}><defs><filter id="multiplaza-avatar-colors" colorInterpolationFilters="sRGB"><feColorMatrix type="matrix" values="1.335 0 0 0 -0.439 0 0.697 0 0 0.031 0 0 0.747 0 0.100 0 0 0 1 0" /></filter></defs></svg>
    <Box component="a" href="#main-content" onClick={event => {
      event.preventDefault();
      document.getElementById('main-content')?.focus();
    }} sx={{
      position: 'fixed',
      top: -80,
      zIndex: 1600,
      p: 1.5,
      bgcolor: 'primary.main',
      color: 'primary.contrastText',
      '&:focus': {
        top: 0
      }
    }}>Saltar al contenido</Box>
    <AppBar position="sticky" elevation={0} color="inherit" sx={{
      bgcolor: 'primary.main',
      color: 'text.primary',
      borderBottom: '1px solid',
      borderColor: 'divider'
    }}>
      <Container maxWidth="lg" sx={{
        py: {
          xs: 1.5,
          md: 2.5
        }
      }}>
        <Stack direction="row" spacing={{
          xs: 1,
          md: 7
        }} sx={{
          minHeight: {
            xs: 42,
            md: 48
          },
          alignItems: "center"
        }}>
          <IconButton aria-label="Abrir menú" onClick={() => setMobileOpen(true)} sx={{
            display: {
              md: 'none'
            }
          }}><MenuIcon /></IconButton>
          <Brand />
          <Box component="form" role="search" onSubmit={submitSearch} sx={{
            flex: 1,
            display: {
              xs: 'none',
              sm: 'block'
            }
          }}>
            <TextField value={query} onChange={event => setQuery(event.target.value)} placeholder="Buscar productos, servicios y más..." fullWidth slotProps={{
              htmlInput: {
                'aria-label': 'Buscar productos y servicios'
              },
              input: {
                endAdornment: <InputAdornment position="end"><IconButton type="submit" aria-label="Buscar"><DesignIcon name="search" /></IconButton></InputAdornment>
              }
            }} />
          </Box>
        </Stack>
        <Box component="form" role="search" onSubmit={submitSearch} sx={{
          mt: 1.5,
          display: {
            xs: 'block',
            sm: 'none'
          }
        }}><TextField value={query} onChange={event => setQuery(event.target.value)} placeholder="Buscar en Multiplaza" fullWidth slotProps={{
            htmlInput: {
              'aria-label': 'Buscar productos y servicios'
            },
            input: {
              endAdornment: <IconButton type="submit" aria-label="Buscar"><DesignIcon name="search" /></IconButton>
            }
          }} /></Box>
        <Stack direction="row" sx={{
          mt: 1.5,
          gap: 1,
          alignItems: "center",
          justifyContent: "space-between"
        }}>
          <Stack direction="row" spacing={{
            xs: 0,
            md: 1
          }} component="nav" aria-label="Catálogo">
            {[['productos', 'Productos'], ['servicios', 'Servicios'], ['ofertas', 'Ofertas']].map(([path, label]) => <Button key={path} onClick={() => handleNavigate(`/${path}`)} endIcon={<DesignIcon name="chevron" />} sx={{
              '& .MuiButton-endIcon': { display: { xs: 'none', sm: 'inline-flex' } },
              minWidth: 0,
              px: {
                xs: 0.75,
                sm: 1.5
              },
              fontSize: {
                xs: 12,
                sm: 14
              }
            }}>{label}</Button>)}
          </Stack>
          {session ? <Stack direction="row" spacing={1}>
            <Button onClick={event => setAccountAnchor(event.currentTarget)} aria-haspopup="menu" aria-expanded={Boolean(accountAnchor)} startIcon={<DesignIcon name="account" />} sx={{
              minWidth: 0
            }}><Box component="span" sx={{
                display: {
                  xs: 'none',
                  sm: 'inline'
                }
              }}>Mi cuenta</Box></Button>
            <Button onClick={() => handleNavigate('/pedidos')} endIcon={<DesignIcon name="orders" />} sx={{
              display: {
                xs: 'none',
                md: 'inline-flex'
              }
            }}>Mis pedidos</Button>
            <Button onClick={() => handleNavigate('/carrito')} aria-label={`Carrito, ${cartCount} productos`} sx={{
              minWidth: 0
            }}><Box component="span" sx={{
                display: {
                  xs: 'none',
                  md: 'inline'
                },
                mr: 1
              }}>Carrito</Box><Badge badgeContent={cartCount} color="secondary"><DesignIcon name="cart" /></Badge></Button>
          </Stack> : <Button onClick={() => handleNavigate('/acceso')} startIcon={<DesignIcon name="login" />} sx={{
            whiteSpace: 'nowrap',
            fontSize: {
              xs: 11,
              sm: 14
            },
            minWidth: 0,
            px: 0.5
          }}>Iniciar sesión</Button>}
        </Stack>
      </Container>
    </AppBar>
    <Menu anchorEl={accountAnchor} open={Boolean(accountAnchor)} onClose={() => setAccountAnchor(null)}>
      <MenuItem onClick={() => handleNavigate('/cuenta')}>Ver mi perfil</MenuItem>
      <MenuItem onClick={() => handleNavigate('/deseos')}>Lista de deseos</MenuItem>
      <MenuItem onClick={() => handleNavigate('/mensajes')}>Mensajes</MenuItem>
      <MenuItem onClick={() => {
        setAccountAnchor(null);
        switchRole();
      }}>{session?.role === 'seller' ? 'Cambiar a vista cliente' : 'Cambiar a vista vendedor'}</MenuItem>
      <MenuItem onClick={() => handleNavigate('/registro-empresa')}>Registrar mi empresa</MenuItem>
      <Divider />
      <MenuItem onClick={() => {
        setAccountAnchor(null);
        logout();
      }}>Cerrar sesión</MenuItem>
    </Menu>
    <Drawer open={mobileOpen} onClose={() => setMobileOpen(false)} sx={{
      '& .MuiDrawer-paper': {
        width: 280
      }
    }}>
      {session ? <Sidebar activeView={activeView} onNavigate={handleNavigate} onClose={() => setMobileOpen(false)} /> : <Stack spacing={2} sx={{
        p: 3
      }}><Brand compact /><Button onClick={() => handleNavigate('/acceso')}>Iniciar sesión</Button><Button onClick={() => handleNavigate('/registro')}>Crear cuenta</Button></Stack>}
    </Drawer>
    <Box sx={{
      display: accountLayout && session ? {
        md: 'grid'
      } : 'block',
      gridTemplateColumns: '280px minmax(0, 1fr)'
    }}>
      {accountLayout && session && <Box sx={{
        display: {
          xs: 'none',
          md: 'block'
        },
        position: 'sticky',
        top: 144,
        height: 'calc(100dvh - 144px)',
        overflowY: 'auto'
      }}><Sidebar activeView={activeView} onNavigate={handleNavigate} /></Box>}
      <Box component="main" id="main-content" tabIndex={-1} sx={{
        minWidth: 0,
        px: {
          xs: 2,
          sm: 4,
          lg: accountLayout ? 4 : 5
        },
        py: {
          xs: 3,
          md: 5
        },
        outline: 'none'
      }}>
        <Box sx={{
          maxWidth: accountLayout ? 1120 : activeView === 'inicio' && session?.role === 'seller' ? 1248 : 1064,
          mx: 'auto'
        }}>{children}</Box>
      </Box>
    </Box>
  </Box>;
}
