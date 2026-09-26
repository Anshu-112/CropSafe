import React, { useState } from 'react';
import {
  Typography,
  Box,
  Container,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Stack,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  CameraAlt as CameraIcon,
  PlayCircle as PlayIcon,
  Call as CallIcon,
  Close as CloseIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
  CameraAltOutlined as DetectIcon,
  WarningAmberOutlined as WarningIcon,
  RecordVoiceOverOutlined as VoiceIcon,
  MapOutlined as MapIcon,
  HistoryEduOutlined as HistoryIcon,
  SupportAgentOutlined as SupportIcon
} from '@mui/icons-material';
import { Link, useNavigate } from 'react-router-dom';

interface HomePageProps {
  language?: string;
}

export const HomePage: React.FC<HomePageProps> = ({ language = 'en' }) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [demoOpen, setDemoOpen] = useState(false);
  const [demoStep, setDemoStep] = useState(0);

  const isHindi = language === 'hi';

  const cropSafeFeatures = [
    {
      title: isHindi ? 'फसल रोग पहचान' : 'Crop Disease Detection',
      desc: isHindi
        ? 'गेहूं और धान की पत्तियों की तस्वीर अपलोड करके AI से तुरंत रोग का नाम, गंभीरता और सटीक उपचार पाएं।'
        : 'Upload leaf photos of wheat or rice to instantly identify diseases with high accuracy, severity, and chemical/organic treatments.',
      icon: <DetectIcon sx={{ fontSize: 24, color: '#10B981' }} />,
      path: '/predict'
    },
    {
      title: isHindi ? 'मौसम पूर्व चेतावनी' : 'Early Warning System',
      desc: isHindi
        ? '7 दिन के स्थानीय मौसम पूर्वानुमान के आधार पर रोग प्रकोप आने से पहले चेतावनी पाएं और निवारक छिड़काव करें।'
        : 'Get 7-day weather-based disease risk predictions and receive proactive alerts before outbreaks spread.',
      icon: <WarningIcon sx={{ fontSize: 24, color: '#10B981' }} />,
      path: '/early-warning'
    },
    {
      title: isHindi ? 'द्विभाषी आवाज सहायता' : 'Bilingual Voice Assistant',
      desc: isHindi
        ? 'हिंदी या अंग्रेजी में बोलकर अपनी फसल की समस्या बताएं और बिना पढ़े बोलती हुई विशेषज्ञ सलाह प्राप्त करें।'
        : 'Ask farming questions in Hindi or English and receive spoken expert advice — no reading or typing required.',
      icon: <VoiceIcon sx={{ fontSize: 24, color: '#10B981' }} />,
      path: '/voice'
    },
    {
      title: isHindi ? 'रोग प्रकोप मानचित्र' : 'Disease Outbreak Map',
      desc: isHindi
        ? 'अपने आसपास के इलाकों और जिलों में साथी किसानों द्वारा रिपोर्ट की गई फसल बीमारियों का लाइव सामुदायिक नक्शा देखें।'
        : 'Explore disease outbreaks reported by farmers near you in real-time with community-driven alerts.',
      icon: <MapIcon sx={{ fontSize: 24, color: '#10B981' }} />,
      path: '/map'
    },
    {
      title: isHindi ? 'किसान रिकॉर्ड एवं पर्चे' : 'Farm Records & Prescriptions',
      desc: isHindi
        ? 'अपने पुराने स्कैन, सुझाई गई दवाइयों के पर्चे सहेजें और बीमारी ठीक होने की स्थिति निरंतर ट्रैक करें।'
        : 'Save your diagnosis history, chemical and organic prescriptions, and track crop recovery progress over time.',
      icon: <HistoryIcon sx={{ fontSize: 24, color: '#10B981' }} />,
      path: '/history'
    },
    {
      title: isHindi ? 'किसान परामर्श व हेल्पलाइन' : 'Kisan Support & Helpline',
      desc: isHindi
        ? 'प्रमाणित ICAR फसल सुरक्षा दिशानिर्देश, सही खुराक मानक और 24×7 टोल-फ्री किसान कॉल सेंटर (1800-180-1551) सहायता।'
        : 'Access verified ICAR treatment dosages, official agricultural guidelines, and 24×7 toll-free helpline (1800-180-1551).',
      icon: <SupportIcon sx={{ fontSize: 24, color: '#10B981' }} />,
      path: '/history'
    }
  ];

  const steps = [
    {
      num: '1',
      title: isHindi ? 'पत्ती की फोटो लें' : 'Take Leaf Photo',
      desc: isHindi
        ? 'खेत में अपने कैमरे या डिवाइस से गेहूं या धान की प्रभावित पत्ती की साफ तस्वीर खींचें या अपलोड करें।'
        : 'Capture or upload a clear photo of the affected wheat or rice leaf directly in your web browser.'
    },
    {
      num: '2',
      title: isHindi ? 'AI विश्लेषण' : 'Gemini AI Analyzes',
      desc: isHindi
        ? 'हमारा उन्नत पैथोलॉजी AI कुछ ही सेकंड में पत्तियों पर फफूंद, धब्बे और कीटों के लक्षणों का विश्लेषण करता है।'
        : 'Our specialized agricultural AI inspects visual symptoms, spore patterns, and color variations within seconds.'
    },
    {
      num: '3',
      title: isHindi ? 'पर्चा और उपचार पाएं' : 'Get Prescription & Advice',
      desc: isHindi
        ? 'सटीक रोग का नाम, गंभीरता प्रतिशत, दवाइयों की उचित मात्रा और जैविक उपचार तुरंत पाएं।'
        : 'Receive the exact disease diagnosis, severity percentage, chemical dosage, and organic alternatives.'
    }
  ];

  const demoSlides = [
    {
      title: isHindi ? 'चरण 1: पत्ती की तस्वीर' : 'Step 1: Leaf Photo Upload',
      desc: isHindi
        ? 'किसान गेहूं की पीली पड़ी पत्ती की तस्वीर वेबसाइट पर अपलोड करता है।'
        : 'The farmer uploads a leaf photo showing discoloration or spots directly on the website.',
      tag: 'Yellow Rust / पीला रतुआ'
    },
    {
      title: isHindi ? 'चरण 2: AI पैथोलॉजिस्ट विश्लेषण' : 'Step 2: AI Pathological Analysis',
      desc: isHindi
        ? 'Gemini 2.5 Flash मॉडल पत्ती पर धारियों और फफूंद के पैटर्न की पहचान 95% सटीकता के साथ करता है।'
        : 'Gemini 2.5 Flash identifies striped fungal pustules and diagnoses Yellow Rust with 95% confidence.',
      tag: '95% Confidence / उच्च विश्वास'
    },
    {
      title: isHindi ? 'चरण 3: सटीक उपचार पर्चा' : 'Step 3: Treatment Prescription',
      desc: isHindi
        ? 'किसान को प्रोपिकोनाजोल 25 ईसी की सही मात्रा और जैविक नियंत्रण के उपाय हिंदी में बताए जाते हैं।'
        : 'The farmer receives exact chemical spray dosage (Propiconazole 25 EC @ 1ml/L) and organic preventive care.',
      tag: 'Kisan Helpline 1800-180-1551'
    }
  ];

  return (
    <Box sx={{ width: '100%', overflowX: 'hidden' }}>
      {/* HERO SECTION - 100% VIEWPORT HEIGHT ON INITIAL LOAD */}
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          minHeight: { xs: 'calc(100vh - 64px)', md: 'calc(100vh - 70px)' },
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          overflow: 'hidden',
          color: '#FFFFFF'
        }}
      >
        {/* Animated Background Image Layer (Smooth slow zoom & pan) */}
        <Box
          sx={{
            position: 'absolute',
            inset: -30,
            backgroundImage: `url(/assets/hero_farmer_field.jpg)`,
            backgroundSize: 'cover',
            backgroundPosition: 'right center',
            animation: 'heroPanZoom 20s ease-in-out infinite alternate',
            transformOrigin: 'center center',
            zIndex: 0,
            '@keyframes heroPanZoom': {
              '0%': {
                transform: 'scale(1) translate(0, 0)'
              },
              '50%': {
                transform: 'scale(1.08) translate(-1.5%, -0.8%)'
              },
              '100%': {
                transform: 'scale(1.04) translate(1%, 0.6%)'
              }
            }
          }}
        />

        {/* Cinematic Deep Green Gradient Overlay for Premium Readability */}
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            background: {
              xs: 'linear-gradient(180deg, rgba(12, 52, 16, 0.95) 0%, rgba(27, 94, 32, 0.90) 100%)',
              md: 'linear-gradient(90deg, #0d3b12 0%, #144e1a 38%, rgba(20, 78, 26, 0.88) 64%, rgba(27, 94, 32, 0.35) 100%)'
            },
            zIndex: 1
          }}
        />

        {/* Foreground Content inside Container */}
        <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 2, py: { xs: 5, md: 8 } }}>
          <Box sx={{ maxWidth: { xs: '100%', md: '680px' } }}>
            <Typography
              variant="overline"
              sx={{
                display: 'block',
                letterSpacing: 2.5,
                fontWeight: 800,
                color: '#A5D6A7',
                fontSize: { xs: '0.85rem', md: '0.95rem' },
                mb: 1.5
              }}
            >
              {isHindi ? 'AI-संचालित फसल रोग पहचान और पूर्व चेतावनी' : 'AI-POWERED DISEASE DETECTION & EARLY WARNING'}
            </Typography>

            <Typography
              variant="h1"
              sx={{
                fontWeight: 800,
                fontSize: { xs: '2.4rem', sm: '3.2rem', md: '3.8rem' },
                lineHeight: 1.12,
                color: '#FFFFFF',
                mb: 2.5,
                textShadow: '0 2px 14px rgba(0,0,0,0.35)'
              }}
            >
              {isHindi ? 'स्मार्ट AI तकनीक से अपनी फसल को सुरक्षित रखें' : 'Protect Your Crops with Smart AI Technology'}
            </Typography>

            <Typography
              variant="body1"
              sx={{
                fontSize: { xs: '1.05rem', md: '1.25rem' },
                color: 'rgba(255, 255, 255, 0.92)',
                mb: 4.5,
                lineHeight: 1.65,
                maxWidth: 620
              }}
            >
              {isHindi
                ? 'गेहूं और धान की पत्तियों की तस्वीर अपलोड करके तुरंत रोगों की पहचान करें, मौसम आधारित जोखिम पूर्व चेतावनी पाएं और उपचार की सिफारिशें प्राप्त करें — सब कुछ हिंदी या अंग्रेजी में।'
                : 'Upload photos of wheat or rice leaves to instantly identify diseases, get weather-based risk predictions, and receive treatment recommendations — all in Hindi or English.'}
            </Typography>

            {/* Action CTAs */}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2.5}>
              <Button
                variant="contained"
                size="large"
                component={Link}
                to="/predict"
                startIcon={<CameraIcon sx={{ fontSize: 24 }} />}
                sx={{
                  bgcolor: '#4CAF50',
                  '&:hover': { bgcolor: '#388E3C', transform: 'translateY(-2px)' },
                  color: '#FFFFFF',
                  px: 4,
                  py: 1.8,
                  fontSize: '1.15rem',
                  fontWeight: 700,
                  borderRadius: 3.5,
                  boxShadow: '0 8px 24px rgba(76, 175, 80, 0.45)',
                  transition: 'all 0.25s ease-in-out'
                }}
              >
                {isHindi ? 'अभी रोग पहचानें' : 'Detect Disease Now'}
              </Button>

              <Button
                variant="outlined"
                size="large"
                onClick={() => setDemoOpen(true)}
                startIcon={<PlayIcon sx={{ fontSize: 24 }} />}
                sx={{
                  color: '#FFFFFF',
                  borderColor: 'rgba(255, 255, 255, 0.6)',
                  bgcolor: 'rgba(0, 0, 0, 0.25)',
                  backdropFilter: 'blur(8px)',
                  '&:hover': {
                    borderColor: '#FFFFFF',
                    bgcolor: 'rgba(255, 255, 255, 0.18)',
                    transform: 'translateY(-2px)'
                  },
                  px: 3.5,
                  py: 1.8,
                  fontSize: '1.15rem',
                  fontWeight: 600,
                  borderRadius: 3.5,
                  transition: 'all 0.25s ease-in-out'
                }}
              >
                {isHindi ? 'डेमो देखें' : 'Watch Demo'}
              </Button>
            </Stack>
          </Box>
        </Container>

        {/* Scroll Down Floating Indicator */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            color: 'rgba(255, 255, 255, 0.85)',
            cursor: 'pointer',
            zIndex: 2,
            transition: 'all 0.2s',
            '&:hover': { color: '#FFFFFF' },
            animation: 'heroBounce 2.4s infinite ease-in-out',
            '@keyframes heroBounce': {
              '0%, 20%, 50%, 80%, 100%': { transform: 'translate(-50%, 0)' },
              '40%': { transform: 'translate(-50%, -8px)' },
              '60%': { transform: 'translate(-50%, -4px)' }
            }
          }}
          onClick={() => {
            document.getElementById('explore-section')?.scrollIntoView({ behavior: 'smooth' });
          }}
        >
          <Typography
            variant="caption"
            sx={{
              letterSpacing: 1.5,
              fontWeight: 600,
              fontSize: '0.78rem',
              textTransform: 'uppercase',
              mb: 0.2
            }}
          >
            {isHindi ? 'सुविधाएं देखें' : 'Explore Features'}
          </Typography>
          <KeyboardArrowDownIcon sx={{ fontSize: 26 }} />
        </Box>
      </Box>

      {/* EXPLORE SECTION (Visible when scrolling down) */}
      <Box id="explore-section">
        <Container maxWidth="xl" sx={{ pt: 6, pb: 4 }}>
          {/* SECTION HEADER MATCHING REFERENCE */}
          <Box sx={{ textAlign: 'center', maxWidth: 820, mx: 'auto', mb: { xs: 5, md: 7 } }}>
            <Typography
              variant="h3"
              component="h2"
              sx={{
                fontWeight: 800,
                color: '#111827',
                fontSize: { xs: '2rem', sm: '2.5rem', md: '2.85rem' },
                lineHeight: 1.2,
                letterSpacing: '-0.025em',
                mb: 1.8
              }}
            >
              {isHindi ? 'स्मार्ट खेती के लिए आवश्यक हर सुविधा' : 'Everything You Need for Smart Farming'}
            </Typography>
            <Typography
              variant="body1"
              sx={{
                fontSize: { xs: '1.05rem', md: '1.18rem' },
                color: '#4B5563',
                lineHeight: 1.5,
                fontWeight: 400
              }}
            >
              {isHindi
                ? 'भारतीय किसानों के लिए विशेष रूप से तैयार अत्याधुनिक और सरल डिजिटल उपकरण'
                : 'Professional-grade tools designed for Indian farmers to prevent crop losses and boost yields.'}
            </Typography>
          </Box>

          {/* 3x2 GRID MATCHING REFERENCE LAYOUT */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
              gap: 3.5,
              mb: 10
            }}
          >
            {cropSafeFeatures.map((feat, index) => (
              <Card
                key={index}
                component={Link}
                to={feat.path}
                sx={{
                  p: { xs: 3.2, md: 3.8 },
                  borderRadius: 3.5,
                  bgcolor: '#FFFFFF',
                  border: '1px solid #E5E7EB',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
                  display: 'flex',
                  flexDirection: 'column',
                  textDecoration: 'none',
                  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                  cursor: 'pointer',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 12px 28px rgba(0, 0, 0, 0.08)',
                    borderColor: '#10B981'
                  }
                }}
              >
                {/* Soft pastel mint icon container */}
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: 2.5,
                    bgcolor: '#E8F8F0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 2.5
                  }}
                >
                  {feat.icon}
                </Box>

                <Typography
                  variant="h6"
                  component="h3"
                  sx={{
                    fontWeight: 700,
                    color: '#111827',
                    fontSize: '1.2rem',
                    mb: 1.2,
                    lineHeight: 1.3
                  }}
                >
                  {feat.title}
                </Typography>

                <Typography
                  variant="body2"
                  sx={{
                    color: '#6B7280',
                    lineHeight: 1.6,
                    fontSize: '0.94rem'
                  }}
                >
                  {feat.desc}
                </Typography>
              </Card>
            ))}
          </Box>

      {/* HOW IT WORKS SECTION */}
      <Box
        sx={{
          bgcolor: '#E8F5E9',
          borderRadius: 4,
          p: { xs: 4, md: 6 },
          mb: 8,
          border: '1px solid #C8E6C9'
        }}
      >
        <Box sx={{ textAlign: 'center', maxWidth: 650, mx: 'auto', mb: 5 }}>
          <Typography variant="overline" sx={{ color: '#2E7D32', fontWeight: 800, letterSpacing: 1.5 }}>
            {isHindi ? 'सरल प्रक्रिया' : 'Simple 3-Step Process'}
          </Typography>
          <Typography variant="h3" sx={{ fontWeight: 800, color: '#1B5E20', mt: 0.5, fontSize: { xs: '1.8rem', md: '2.3rem' } }}>
            {isHindi ? 'यह कैसे काम करता है?' : 'How CropSafe Works'}
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
            {isHindi
              ? 'बिना किसी परेशानी के केवल 3 चरणों में अपनी फसल का सटीक इलाज पाएं'
              : 'Protect your crops and diagnose diseases in three simple steps.'}
          </Typography>
        </Box>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
            gap: 3
          }}
        >
          {steps.map((step, idx) => (
            <Card
              key={idx}
              sx={{
                p: 3,
                borderRadius: 3.5,
                bgcolor: '#FFFFFF',
                boxShadow: '0 6px 16px rgba(0,0,0,0.04)',
                position: 'relative'
              }}
            >
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: 2,
                  bgcolor: '#2E7D32',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  fontSize: '1.2rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: 2
                }}
              >
                {step.num}
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#1A1A1A', mb: 1 }}>
                {step.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                {step.desc}
              </Typography>
            </Card>
          ))}
        </Box>
      </Box>

      {/* STATS & IMPACT SECTION */}
      <Box
        sx={{
          bgcolor: '#1B5E20',
          color: '#FFFFFF',
          borderRadius: 4,
          p: { xs: 4, md: 6 },
          mb: 8,
          boxShadow: '0 16px 36px rgba(27, 94, 32, 0.25)',
          textAlign: 'center'
        }}
      >
        <Typography variant="overline" sx={{ color: '#A5D6A7', letterSpacing: 2, fontWeight: 700 }}>
          {isHindi ? 'विश्वसनीय प्रभाव' : 'Proven Impact'}
        </Typography>
        <Typography variant="h3" sx={{ fontWeight: 800, mb: 5, fontSize: { xs: '1.8rem', md: '2.4rem' } }}>
          {isHindi ? 'भारतीय कृषि के लिए तकनीक की शक्ति' : 'Empowering Indian Farmers with Smart Precision'}
        </Typography>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' },
            gap: 3
          }}
        >
          <Box>
            <Typography variant="h2" sx={{ fontWeight: 800, color: '#FFD54F', fontSize: { xs: '2.4rem', md: '3.2rem' } }}>
              20+
            </Typography>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mt: 0.5 }}>
              {isHindi ? 'पहचाने जाने वाले रोग' : 'Diseases Detected'}
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
              {isHindi ? 'गेहूं एवं धान की फसलें' : 'Wheat & Rice Pathogens'}
            </Typography>
          </Box>

          <Box>
            <Typography variant="h2" sx={{ fontWeight: 800, color: '#81C784', fontSize: { xs: '2.4rem', md: '3.2rem' } }}>
              95%+
            </Typography>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mt: 0.5 }}>
              {isHindi ? 'निदान सटीकता' : 'Accuracy Rate'}
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
              {isHindi ? 'विस्तृत AI विज़न' : 'Gemini 2.5 Flash Vision'}
            </Typography>
          </Box>

          <Box>
            <Typography variant="h2" sx={{ fontWeight: 800, color: '#64B5F6', fontSize: { xs: '2.4rem', md: '3.2rem' } }}>
              7 Days
            </Typography>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mt: 0.5 }}>
              {isHindi ? 'मौसम जोखिम अलर्ट' : 'Weather Risk Forecast'}
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
              {isHindi ? 'आर्द्रता व तापमान गणना' : 'Real-time ICAR Thresholds'}
            </Typography>
          </Box>

          <Box>
            <Typography variant="h2" sx={{ fontWeight: 800, color: '#FFB74D', fontSize: { xs: '2.4rem', md: '3.2rem' } }}>
              24×7
            </Typography>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mt: 0.5 }}>
              {isHindi ? 'हिंदी आवाज सहायता' : 'Hindi Voice Support'}
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
              {isHindi ? 'निःशुल्क किसान परामर्श' : 'Always Available'}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* EMERGENCY KISAN HELPLINE BANNER */}
      <Card
        sx={{
          bgcolor: '#FFF3E0',
          borderLeft: '8px solid #FF9800',
          borderRadius: 4,
          p: 3,
          mb: 8,
          boxShadow: '0 8px 24px rgba(255, 152, 0, 0.15)'
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 2
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                bgcolor: '#FF9800',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <CallIcon sx={{ fontSize: 32 }} />
            </Box>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#E65100' }}>
                {isHindi ? 'किसान आपातकालीन हेल्पलाइन: 1800-180-1551' : 'Emergency Farmer Helpline: 1800-180-1551'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {isHindi
                  ? 'टोल-फ्री · 24×7 उपलब्ध · कृषि मंत्रालय भारत सरकार द्वारा संचालित किसान कॉल सेंटर'
                  : 'Toll-free · 24×7 Available · Official Kisan Call Center by Govt. of India'}
              </Typography>
            </Box>
          </Box>

          <Button
            variant="contained"
            size="large"
            href="tel:18001801551"
            sx={{
              bgcolor: '#E65100',
              '&:hover': { bgcolor: '#BF360C' },
              color: '#FFFFFF',
              fontWeight: 700,
              borderRadius: 3,
              px: 3.5,
              py: 1.4
            }}
            startIcon={<CallIcon />}
          >
            {isHindi ? 'अभी कॉल करें' : 'Call Helpline Now'}
          </Button>
        </Box>
      </Card>

      {/* FOOTER */}
      <Box
        sx={{
          borderTop: '1px solid #E0E0E0',
          pt: 6,
          pb: 4,
          color: '#666666'
        }}
      >
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '2fr 1fr 1fr' },
            gap: 4,
            mb: 4
          }}
        >
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#2E7D32', mb: 1 }}>
              🌾 CropSafe
            </Typography>
            <Typography variant="body2" sx={{ maxWidth: 360, lineHeight: 1.6 }}>
              {isHindi
                ? 'भारतीय किसानों के लिए AI-संचालित रोग पहचान, मौसम आधारित पूर्व चेतावनी और द्विभाषी आवाज सहायता मंच।'
                : 'AI-powered disease detection, weather-driven early warning, and bilingual voice assistant dedicated to Indian farmers.'}
            </Typography>
          </Box>

          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1A1A1A', mb: 1.5 }}>
              {isHindi ? 'महत्वपूर्ण लिंक' : 'Quick Navigation'}
            </Typography>
            <Stack spacing={1}>
              <Link to="/predict" style={{ textDecoration: 'none', color: '#666' }}>
                {isHindi ? 'रोग पहचान (Detect Disease)' : 'Detect Disease'}
              </Link>
              <Link to="/early-warning" style={{ textDecoration: 'none', color: '#666' }}>
                {isHindi ? 'मौसम पूर्व चेतावनी' : 'Early Warning'}
              </Link>
              <Link to="/history" style={{ textDecoration: 'none', color: '#666' }}>
                {isHindi ? 'किसान रिकॉर्ड एवं पर्चे' : 'Farm Records & Prescriptions'}
              </Link>
              <Link to="/voice" style={{ textDecoration: 'none', color: '#666' }}>
                {isHindi ? 'आवाज सहायता' : 'Voice Assistant'}
              </Link>
              <Link to="/map" style={{ textDecoration: 'none', color: '#666' }}>
                {isHindi ? 'रोग मानचित्र' : 'Disease Map'}
              </Link>
            </Stack>
          </Box>

          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1A1A1A', mb: 1.5 }}>
              {isHindi ? 'संपर्क एवं सहायता' : 'Support & Contact'}
            </Typography>
            <Typography variant="body2">
              Kisan Helpline: <strong>1800-180-1551</strong>
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              Powered by: <strong>Google Gemini AI</strong> & <strong>Open-Meteo</strong>
            </Typography>
          </Box>
        </Box>

        <Box sx={{ borderTop: '1px solid #EEEEEE', pt: 3, textAlign: 'center' }}>
          <Typography variant="body2">
            © {new Date().getFullYear()} CropSafe. {isHindi ? 'भारतीय किसानों के लिए ❤️ से निर्मित।' : 'Made with ❤️ for Indian Farmers.'}
          </Typography>
        </Box>
      </Box>
    </Container>
  </Box>

      {/* INTERACTIVE DEMO MODAL */}
      <Dialog
        open={demoOpen}
        onClose={() => setDemoOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 4, p: 1 } }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#2E7D32' }}>
            🌾 {isHindi ? 'क्रॉपसेफ लाइव डेमो' : 'CropSafe Interactive Demo'}
          </Typography>
          <IconButton size="small" onClick={() => setDemoOpen(false)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers>
          <Box sx={{ p: 2, bgcolor: '#F1F8E9', borderRadius: 3, mb: 3 }}>
            <Chip label={demoSlides[demoStep].tag} color="success" size="small" sx={{ mb: 1.5, fontWeight: 700 }} />
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#1B5E20', mb: 1 }}>
              {demoSlides[demoStep].title}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.6 }}>
              {demoSlides[demoStep].desc}
            </Typography>
          </Box>

          {/* Stepper Dots */}
          <Stack direction="row" spacing={1} justifyContent="center" sx={{ my: 1 }}>
            {demoSlides.map((_, i) => (
              <Box
                key={i}
                onClick={() => setDemoStep(i)}
                sx={{
                  width: demoStep === i ? 24 : 10,
                  height: 10,
                  borderRadius: 5,
                  bgcolor: demoStep === i ? '#2E7D32' : '#C8E6C9',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
              />
            ))}
          </Stack>
        </DialogContent>

        <DialogActions sx={{ p: 2.5, justifyContent: 'space-between' }}>
          <Button
            disabled={demoStep === 0}
            onClick={() => setDemoStep((s) => Math.max(0, s - 1))}
            color="inherit"
          >
            {isHindi ? 'पिछला' : 'Previous'}
          </Button>

          {demoStep < demoSlides.length - 1 ? (
            <Button
              variant="contained"
              onClick={() => setDemoStep((s) => s + 1)}
              sx={{ bgcolor: '#2E7D32', '&:hover': { bgcolor: '#1B5E20' } }}
            >
              {isHindi ? 'अगला' : 'Next Step'}
            </Button>
          ) : (
            <Button
              variant="contained"
              component={Link}
              to="/predict"
              onClick={() => setDemoOpen(false)}
              sx={{ bgcolor: '#4CAF50', '&:hover': { bgcolor: '#388E3C' } }}
            >
              {isHindi ? 'अभी अपनी फसल स्कैन करें' : 'Try Real Scan Now'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default HomePage;