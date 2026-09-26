import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Button,
  Box,
  ThemeProvider,
  createTheme,
  Chip,
  Stack,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Divider,
  useMediaQuery,
  Menu,
  MenuItem,
  Avatar
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import HomeIcon from '@mui/icons-material/Home';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import WarningIcon from '@mui/icons-material/Warning';
import MapIcon from '@mui/icons-material/Map';
import RecordVoiceOverIcon from '@mui/icons-material/RecordVoiceOver';
import HistoryIcon from '@mui/icons-material/History';
import PersonIcon from '@mui/icons-material/Person';
import TranslateIcon from '@mui/icons-material/Translate';
import LogoutIcon from '@mui/icons-material/Logout';

// Import pages
import HomePage from './pages/HomePage';
import PredictPage from './pages/PredictPage';
import EarlyWarningPage from './pages/EarlyWarningPage';
import VoicePage from './pages/VoicePage';
import HistoryPage from './pages/HistoryPage';
import MapPage from './pages/MapPage';
import LoginPage from './pages/LoginPage';

// Import context
import { FarmerProvider, useFarmer } from './context/FarmerContext';

// Agriculture Theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#2E7D32', // Dark green
      dark: '#1B5E20',
      light: '#4CAF50', // Bright green
    },
    secondary: {
      main: '#FF9800', // Accent orange
      dark: '#E65100',
      light: '#FFB74D',
    },
    background: {
      default: '#FAFAFA',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#1A1A1A',
      secondary: '#666666',
    },
  },
  typography: {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    h1: { fontFamily: "'Poppins', sans-serif", fontWeight: 700 },
    h2: { fontFamily: "'Poppins', sans-serif", fontWeight: 700 },
    h3: { fontFamily: "'Poppins', sans-serif", fontWeight: 700 },
    h4: { fontFamily: "'Poppins', sans-serif", fontWeight: 600 },
    h5: { fontFamily: "'Poppins', sans-serif", fontWeight: 600 },
    h6: { fontFamily: "'Poppins', sans-serif", fontWeight: 600 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  shape: {
    borderRadius: 12,
  },
});

// Coming Soon placeholder for map
const ComingSoonPage = ({ title }: { title: string }) => (
  <Box sx={{ mt: 6, textAlign: 'center', py: 8 }}>
    <Typography variant="h2" gutterBottom>
      🗺️
    </Typography>
    <Typography variant="h4" gutterBottom sx={{ color: '#2E7D32', fontWeight: 700 }}>
      {title}
    </Typography>
    <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 500, mx: 'auto', mt: 1, mb: 4 }}>
      Real-time community disease outbreak map reporting will be activated here in the next step.
    </Typography>
    <Button variant="contained" component={Link} to="/" sx={{ bgcolor: '#2E7D32' }}>
      Back to Home
    </Button>
  </Box>
);

