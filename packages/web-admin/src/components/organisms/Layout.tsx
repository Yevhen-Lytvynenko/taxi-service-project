import React, { useMemo, useState } from 'react';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Avatar,
  useTheme,
  useMediaQuery,
  Divider,
  ListSubheader,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Person as PersonIcon,
  DirectionsCar as CarIcon,
  LocalTaxi as TaxiIcon,
  AttachMoney as MoneyIcon,
  Menu as MenuIcon,
  Badge as BadgeIcon,
  RateReview as ReviewIcon,
  GpsFixed as GpsIcon,
  CurrencyExchange as TransIcon,
  TrendingUp as TrendingUpIcon,
  Map as MapAnalyticsIcon,
  DirectionsCar as FleetIcon,
  AccountBalance as FinanceAnalyticsIcon,
  Chat as ChatIcon,
  ExitToApp as LogoutIcon,
  ManageAccounts as ProfileIcon,
  Security as RolesIcon,
  NewReleases as ReleaseIcon,
  Explore as LiveTrackIcon,
  Assessment as AnalyticsOverviewIcon,
  FlagOutlined as ComplaintsIcon,
  HistoryOutlined as AuditIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

import { BrandLogo } from '../BrandLogo';
import { BrandWatermark } from '../BrandWatermark';
import { OutletGuard } from '../OutletGuard';
import { filterMenuByPathAccess, getStoredStaffRole, type MenuRowConfig } from '../../config/menuAccess';

const drawerWidth = 260;

type MenuRowUi =
  | { type: 'divider' }
  | { type: 'subheader'; text: string }
  | { type: 'link'; text: string; icon: React.ReactNode; path: string };

const MENU_TEMPLATE: MenuRowConfig[] = [
  { type: 'subheader', text: 'Операції (ІС)' },
  { type: 'link', text: 'Дашборд', path: '/dashboard' },
  { type: 'link', text: 'Користувачі', path: '/users' },
  { type: 'link', text: 'Клієнти', path: '/clients' },
  { type: 'link', text: 'Водії', path: '/drivers' },
  { type: 'link', text: 'Співробітники', path: '/employees' },
  { type: 'link', text: 'Замовлення', path: '/orders' },
  { type: 'link', text: 'Фінанси (транзакції)', path: '/transactions' },
  { type: 'link', text: 'Чати', path: '/chats' },
  { type: 'link', text: 'Відгуки', path: '/reviews' },
  { type: 'link', text: 'GPS логи', path: '/locations' },
  { type: 'link', text: 'Тарифи', path: '/tariffs' },
  { type: 'link', text: 'Стежування (live)', path: '/live' },
  { type: 'link', text: 'Скарги', path: '/complaints' },
  { type: 'link', text: 'Журнал аудиту', path: '/audit-logs' },

  { type: 'subheader', text: 'Аналітика (демо)' },
  { type: 'link', text: 'Огляд модуля', path: '/analytics' },
  { type: 'link', text: 'Прогноз і піки', path: '/analytics/demand' },
  { type: 'link', text: 'Surge / ціноутворення', path: '/analytics/surge' },
  { type: 'link', text: 'Гео та теплокарти', path: '/analytics/geo' },
  { type: 'link', text: 'Водії та автопарк', path: '/analytics/fleet' },
  { type: 'link', text: 'Фінанси та звіти', path: '/analytics/finance' },

  { type: 'subheader', text: 'Налаштування' },
  { type: 'link', text: 'Профіль', path: '/settings/profile' },
  { type: 'link', text: 'Ролі і доступи', path: '/settings/roles' },
  { type: 'link', text: 'Нотатки релізу', path: '/settings/release-notes' },
];

const ICONS: Record<string, React.ReactNode> = {
  '/dashboard': <DashboardIcon />,
  '/users': <PeopleIcon />,
  '/clients': <PersonIcon />,
  '/drivers': <CarIcon />,
  '/employees': <BadgeIcon />,
  '/orders': <TaxiIcon />,
  '/transactions': <TransIcon />,
  '/chats': <ChatIcon />,
  '/reviews': <ReviewIcon />,
  '/locations': <GpsIcon />,
  '/tariffs': <MoneyIcon />,
  '/live': <LiveTrackIcon />,
  '/complaints': <ComplaintsIcon />,
  '/audit-logs': <AuditIcon />,
  '/analytics': <AnalyticsOverviewIcon />,
  '/analytics/demand': <TrendingUpIcon />,
  '/analytics/surge': <MoneyIcon />,
  '/analytics/geo': <MapAnalyticsIcon />,
  '/analytics/fleet': <FleetIcon />,
  '/analytics/finance': <FinanceAnalyticsIcon />,
  '/settings/profile': <ProfileIcon />,
  '/settings/roles': <RolesIcon />,
  '/settings/release-notes': <ReleaseIcon />,
};

