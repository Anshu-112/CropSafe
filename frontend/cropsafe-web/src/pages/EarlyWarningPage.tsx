import React, { useState, useEffect } from 'react';
import {
  Typography,
  Paper,
  Box,
  Card,
  CardContent,
  Chip,
  Alert,
  Button,
  CircularProgress,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControl,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import {
  Warning as WarningIcon,
  LocationOn as LocationIcon,
  ExpandMore as ExpandMoreIcon,
  WaterDrop as WaterIcon,
  Thermostat as TempIcon,
  Agriculture as CropIcon
} from '@mui/icons-material';
import BookmarkAddIcon from '@mui/icons-material/BookmarkAdd';
import CheckIcon from '@mui/icons-material/Check';
import axios from 'axios';
import { useFarmer } from '../context/FarmerContext';
import { saveWeatherAlert } from '../services/api';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';

const supportedCrops = [
  { id: 'wheat', name: 'Wheat', name_hi: 'गेहूं', icon: '🌾' },
  { id: 'rice', name: 'Rice', name_hi: 'धान / चावल', icon: '🌾' },
  { id: 'cotton', name: 'Cotton', name_hi: 'कपास', icon: '🌿' },
  { id: 'potato', name: 'Potato', name_hi: 'आलू', icon: '🥔' },
  { id: 'tomato', name: 'Tomato', name_hi: 'टमाटर', icon: '🍅' },
  { id: 'maize', name: 'Maize', name_hi: 'मक्का', icon: '🌽' },
  { id: 'sugarcane', name: 'Sugarcane', name_hi: 'गन्ना', icon: '🎋' },
];

interface EarlyWarningPageProps {
  language?: 'en' | 'hi';
  setLanguage?: (l: 'en' | 'hi') => void;
}

const EarlyWarningPage: React.FC<EarlyWarningPageProps> = ({
  language = 'en',
  setLanguage: propSetLanguage
}) => {
  const { farmer, isLoggedIn, openLoginModal } = useFarmer();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warningData, setWarningData] = useState<any>(null);
  const [location, setLocation] = useState<{lat: number, lon: number} | null>(null);
  const [cropType, setCropType] = useState<string>('wheat');
  const setLanguage = (l: 'en' | 'hi') => {
    if (propSetLanguage) {
      propSetLanguage(l);
    }
  };
  const [savedAlertIndices, setSavedAlertIndices] = useState<Record<number, boolean>>({});

  // Get user's location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lon: position.coords.longitude
          });
        },
        (error) => {
          console.error('Location error:', error);
          // Default to Delhi if location access denied
          setLocation({ lat: 28.6139, lon: 77.2090 });
        }
      );
    } else {
      // Fallback to Delhi
      setLocation({ lat: 28.6139, lon: 77.2090 });
    }
  }, []);

  // Fetch warning data when location or crop changes
  useEffect(() => {
    if (location) {
      fetchWarning();
    }
  }, [location, cropType]);

  const fetchWarning = async () => {
    if (!location) return;

    setLoading(true);
    setError(null);

    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/early-warning`,
        {
          params: {
            lat: location.lat,
            lon: location.lon,
            crop: cropType
          }
        }
      );

      if (response.data.success) {
        setWarningData(response.data);
      } else {
        setError('Failed to fetch warning data');
      }
    } catch (err) {
      console.error('Warning fetch error:', err);
      setError('Failed to load early warning data');
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'HIGH': return '#F44336';
      case 'MEDIUM': return '#FFC107';
      case 'LOW': return '#4CAF50';
      default: return '#9E9E9E';
    }
  };

  const isHindi = language === 'hi';

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h4" sx={{ color: '#E65100', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarningIcon fontSize="large" />
          {isHindi ? '⚠️ पूर्व चेतावनी प्रणाली' : '⚠️ Early Warning System'}
        </Typography>

        {/* Language Toggle */}
        <Box>
          <Button
            variant={language === 'en' ? 'contained' : 'outlined'}
            onClick={() => setLanguage('en')}
            size="small"
            sx={{ mr: 1 }}
          >
            🇬🇧 English
          </Button>
          <Button
            variant={language === 'hi' ? 'contained' : 'outlined'}
            onClick={() => setLanguage('hi')}
            size="small"
          >
            🇮🇳 हिन्दी
          </Button>
        </Box>
      </Box>

      {/* Crop Selector */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CropIcon color="primary" />
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              {isHindi ? 'फसल चुनें:' : 'Select Crop:'}
            </Typography>
          </Box>
          <FormControl size="small" sx={{ minWidth: 220 }}>
            <Select
              value={cropType}
              onChange={(e) => setCropType(e.target.value as string)}
              sx={{ borderRadius: 2 }}
            >
              {supportedCrops.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <span>{c.icon}</span>
                    <span>{isHindi ? `${c.name_hi} (${c.name})` : `${c.name} (${c.name_hi})`}</span>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button
            variant="contained"
            onClick={fetchWarning}
            disabled={loading}
            sx={{ ml: 'auto', borderRadius: 2 }}
          >
            {loading ? (isHindi ? 'लोड हो रहा है...' : 'Refreshing...') : (isHindi ? 'ताजा करें' : 'Refresh')}
          </Button>
        </Box>
      </Paper>

      {/* Location Info */}
      {location && (
        <Alert icon={<LocationIcon />} severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            <strong>{isHindi ? 'आपका स्थान' : 'Your Location'}:</strong> {location.lat.toFixed(4)}°N, {location.lon.toFixed(4)}°E
          </Typography>
        </Alert>
      )}

      {/* Loading State */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Error State */}
      {error && !loading && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Warning Data */}
      {warningData && !loading && (
        <Box>
          {/* Summary Alert */}
          {warningData.high_risk_alerts?.length > 0 ? (
            <Alert 
              severity="error" 
              sx={{ mb: 3 }}
              action={
                <Button color="inherit" size="small">
                  {isHindi ? 'विवरण देखें' : 'View Details'}
                </Button>
              }
            >
              <Typography variant="body1" fontWeight="bold">
                {isHindi ? warningData.summary.message_hi : warningData.summary.message}
              </Typography>
              <Typography variant="body2">
                {isHindi 
                  ? `अगले 3 दिनों में ${warningData.summary.total_high_risk} रोगों का उच्च जोखिम`
                  : `${warningData.summary.total_high_risk} diseases at HIGH risk in next 3 days`
                }
              </Typography>
            </Alert>
          ) : (
            <Alert severity="success" sx={{ mb: 3 }}>
              <Typography variant="body1" fontWeight="bold">
                {isHindi 
                  ? '✅ अगले 7 दिनों में कोई उच्च जोखिम नहीं'
                  : '✅ No high risk diseases in next 7 days'
                }
              </Typography>
            </Alert>
          )}

          {/* High Risk Alerts - Using CSS Grid */}
          {warningData.high_risk_alerts?.length > 0 && (
            <Box sx={{ mb: 4 }}>
              <Typography variant="h5" gutterBottom sx={{ color: '#E65100', fontWeight: 'bold' }}>
                {isHindi ? '🚨 तत्काल चेतावनी' : '🚨 Immediate Alerts'}
              </Typography>
              <Box sx={{ 
                display: 'grid',
                gridTemplateColumns: {
                  xs: '1fr',
                  md: '1fr 1fr 1fr'
                },
                gap: 2
              }}>
                {warningData.high_risk_alerts.map((alert: any, idx: number) => (
                  <Card key={idx} sx={{ bgcolor: '#FFEBEE', borderLeft: '6px solid #F44336' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Chip 
                          label={`Day ${alert.day}`}
                          size="small"
                          color="error"
                        />
                        <Typography variant="caption" color="text.secondary">
                          {new Date(alert.date).toLocaleDateString()}
                        </Typography>
                      </Box>
                      <Typography variant="h6" gutterBottom>
                        {isHindi ? alert.disease_hi : alert.disease}
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        {isHindi ? alert.advisory_hi : alert.advisory}
                      </Typography>
                      <Alert severity="warning" sx={{ mt: 1 }}>
                        {isHindi 
                          ? 'तुरंत निवारक उपाय करें'
                          : 'Take preventive action immediately'
                        }
                      </Alert>

                      {savedAlertIndices[idx] ? (
                        <Button
                          size="small"
                          color="success"
                          variant="outlined"
                          fullWidth
                          sx={{ mt: 1.5 }}
                          startIcon={<CheckIcon />}
                          disabled
                        >
                          {isHindi ? 'अलर्ट सहेजा गया' : 'Alert Saved'}
                        </Button>
                      ) : (
                        <Button
                          size="small"
                          variant="contained"
                          color="warning"
                          fullWidth
                          sx={{ mt: 1.5, fontWeight: 'bold' }}
                          startIcon={<BookmarkAddIcon />}
                          onClick={async () => {
                            if (!isLoggedIn) {
                              openLoginModal();
                              return;
                            }
                            const res = await saveWeatherAlert({
                              farmer_id: farmer!.id,
                              crop: cropType,
                              risk_level: 'HIGH',
                              primary_disease: alert.disease,
                              primary_disease_hi: alert.disease_hi,
                              summary: alert.advisory,
                              summary_hi: alert.advisory_hi
                            });
                            if (res.success) {
                              setSavedAlertIndices((prev) => ({ ...prev, [idx]: true }));
                            }
                          }}
                        >
                          {isHindi ? 'यह चेतावनी सहेजें' : 'Save this Alert'}
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </Box>
            </Box>
          )}

          {/* Weather Forecast Table */}
          <Typography variant="h5" gutterBottom sx={{ mt: 4, mb: 2 }}>
            {isHindi ? '📊 7 दिन का मौसम पूर्वानुमान' : '📊 7-Day Weather Forecast'}
          </Typography>
          
          <TableContainer component={Paper}>
            <Table>
              <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                <TableRow>
                  <TableCell>{isHindi ? 'दिन' : 'Day'}</TableCell>
                  <TableCell>{isHindi ? 'तारीख' : 'Date'}</TableCell>
                  <TableCell align="center">
                    <TempIcon sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                    {isHindi ? 'तापमान' : 'Temp'}
                  </TableCell>
                  <TableCell align="center">
                    <WaterIcon sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                    {isHindi ? 'नमी' : 'Humidity'}
                  </TableCell>
                  <TableCell align="center">{isHindi ? 'बारिश' : 'Rain'}</TableCell>
                  <TableCell>{isHindi ? 'जोखिम' : 'Risk'}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {warningData.weather_forecast?.map((day: any) => (
                  <TableRow key={day.day} sx={{ 
                    bgcolor: day.diseases.some((d: any) => d.risk_level === 'HIGH') 
                      ? '#FFEBEE' 
                      : day.diseases.some((d: any) => d.risk_level === 'MEDIUM')
                      ? '#FFF8E1'
                      : 'inherit'
                  }}>
                    <TableCell>
                      <Chip 
                        label={`Day ${day.day}`}
                        size="small"
                        color={day.day <= 3 ? 'primary' : 'default'}
                      />
                    </TableCell>
                    <TableCell>{new Date(day.date).toLocaleDateString()}</TableCell>
                    <TableCell align="center">{day.temperature}°C</TableCell>
                    <TableCell align="center">{day.humidity}%</TableCell>
                    <TableCell align="center">{day.rainfall}mm</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        {day.diseases.map((disease: any, idx: number) => (
                          <Chip
                            key={idx}
                            label={isHindi ? disease.disease_hi : disease.disease}
                            size="small"
                            sx={{
                              bgcolor: getRiskColor(disease.risk_level),
                              color: disease.risk_level === 'MEDIUM' ? 'black' : 'white',
                              fontWeight: 'bold'
                            }}
                          />
                        ))}
                        {day.diseases.length === 0 && (
                          <Typography variant="caption" color="text.secondary">
                            {isHindi ? 'कोई जोखिम नहीं' : 'No risk'}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Preventive Measures - Using CSS Grid */}
          <Accordion sx={{ mt: 3 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">
                {isHindi ? '🛡️ निवारक उपाय' : '🛡️ Preventive Measures'}
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ 
                display: 'grid',
                gridTemplateColumns: {
                  xs: '1fr',
                  md: '1fr 1fr'
                },
                gap: 2
              }}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                      {isHindi ? '🌱 सामान्य सुझाव' : '🌱 General Tips'}
                    </Typography>
                    <Typography variant="body2" component="ul" sx={{ pl: 2 }}>
                      <li>{isHindi ? 'नियमित फसल निरीक्षण करें' : 'Regular field inspection'}</li>
                      <li>{isHindi ? 'मौसम पूर्वानुमान पर नज़र रखें' : 'Monitor weather forecasts'}</li>
                      <li>{isHindi ? 'नमी वाले क्षेत्रों में विशेष ध्यान दें' : 'Pay special attention to humid areas'}</li>
                      <li>{isHindi ? 'संतुलित उर्वरक का प्रयोग करें' : 'Use balanced fertilizers'}</li>
                    </Typography>
                  </CardContent>
                </Card>
                <Card variant="outlined" sx={{ bgcolor: '#FFF3E0' }}>
                  <CardContent>
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ color: '#E65100' }}>
                      {isHindi ? '📞 आपातकालीन संपर्क' : '📞 Emergency Contacts'}
                    </Typography>
                    <Typography variant="body2" paragraph>
                      <strong>Kisan Call Center:</strong> 1800-180-1551
                    </Typography>
                    <Typography variant="body2" paragraph>
                      <strong>KVK Helpdesk:</strong> {isHindi ? 'नजदीकी कृषि विज्ञान केंद्र से संपर्क करें' : 'Contact nearest KVK'}
                    </Typography>
                  </CardContent>
                </Card>
              </Box>
            </AccordionDetails>
          </Accordion>
        </Box>
      )}
    </Box>
  );
};

export default EarlyWarningPage;