// Professional, Clean, Sticky Navbar
const NavigationBar: React.FC<{ language: string; setLanguage: (l: string) => void }> = ({
  language,
  setLanguage
}) => {
  const { farmer, isLoggedIn, logout } = useFarmer();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileAnchorEl, setProfileAnchorEl] = useState<null | HTMLElement>(null);
  const isMobile = useMediaQuery(theme.breakpoints.down('lg'));
  const isHindi = language === 'hi';

  const navLinks = [
    { title: isHindi ? 'होम' : 'Home', path: '/', icon: <HomeIcon fontSize="small" /> },
    { title: isHindi ? 'रोग पहचान' : 'Detect Disease', path: '/predict', icon: <CameraAltIcon fontSize="small" /> },
    { title: isHindi ? 'पूर्व चेतावनी' : 'Early Warning', path: '/early-warning', icon: <WarningIcon fontSize="small" /> },
    { title: isHindi ? 'रोग मानचित्र' : 'Disease Map', path: '/map', icon: <MapIcon fontSize="small" /> },
    { title: isHindi ? 'आवाज सहायता' : 'Voice Assistant', path: '/voice', icon: <RecordVoiceOverIcon fontSize="small" /> },
    { title: isHindi ? 'किसान रिकॉर्ड' : 'Farm Records', path: '/history', icon: <HistoryIcon fontSize="small" /> },
  ];

  return (
    <AppBar
      position="sticky"
      sx={{
        bgcolor: '#FFFFFF',
        color: '#1A1A1A',
        boxShadow: '0 2px 14px rgba(0,0,0,0.06)',
        borderBottom: '1px solid #ECEFF1',
        zIndex: 1100
      }}
    >
      <Container maxWidth="xl">
        <Toolbar disableGutters sx={{ minHeight: 70, display: 'flex', justifyContent: 'space-between' }}>
          {/* Logo */}
          <Box
            component={Link}
            to="/"
            sx={{
              display: 'flex',
              alignItems: 'center',
              textDecoration: 'none',
              color: '#2E7D32',
              fontWeight: 800,
              fontSize: { xs: '1.4rem', sm: '1.6rem' },
              fontFamily: "'Poppins', sans-serif"
            }}
          >
            🌾 CropSafe
          </Box>

          {/* Desktop Navigation Links */}
          {!isMobile && (
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              {navLinks.map((item) => {
                const active = location.pathname === item.path;
                return (
                  <Button
                    key={item.path}
                    component={Link}
                    to={item.path}
                    sx={{
                      color: active ? '#2E7D32' : '#555555',
                      bgcolor: active ? '#E8F5E9' : 'transparent',
                      fontWeight: active ? 700 : 500,
                      fontSize: '0.95rem',
                      px: 2,
                      py: 0.8,
                      borderRadius: 3,
                      '&:hover': {
                        bgcolor: active ? '#E8F5E9' : '#F5F5F5',
                        color: '#2E7D32'
                      }
                    }}
                  >
                    {item.title}
                  </Button>
                );
              })}
            </Stack>
          )}

          {/* Right Action Controls */}
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
            {/* Clear Segmented Language Switcher */}
            <Box
              id="navbar-language-switcher"
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                bgcolor: '#F1F8E9',
                borderRadius: 4,
                p: '3px',
                border: '1px solid #C8E6C9'
              }}
            >
              <Button
                id="lang-btn-en"
                size="small"
                onClick={() => setLanguage('en')}
                sx={{
                  borderRadius: 3,
                  px: 1.3,
                  py: 0.4,
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  minWidth: 'auto',
                  textTransform: 'none',
                  bgcolor: language === 'en' ? '#2E7D32' : 'transparent',
                  color: language === 'en' ? '#FFFFFF' : '#2E7D32',
                  boxShadow: language === 'en' ? '0 2px 6px rgba(46, 125, 50, 0.25)' : 'none',
                  '&:hover': {
                    bgcolor: language === 'en' ? '#1B5E20' : '#E8F5E9'
                  }
                }}
              >
                🇬🇧 English
              </Button>
              <Button
                id="lang-btn-hi"
                size="small"
                onClick={() => setLanguage('hi')}
                sx={{
                  borderRadius: 3,
                  px: 1.3,
                  py: 0.4,
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  minWidth: 'auto',
                  textTransform: 'none',
                  bgcolor: language === 'hi' ? '#2E7D32' : 'transparent',
                  color: language === 'hi' ? '#FFFFFF' : '#2E7D32',
                  boxShadow: language === 'hi' ? '0 2px 6px rgba(46, 125, 50, 0.25)' : 'none',
                  '&:hover': {
                    bgcolor: language === 'hi' ? '#1B5E20' : '#E8F5E9'
                  }
                }}
              >
                🇮🇳 हिन्दी
              </Button>
            </Box>

            {/* Farmer Profile or Login Button */}
            {isLoggedIn ? (
              <Box sx={{ display: { xs: 'none', sm: 'inline-flex' } }}>
                <Button
                  id="farmer-profile-button"
                  onClick={(e) => setProfileAnchorEl(e.currentTarget)}
                  variant="outlined"
                  size="small"
                  sx={{
                    borderColor: '#A5D6A7',
                    bgcolor: '#F1F8E9',
                    color: '#1B5E20',
                    fontWeight: 700,
                    borderRadius: 4,
                    px: 1.8,
                    py: 0.7,
                    textTransform: 'none',
                    alignItems: 'center',
                    gap: 1,
                    '&:hover': { bgcolor: '#E8F5E9', borderColor: '#2E7D32' }
                  }}
                  startIcon={
                    <Avatar sx={{ width: 26, height: 26, bgcolor: '#2E7D32', fontSize: '0.8rem', fontWeight: 800 }}>
                      {farmer?.name ? farmer.name.charAt(0).toUpperCase() : '👨‍🌾'}
                    </Avatar>
                  }
                >
                  {farmer?.name || farmer?.phone || (isHindi ? 'किसान खाता' : 'Farmer')}
                </Button>

                <Menu
                  id="farmer-profile-menu"
                  anchorEl={profileAnchorEl}
                  open={Boolean(profileAnchorEl)}
                  onClose={() => setProfileAnchorEl(null)}
                  PaperProps={{
                    elevation: 4,
                    sx: { borderRadius: 3, minWidth: 230, mt: 1, p: 0.5 }
                  }}
                  transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                  anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                >
                  <Box sx={{ px: 2, py: 1.5, bgcolor: '#F9FBE7', borderRadius: 2, mb: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#1B5E20' }}>
                      🌾 {farmer?.name || (isHindi ? 'किसान खाता' : 'Farmer Account')}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                      📞 +91 {farmer?.phone}
                    </Typography>
                    {farmer?.location_name && (
                      <Typography variant="caption" color="text.secondary" display="block">
                        📍 {farmer.location_name}
                      </Typography>
                    )}
                  </Box>

                  <MenuItem
                    component={Link}
                    to="/history"
                    onClick={() => setProfileAnchorEl(null)}
                    sx={{ borderRadius: 1.5, gap: 1.5, fontSize: '0.9rem' }}
                  >
                    <HistoryIcon fontSize="small" sx={{ color: '#2E7D32' }} />
                    {isHindi ? 'मेरे फार्म रिकॉर्ड' : 'My Farm Records'}
                  </MenuItem>

                  <MenuItem
                    component={Link}
                    to="/map"
                    onClick={() => setProfileAnchorEl(null)}
                    sx={{ borderRadius: 1.5, gap: 1.5, fontSize: '0.9rem' }}
                  >
                    <MapIcon fontSize="small" sx={{ color: '#2E7D32' }} />
                    {isHindi ? 'रोग मानचित्र व अलर्ट' : 'Outbreak Map & Alerts'}
                  </MenuItem>

                  <Divider sx={{ my: 0.5 }} />

                  <MenuItem
                    onClick={() => {
                      setProfileAnchorEl(null);
                      logout();
                    }}
                    sx={{ borderRadius: 1.5, gap: 1.5, fontSize: '0.9rem', color: '#D32F2F', fontWeight: 600 }}
                  >
                    <LogoutIcon fontSize="small" />
                    {isHindi ? 'लॉगआउट करें' : 'Log Out'}
                  </MenuItem>
                </Menu>
              </Box>
            ) : (
              <Button
                id="navbar-login-btn"
                component={Link}
                to="/login"
                variant="text"
                startIcon={<PersonIcon />}
                sx={{
                  color: '#2E7D32',
                  fontWeight: 700,
                  display: { xs: 'none', sm: 'inline-flex' },
                  borderRadius: 3,
                  px: 1.8,
                  py: 0.8,
                  '&:hover': { bgcolor: '#E8F5E9' }
                }}
              >
                {isHindi ? 'लॉगिन' : 'Login'}
              </Button>
            )}

            {/* Get Started Button */}
            <Button
              variant="contained"
              component={Link}
              to="/predict"
              sx={{
                bgcolor: '#2E7D32',
                '&:hover': { bgcolor: '#1B5E20' },
                color: '#FFFFFF',
                fontWeight: 700,
                borderRadius: 4,
                px: { xs: 2, sm: 2.8 },
                py: 0.9,
                fontSize: '0.95rem',
                boxShadow: '0 4px 12px rgba(46, 125, 50, 0.25)',
                display: { xs: 'none', sm: 'inline-flex' }
              }}
            >
              {isHindi ? 'शुरू करें' : 'Get Started'}
            </Button>

            {/* Mobile Hamburger Menu Icon */}
            {isMobile && (
              <IconButton onClick={() => setMobileOpen(true)} sx={{ color: '#2E7D32' }}>
                <MenuIcon />
              </IconButton>
            )}
          </Stack>
        </Toolbar>
      </Container>

      {/* Mobile Drawer */}
      <Drawer
        anchor="right"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        PaperProps={{ sx: { width: 280, p: 2 } }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 800, color: '#2E7D32' }}>
            🌾 CropSafe
          </Typography>
          <IconButton onClick={() => setMobileOpen(false)}>
            <CloseIcon />
          </IconButton>
        </Box>
        <Divider sx={{ mb: 2 }} />

        <List>
          {navLinks.map((item) => (
            <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                component={Link}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                sx={{
                  borderRadius: 2,
                  bgcolor: location.pathname === item.path ? '#E8F5E9' : 'transparent',
                  color: location.pathname === item.path ? '#2E7D32' : 'inherit',
                  fontWeight: location.pathname === item.path ? 700 : 500
                }}
              >
                <ListItemIcon sx={{ color: location.pathname === item.path ? '#2E7D32' : 'inherit', minWidth: 36 }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.title} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>

        <Stack spacing={1.5}>
          {/* Mobile Drawer Language Switcher */}
          <Box sx={{ display: 'flex', bgcolor: '#F1F8E9', borderRadius: 3, p: '3px', border: '1px solid #C8E6C9', mb: 1 }}>
            <Button
              size="small"
              fullWidth
              onClick={() => setLanguage('en')}
              sx={{
                borderRadius: 2.5,
                py: 0.6,
                fontWeight: 700,
                fontSize: '0.85rem',
                bgcolor: language === 'en' ? '#2E7D32' : 'transparent',
                color: language === 'en' ? '#FFFFFF' : '#2E7D32'
              }}
            >
              🇬🇧 English
            </Button>
            <Button
              size="small"
              fullWidth
              onClick={() => setLanguage('hi')}
              sx={{
                borderRadius: 2.5,
                py: 0.6,
                fontWeight: 700,
                fontSize: '0.85rem',
                bgcolor: language === 'hi' ? '#2E7D32' : 'transparent',
                color: language === 'hi' ? '#FFFFFF' : '#2E7D32'
              }}
            >
              🇮🇳 हिन्दी
            </Button>
          </Box>
          <Button
            variant="contained"
            component={Link}
            to="/predict"
            onClick={() => setMobileOpen(false)}
            fullWidth
            sx={{ bgcolor: '#2E7D32', borderRadius: 3, py: 1 }}
          >
            {isHindi ? 'अभी स्कैन करें' : 'Get Started'}
          </Button>

          {isLoggedIn ? (
            <Box sx={{ p: 1.5, bgcolor: '#F1F8E9', borderRadius: 2, border: '1px solid #C5E1A5' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#1B5E20' }}>
                👨‍🌾 {farmer?.name || farmer?.phone}
              </Typography>
              {farmer?.location_name && (
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                  📍 {farmer.location_name}
                </Typography>
              )}
              <Button
                variant="outlined"
                color="error"
                size="small"
                fullWidth
                startIcon={<LogoutIcon />}
                onClick={() => {
                  logout();
                  setMobileOpen(false);
                }}
                sx={{ borderRadius: 2, mt: 0.5, fontWeight: 600 }}
              >
                {isHindi ? 'लॉगआउट करें' : 'Log Out'}
              </Button>
            </Box>
          ) : (
            <Button
              variant="outlined"
              component={Link}
              to="/login"
              onClick={() => setMobileOpen(false)}
              fullWidth
              startIcon={<PersonIcon />}
              sx={{ borderColor: '#2E7D32', color: '#2E7D32', borderRadius: 3, py: 1, fontWeight: 700 }}
            >
              {isHindi ? 'किसान लॉगिन' : 'Farmer Login'}
            </Button>
          )}
        </Stack>
      </Drawer>
    </AppBar>
  );
};

function App() {
  const [language, setLanguageState] = useState<'en' | 'hi'>(() => {
    const saved = localStorage.getItem('cropsafe_language');
    return saved === 'hi' ? 'hi' : 'en';
  });

  const setLanguage = (lang: string) => {
    const valid = lang === 'hi' ? 'hi' : 'en';
    setLanguageState(valid);
    localStorage.setItem('cropsafe_language', valid);
  };

  return (
    <ThemeProvider theme={theme}>
      <FarmerProvider language={language}>
        <Router>
          <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: '#FAFAFA' }}>
            <NavigationBar language={language} setLanguage={setLanguage} />

            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <Routes>
                <Route path="/" element={<HomePage language={language} />} />
                <Route path="/login" element={<LoginPage language={language} />} />
                <Route
                  path="/predict"
                  element={
                    <Container maxWidth="xl" sx={{ mt: 3, mb: 4, flex: 1 }}>
                      <PredictPage language={language} setLanguage={setLanguage} />
                    </Container>
                  }
                />
                <Route
                  path="/early-warning"
                  element={
                    <Container maxWidth="xl" sx={{ mt: 3, mb: 4, flex: 1 }}>
                      <EarlyWarningPage language={language} setLanguage={setLanguage} />
                    </Container>
                  }
                />
                <Route
                  path="/history"
                  element={
                    <Container maxWidth="xl" sx={{ mt: 3, mb: 4, flex: 1 }}>
                      <HistoryPage language={language} />
                    </Container>
                  }
                />
                <Route
                  path="/map"
                  element={
                    <Container maxWidth="xl" sx={{ mt: 3, mb: 4, flex: 1 }}>
                      <MapPage language={language} />
                    </Container>
                  }
                />
                <Route
                  path="/voice"
                  element={
                    <Container maxWidth="xl" sx={{ mt: 3, mb: 4, flex: 1 }}>
                      <VoicePage language={language} setLanguage={setLanguage} />
                    </Container>
                  }
                />
              </Routes>
            </Box>
          </Box>
        </Router>
      </FarmerProvider>
    </ThemeProvider>
  );
}

export default App;