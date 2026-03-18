import { useState } from 'react';
import { 
  Box, AppBar, Toolbar, Typography, Drawer, List, ListItem, 
  ListItemButton, ListItemIcon, ListItemText, IconButton, Avatar, 
  useTheme, useMediaQuery, Divider
} from '@mui/material';
import { 
  Dashboard as DashboardIcon, 
  People as PeopleIcon, 
  DirectionsCar as CarIcon, 
  LocalTaxi as TaxiIcon, 
  AttachMoney as MoneyIcon,
  Menu as MenuIcon,
  Badge as BadgeIcon,
  RateReview as ReviewIcon,
  GpsFixed as GpsIcon,
  CurrencyExchange as TransIcon,
  ExitToApp as LogoutIcon
} from '@mui/icons-material';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';

const drawerWidth = 260;

const menuItems = [
  { text: 'Дашборд', icon: <DashboardIcon />, path: '/dashboard' },
  { type: 'divider' },
  { text: 'Користувачі', icon: <PeopleIcon />, path: '/users' },
  { text: 'Водії', icon: <CarIcon />, path: '/drivers' },
  { text: 'Співробітники', icon: <BadgeIcon />, path: '/employees' },
  { type: 'divider' },
  { text: 'Замовлення', icon: <TaxiIcon />, path: '/orders' },
  { text: 'Фінанси', icon: <TransIcon />, path: '/transactions' },
  { type: 'divider' },
  { text: 'Відгуки', icon: <ReviewIcon />, path: '/reviews' },
  { text: 'GPS Логи', icon: <GpsIcon />, path: '/locations' },
  { text: 'Тарифи', icon: <MoneyIcon />, path: '/tariffs' },
  { text: 'Стежування', icon: <GpsIcon />, path: '/live' },
];

export const Layout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
      <Toolbar sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', letterSpacing: 2 }}>
          <span style={{ color: theme.palette.primary.main }}>S</span>trum
        </Typography>
      </Toolbar>
      <Divider />
      
      <List sx={{ flexGrow: 1, px: 2, py: 2 }}>
        {menuItems.map((item, index) => {
          if (item.type === 'divider') {
            return <Divider key={index} sx={{ my: 1 }} />;
          }

          const isActive = location.pathname === item.path;

          return (
            <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton 
                selected={isActive}
                onClick={() => {
                  navigate(item.path!);
                  if (isMobile) setMobileOpen(false);
                }}
                sx={{
                  borderRadius: 1,
                  '&.Mui-selected': {
                    bgcolor: 'rgba(255, 212, 81, 0.15)',
                    borderLeft: `4px solid ${theme.palette.primary.main}`,
                    '&:hover': { bgcolor: 'rgba(255, 212, 81, 0.25)' },
                  },
                  '&:hover': { bgcolor: 'action.hover' },
                }}
              >
                <ListItemIcon sx={{ 
                  color: isActive ? 'primary.main' : 'text.secondary',
                  minWidth: 40
                }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.text} 
                  primaryTypographyProps={{ 
                    fontWeight: isActive ? 600 : 400,
                    color: isActive ? 'primary.main' : 'text.primary'
                  }} 
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
        <ListItemButton onClick={handleLogout} sx={{ borderRadius: 1, color: 'error.main' }}>
          <ListItemIcon sx={{ color: 'error.main', minWidth: 40 }}>
            <LogoutIcon />
          </ListItemIcon>
          <ListItemText primary="Вихід" />
        </ListItemButton>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar 
        position="fixed" 
        sx={{ 
          width: { sm: `calc(100% - ${drawerWidth}px)` }, 
          ml: { sm: `${drawerWidth}px` },
          boxShadow: 'none',
          bgcolor: 'background.paper',
          color: 'text.primary',
          borderBottom: 1, borderColor: 'divider'
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, color: 'text.primary' }}>
            Панель керування
          </Typography>
          <Box display="flex" alignItems="center" gap={2}>
            <Typography variant="body2" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
              Administrator
            </Typography>
            <Avatar sx={{ bgcolor: 'primary.main', color: 'black', fontWeight: 'bold' }}>A</Avatar>
          </Box>
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, borderRight: 1, borderColor: 'divider' },
          }}
        >
          {drawerContent}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, borderRight: 1, borderColor: 'divider' },
          }}
          open
        >
          {drawerContent}
        </Drawer>
      </Box>

      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1, 
          p: 3, 
          width: { sm: `calc(100% - ${drawerWidth}px)` }, 
          minHeight: '100vh',
          bgcolor: 'background.default'
        }}
      >
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
};