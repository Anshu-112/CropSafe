import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Stack,
  Alert,
  CircularProgress,
  Chip,
  Divider,
  Card,
  CardContent,
  Avatar
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import PhoneIphoneIcon from '@mui/icons-material/PhoneIphone';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SecurityIcon from '@mui/icons-material/Security';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import HistoryEduIcon from '@mui/icons-material/HistoryEdu';
import { useFarmer } from '../context/FarmerContext';

interface LoginPageProps {
  language?: 'en' | 'hi';
}

const DEMO_FARMERS = [
  { name: 'Pravinbhai Patel', phone: '9898123456', location: 'Padra, Vadodara, Gujarat' },
  { name: 'Rajesh Kumar', phone: '9812345678', location: 'Karnal, Haryana' },
  { name: 'Harpreet Singh', phone: '9876543210', location: 'Ludhiana, Punjab' }
];

export const LoginPage: React.FC<LoginPageProps> = ({ language = 'en' }) => {
  const isHindi = language === 'hi';
  const { login, isLoggedIn, farmer, logout } = useFarmer();
  const navigate = useNavigate();
  const location = useLocation();

  // Determine return redirect destination
  const from = (location.state as any)?.from || '/history';

  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [locationName, setLocationName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only accept numbers up to 10 digits
    const val = e.target.value.replace(/\D/g, '').slice(0, 10);
    setPhone(val);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (phone.length !== 10) {
      setError(
        isHindi
          ? 'कृपया मान्य 10 अंकों का मोबाइल नंबर दर्ज करें।'
          : 'Please enter a valid 10-digit mobile number.'
      );
      return;
    }

    setLoading(true);
    const success = await login(phone, name, locationName);
    setLoading(false);

    if (success) {
      navigate(from, { replace: true });
    } else {
      setError(
        isHindi
          ? 'लॉगिन विफल रहा। कृपया इंटरनेट कनेक्शन या नंबर की पुनः जांच करें।'
          : 'Login failed. Please check your mobile number or server status.'
      );
    }
  };

  const handleQuickDemo = async (demo: typeof DEMO_FARMERS[0]) => {
    setPhone(demo.phone);
    setName(demo.name);
    setLocationName(demo.location);
    setError(null);
    setLoading(true);
    const success = await login(demo.phone, demo.name, demo.location);
    setLoading(false);
    if (success) {
      navigate(from, { replace: true });
    }
  };

  // If already logged in, offer to switch user or continue to dashboard
  if (isLoggedIn && farmer) {
    return (
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Paper
          elevation={4}
          sx={{
            p: 4,
            borderRadius: 4,
            textAlign: 'center',
            bgcolor: '#FFFFFF',
            border: '1px solid #E0E0E0'
          }}
        >
          <Avatar
            sx={{
              width: 72,
              height: 72,
              bgcolor: '#2E7D32',
              mx: 'auto',
              mb: 2,
              fontSize: '2rem'
            }}
          >
            👨‍🌾
          </Avatar>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#2E7D32', mb: 1 }}>
            {isHindi ? 'आप पहले से लॉगिन हैं' : 'You are Already Logged In'}
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            {isHindi ? 'वर्तमान सक्रिय किसान खाता:' : 'Active Farmer Account:'}
          </Typography>

          <Card variant="outlined" sx={{ mb: 4, borderRadius: 3, bgcolor: '#F1F8E9', borderColor: '#C5E1A5' }}>
            <CardContent sx={{ py: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#1B5E20' }}>
                {farmer.name || (isHindi ? 'पंजीकृत किसान' : 'Registered Farmer')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                📞 +91 {farmer.phone}
              </Typography>
              {farmer.location_name && (
                <Typography variant="body2" color="text.secondary">
                  📍 {farmer.location_name}
                </Typography>
              )}
            </CardContent>
          </Card>

          <Stack spacing={2}>
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate('/history')}
              sx={{ bgcolor: '#2E7D32', '&:hover': { bgcolor: '#1B5E20' }, py: 1.3, borderRadius: 3, fontWeight: 700 }}
            >
              {isHindi ? '📋 मेरे फार्म रिकॉर्ड देखें' : '📋 View My Farm Records'}
            </Button>
            <Button
              variant="outlined"
              size="large"
              onClick={() => navigate('/')}
              sx={{ borderColor: '#2E7D32', color: '#2E7D32', py: 1.2, borderRadius: 3 }}
            >
              {isHindi ? '← मुख्य पृष्ठ पर जाएँ' : '← Back to Home'}
            </Button>
            <Button
              variant="text"
              color="error"
              onClick={logout}
              sx={{ fontWeight: 600 }}
            >
              {isHindi ? 'लॉगआउट करें (दूसरे नंबर से लॉगिन करें)' : 'Log Out (Sign In with Another Phone)'}
            </Button>
          </Stack>
        </Paper>
      </Container>
    );
  }

  return (
    <Box
      sx={{
        minHeight: 'calc(100vh - 140px)',
        display: 'flex',
        alignItems: 'center',
        py: { xs: 4, md: 6 },
        background: 'linear-gradient(135deg, #F1F8E9 0%, #E8F5E9 50%, #FAFAFA 100%)'
      }}
    >
      <Container maxWidth="lg">
        {/* Back Button */}
        <Box sx={{ mb: 3 }}>
          <Button
            component={Link}
            to="/"
            startIcon={<ArrowBackIcon />}
            sx={{ color: '#2E7D32', fontWeight: 600 }}
          >
            {isHindi ? 'मुख्य पृष्ठ पर वापस' : 'Back to Home'}
          </Button>
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '5fr 7fr' }, gap: 4, alignItems: 'stretch' }}>
          {/* Left Column: Farmer Benefits */}
          <Box>
            <Box
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                p: { xs: 3, md: 4 },
                bgcolor: '#2E7D32',
                color: '#FFFFFF',
                borderRadius: 4,
                boxShadow: '0 8px 32px rgba(46, 125, 50, 0.25)'
              }}
            >
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                  <Avatar sx={{ bgcolor: '#FFFFFF', color: '#2E7D32', width: 48, height: 48, fontSize: '1.5rem' }}>
                    🌾
                  </Avatar>
                  <Box>
                    <Typography variant="h5" sx={{ fontWeight: 800, fontFamily: "'Poppins', sans-serif" }}>
                      CropSafe
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#C8E6C9', letterSpacing: 0.5 }}>
                      {isHindi ? 'स्मार्ट किसान डिजिटल साथी' : 'Smart Farmer Digital Companion'}
                    </Typography>
                  </Box>
                </Box>

                <Typography variant="h4" sx={{ fontWeight: 800, mb: 2, lineHeight: 1.2 }}>
                  {isHindi ? 'किसान खाता व सुरक्षित लॉगिन' : 'Farmer Profile & Safe Access'}
                </Typography>

                <Typography variant="body1" sx={{ color: '#E8F5E9', mb: 4, fontSize: '1.05rem' }}>
                  {isHindi
                    ? 'अपने खेत के रोग निदान, पर्चे और 30-40 किमी के आपातकालीन अलर्ट प्राप्त करने के लिए केवल अपना मोबाइल नंबर दर्ज करें।'
                    : 'Access your crop diagnosis history, prescriptions, and local 30–40 km emergency outbreak warnings.'}
                </Typography>

                {/* Benefits List */}
                <Stack spacing={2.5}>
                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                    <HistoryEduIcon sx={{ color: '#FFD54F', mt: 0.3 }} />
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                        {isHindi ? 'निदान व पर्चा इतिहास' : 'Digital Farm Records'}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#C8E6C9' }}>
                        {isHindi
                          ? 'सभी पुराने रोग स्कैन और दवाइयों की खुराक हमेशा सुरक्षित।'
                          : 'Save AI disease scans, symptom photos, and treatment advice.'}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                    <NotificationsActiveIcon sx={{ color: '#FFD54F', mt: 0.3 }} />
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                        {isHindi ? '30–40 किमी आपातकालीन अलर्ट' : '30–40 km Emergency Alerts'}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#C8E6C9' }}>
                        {isHindi
                          ? 'आसपास के खेतों में रोग फैलते ही SMS व WhatsApp पर सूचना।'
                          : 'Get real-time SMS and WhatsApp alerts when diseases strike nearby.'}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                    <SecurityIcon sx={{ color: '#FFD54F', mt: 0.3 }} />
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                        {isHindi ? 'सरल व पासवर्ड-मुक्त' : 'Simple & Passwordless'}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#C8E6C9' }}>
                        {isHindi
                          ? 'कोई पासवर्ड याद रखने की जरूरत नहीं, केवल 10 अंकों का फोन नंबर।'
                          : 'No complicated passwords. Fast, secure access with just your phone number.'}
                      </Typography>
                    </Box>
                  </Box>
                </Stack>
              </Box>

              {/* Helpline Footnote */}
              <Box sx={{ mt: 4, pt: 3, borderTop: '1px solid rgba(255,255,255,0.2)' }}>
                <Typography variant="caption" sx={{ color: '#E8F5E9' }}>
                  📞 {isHindi ? 'राष्ट्रीय किसान हेल्पलाइन' : 'Kisan Call Center'}: 1800-180-1551
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Right Column: Dedicated Login Form */}
          <Box>
            <Paper
              elevation={3}
              sx={{
                p: { xs: 3, sm: 5 },
                borderRadius: 4,
                bgcolor: '#FFFFFF',
                border: '1px solid #ECEFF1',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center'
              }}
            >
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#1B5E20', mb: 1 }}>
                {isHindi ? 'लॉगिन / नया किसान खाता' : 'Farmer Login / Registration'}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {isHindi
                  ? 'अपना 10 अंकों का मोबाइल नंबर दर्ज करें और तुरंत शुरू करें।'
                  : 'Enter your 10-digit mobile number to access your account.'}
              </Typography>

              {error && (
                <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                  {error}
                </Alert>
              )}

              <Box component="form" onSubmit={handleSubmit} noValidate>
                <Stack spacing={2.5}>
                  <TextField
                    id="login-phone"
                    label={isHindi ? 'मोबाइल नंबर *' : 'Mobile Number *'}
                    variant="outlined"
                    fullWidth
                    required
                    type="tel"
                    placeholder="9898123456"
                    value={phone}
                    onChange={handlePhoneChange}
                    InputProps={{
                      startAdornment: (
                        <Box sx={{ display: 'flex', alignItems: 'center', mr: 1, color: '#555555' }}>
                          <PhoneIphoneIcon sx={{ mr: 0.5, color: '#2E7D32' }} />
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>
                            +91
                          </Typography>
                        </Box>
                      )
                    }}
                    helperText={isHindi ? '10 अंकों का भारतीय मोबाइल नंबर' : '10-digit Indian Mobile Number'}
                  />

                  <TextField
                    id="login-name"
                    label={isHindi ? 'आपका नाम (वैकल्पिक)' : 'Your Name (Optional)'}
                    variant="outlined"
                    fullWidth
                    placeholder={isHindi ? 'उदा. प्रवीणभाई पटेल' : 'e.g. Pravinbhai Patel'}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    InputProps={{
                      startAdornment: <PersonIcon sx={{ mr: 1, color: '#9E9E9E' }} />
                    }}
                  />

                  <TextField
                    id="login-location"
                    label={isHindi ? 'गाँव / ज़िला / राज्य (वैकल्पिक)' : 'Village / District / State (Optional)'}
                    variant="outlined"
                    fullWidth
                    placeholder={isHindi ? 'उदा. पादरा, वडोदरा, गुजरात' : 'e.g. Padra, Vadodara, Gujarat'}
                    value={locationName}
                    onChange={(e) => setLocationName(e.target.value)}
                    InputProps={{
                      startAdornment: <LocationOnIcon sx={{ mr: 1, color: '#9E9E9E' }} />
                    }}
                  />

                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    disabled={loading || phone.length !== 10}
                    sx={{
                      bgcolor: '#2E7D32',
                      '&:hover': { bgcolor: '#1B5E20' },
                      py: 1.5,
                      borderRadius: 3,
                      fontWeight: 700,
                      fontSize: '1.05rem',
                      boxShadow: '0 4px 14px rgba(46, 125, 50, 0.3)'
                    }}
                    startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <CheckCircleIcon />}
                  >
                    {loading
                      ? (isHindi ? 'खाता खोला जा रहा है...' : 'Logging In...')
                      : (isHindi ? 'लॉगिन करें / खाता खोलें' : 'Login / Continue')}
                  </Button>
                </Stack>
              </Box>

              <Divider sx={{ my: 3 }}>
                <Typography variant="caption" color="text.secondary">
                  {isHindi ? 'त्वरित परीक्षण के लिए' : 'Quick 1-Click Demo Testing'}
                </Typography>
              </Divider>

              {/* Quick 1-Click Demo Farmer Buttons */}
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1, fontWeight: 600 }}>
                  {isHindi ? '⚡ 1-क्लिक में डेमो किसान के रूप में लॉगिन करें:' : '⚡ 1-Click login as a sample farmer:'}
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {DEMO_FARMERS.map((demo) => (
                    <Chip
                      key={demo.phone}
                      label={`${demo.name} (${demo.location.split(',')[1]?.trim() || demo.location.split(',')[0]})`}
                      onClick={() => handleQuickDemo(demo)}
                      disabled={loading}
                      color="success"
                      variant="outlined"
                      sx={{
                        cursor: 'pointer',
                        fontWeight: 600,
                        '&:hover': { bgcolor: '#E8F5E9' }
                      }}
                    />
                  ))}
                </Stack>
              </Box>
            </Paper>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default LoginPage;