export const Layout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [mobileOpen, setMobileOpen] = useState(false);

  const menuRows = useMemo((): MenuRowUi[] => {
    const role = getStoredStaffRole();
    const filtered = filterMenuByPathAccess(MENU_TEMPLATE, role);
    const out: MenuRowUi[] = [];
    for (const it of filtered) {
      if (it.type === 'divider' || it.type === 'subheader') {
        out.push(it);
      } else {
        out.push({
          type: 'link',
          text: it.text,
          path: it.path,
          icon: ICONS[it.path] ?? <DashboardIcon />,
        });
      }
    }
    return out;
  }, [location.pathname]);

  const headerUser = useMemo(() => {
    try {
      const raw = localStorage.getItem('user');
      const u = raw ? (JSON.parse(raw) as { fullName?: string; username?: string; role?: string }) : {};
      return {
        name: u.fullName || u.username || 'Користувач',
        role: u.role ?? '',
      };
    } catch {
      return { name: 'Користувач', role: '' };
    }
  }, [location.pathname]);

  const avatarLetter = headerUser.name.trim().charAt(0).toUpperCase() || '?';

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
        <BrandLogo size={40} />
      </Toolbar>
      <Divider />
      
      <List sx={{ flexGrow: 1, px: 2, py: 2 }}>
        {menuRows.map((item, index) => {
          if (item.type === 'divider') {
            return <Divider key={`d-${index}`} sx={{ my: 1 }} />;
          }
          if (item.type === 'subheader') {
            return (
              <ListSubheader
                key={`sh-${index}`}
                disableSticky
                sx={{
                  px: 0,
                  mt: 1,
                  mb: 0.5,
                  lineHeight: 1.5,
                  typography: 'overline',
                  color: 'text.secondary',
                  bgcolor: 'transparent',
                }}
              >
                {item.text}
              </ListSubheader>
            );
          }

          const isActive =
            item.path === '/live'
              ? location.pathname === '/live' || location.pathname.startsWith('/live/')
              : item.path === '/analytics'
                ? location.pathname === '/analytics'
                : location.pathname === item.path ||
                  location.pathname.startsWith(`${item.path}/`);

          return (
            <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton 
                selected={isActive}
                onClick={() => {
                  navigate(item.path);
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
    <BrandWatermark
      variant="tile"
      sx={{ minHeight: '100vh', width: '100%', maxWidth: '100vw', overflowX: 'hidden' }}
    >
      <Box sx={{ display: 'flex', width: '100%', minHeight: '100vh' }}>
        <Box component="nav" sx={{ width: { xs: 0, sm: drawerWidth }, flexShrink: 0 }}>
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={handleDrawerToggle}
            ModalProps={{ keepMounted: true }}
            sx={{
              display: { xs: 'block', sm: 'none' },
              '& .MuiDrawer-paper': {
                boxSizing: 'border-box',
                width: drawerWidth,
                borderRight: 1,
                borderColor: 'divider',
              },
            }}
          >
            {drawerContent}
          </Drawer>
          <Drawer
            variant="permanent"
            sx={{
              display: { xs: 'none', sm: 'block' },
              '& .MuiDrawer-paper': {
                boxSizing: 'border-box',
                width: drawerWidth,
                borderRight: 1,
                borderColor: 'divider',
              },
            }}
            open
          >
            {drawerContent}
          </Drawer>
        </Box>

        <Box
          sx={{
            flex: 1,
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            minHeight: '100vh',
          }}
        >
          <AppBar
            position="static"
            elevation={0}
            sx={{
              width: '100%',
              flexShrink: 0,
              bgcolor: 'background.paper',
              color: 'text.primary',
              borderBottom: 1,
              borderColor: 'divider',
            }}
          >
            <Toolbar disableGutters sx={{ minHeight: { xs: 56, sm: 64 }, px: { xs: 1.5, sm: 2 } }}>
              <IconButton
                color="inherit"
                edge="start"
                onClick={handleDrawerToggle}
                sx={{ mr: 2, display: { sm: 'none' } }}
              >
                <MenuIcon />
              </IconButton>
              <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
                <BrandLogo size={28} showName={false} sx={{ display: { xs: 'none', sm: 'flex' } }} />
                <Typography variant="h6" noWrap component="div" sx={{ color: 'text.primary' }}>
                  Панель керування
                </Typography>
              </Box>
              <Box display="flex" alignItems="center" gap={2}>
                <Typography variant="body2" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
                  {headerUser.name}
                  {headerUser.role ? ` · ${headerUser.role}` : ''}
                </Typography>
                <Avatar sx={{ bgcolor: 'primary.main', color: 'black', fontWeight: 'bold' }}>{avatarLetter}</Avatar>
              </Box>
            </Toolbar>
          </AppBar>

          <Box
            component="main"
            sx={{
              flex: 1,
              minWidth: 0,
              px: 3,
              pb: 3,
              pt: 2,
              bgcolor: 'background.default',
              boxSizing: 'border-box',
            }}
          >
            <OutletGuard />
          </Box>
        </Box>
      </Box>
    </BrandWatermark>
  );
};