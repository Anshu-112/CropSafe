import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  Typography,
  Paper,
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  LinearProgress,
  Alert,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  CircularProgress,
  TextField
} from '@mui/material';
import { useDropzone } from 'react-dropzone';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import ImageIcon from '@mui/icons-material/Image';
import TranslateIcon from '@mui/icons-material/Translate';
import AgricultureIcon from '@mui/icons-material/Agriculture';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import CloseIcon from '@mui/icons-material/Close';
import BookmarkAddedIcon from '@mui/icons-material/BookmarkAdded';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import HistoryIcon from '@mui/icons-material/History';
import CampaignIcon from '@mui/icons-material/Campaign';
import MapIcon from '@mui/icons-material/Map';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useFarmer } from '../context/FarmerContext';
import { saveDiagnosisRecord, submitOutbreakReport, API_BASE_URL } from '../services/api';

// Language options
const languages = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
];

interface PredictPageProps {
  language?: 'en' | 'hi';
  setLanguage?: (l: string) => void;
}

const PredictPage: React.FC<PredictPageProps> = ({
  language = 'en',
  setLanguage: propSetLanguage
}) => {
  const isHindi = language === 'hi';
  const { farmer, isLoggedIn, openLoginModal } = useFarmer();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [detectedCrop, setDetectedCrop] = useState<string>('');
  const [detectedCropHi, setDetectedCropHi] = useState<string>('');
  const setLanguage = (l: string) => {
    if (propSetLanguage) {
      propSetLanguage(l);
    }
  };
  const [weatherData, setWeatherData] = useState<any>(null);
  const [location, setLocation] = useState<{lat: number, lon: number} | null>(null);
  
  // History save state
  const [savedToHistory, setSavedToHistory] = useState(false);
  const [savingHistory, setSavingHistory] = useState(false);

  // Outbreak Map broadcast state
  const [broadcastingToMap, setBroadcastingToMap] = useState(false);
  const [broadcastSuccess, setBroadcastSuccess] = useState(false);
  
  // Camera states
  const [cameraOpen, setCameraOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  // Gemini AI Status & Key Config
  const [aiAvailable, setAiAvailable] = useState<boolean>(false);
  const [keyModalOpen, setKeyModalOpen] = useState<boolean>(false);
  const [inputApiKey, setInputApiKey] = useState<string>('');
  const [keySaving, setKeySaving] = useState<boolean>(false);
  const [keyError, setKeyError] = useState<string | null>(null);
  const [keySuccess, setKeySuccess] = useState<string | null>(null);

  const checkAiStatus = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/ai/status`);
      setAiAvailable(res.data.available);
    } catch (e) {
      console.error('Failed to fetch AI status:', e);
    }
  };

  useEffect(() => {
    checkAiStatus();
  }, []);

  const handleSaveApiKey = async () => {
    if (!inputApiKey.trim()) {
      setKeyError(isHindi ? 'कृपया मान्य Gemini API Key दर्ज करें।' : 'Please enter a valid Gemini API Key.');
      return;
    }
    setKeySaving(true);
    setKeyError(null);
    setKeySuccess(null);
    try {
      const res = await axios.post(`${API_BASE_URL}/api/ai/configure-key`, {
        api_key: inputApiKey.trim()
      });
      if (res.data.success) {
        setAiAvailable(true);
        setKeySuccess(isHindi ? 'Gemini AI सफलतापूर्वक सक्रिय हो गया!' : 'Gemini AI activated successfully!');
        setTimeout(() => {
          setKeyModalOpen(false);
          setInputApiKey('');
          setKeySuccess(null);
        }, 1200);
      }
    } catch (e: any) {
      const msg = e.response?.data?.detail || e.message || 'Verification failed';
      setKeyError(msg);
    } finally {
      setKeySaving(false);
    }
  };

  // Get user's location and fetch weather
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            lat: position.coords.latitude,
            lon: position.coords.longitude
          };
          setLocation(coords);
          fetchWeatherRisk(coords.lat, coords.lon, 'wheat');
        },
        (error) => {
          console.log("Location error:", error);
          const defaultCoords = { lat: 28.6139, lon: 77.2090 };
          setLocation(defaultCoords);
          fetchWeatherRisk(defaultCoords.lat, defaultCoords.lon, 'wheat');
        }
      );
    } else {
      const defaultCoords = { lat: 28.6139, lon: 77.2090 };
      setLocation(defaultCoords);
      fetchWeatherRisk(defaultCoords.lat, defaultCoords.lon, 'wheat');
    }
  }, []);

  // Cleanup camera stream
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const fetchWeatherRisk = async (lat: number, lon: number, crop: string) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/weather-risk?lat=${lat}&lon=${lon}&crop=${crop}`
      );
      setWeatherData(response.data);
      console.log("Weather data:", response.data);
    } catch (error) {
      console.error("Failed to fetch weather:", error);
    }
  };

  // Handle file upload (existing)
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setSelectedFile(file);
      setPreview(URL.createObjectURL(file));
      setResult(null);
      setError(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png']
    },
    maxFiles: 1
  });

  // Camera functions
  const openCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } // Use back camera on phones
      });
      setStream(mediaStream);
      setCameraOpen(true);
      
      // Wait for video to load
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.play();
        }
      }, 100);
    } catch (err) {
      console.error('Camera error:', err);
      alert(isHindi 
        ? 'कैमरा एक्सेस नहीं हो सका। कृपया अनुमति दें।' 
        : 'Could not access camera. Please grant permission.');
    }
  };

  const closeCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setCameraOpen(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw video frame to canvas
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Convert canvas to file
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], `camera_capture_${Date.now()}.jpg`, { 
              type: 'image/jpeg' 
            });
            setSelectedFile(file);
            setPreview(URL.createObjectURL(blob));
            setResult(null);
            setError(null);
            closeCamera();
          }
        }, 'image/jpeg', 0.9);
      }
    }
  };

  const handlePredict = async () => {
    if (!selectedFile) return;

    setLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const endpoint = '/api/predict/universal';
      console.log(`Sending request to: ${API_BASE_URL}${endpoint}`);
      
      const response = await axios.post(`${API_BASE_URL}${endpoint}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000,
      });
      
      console.log('Response:', response.data);
      
      if (response.data.success) {
        const pred = response.data.prediction;
        const detected = pred.crop_detected || response.data.crop_detected || 'Crop';
        const detectedHi = pred.crop_detected_hi || response.data.crop_detected_hi || detected;
        setDetectedCrop(detected);
        setDetectedCropHi(detectedHi);
        pred.is_ai_live = response.data.is_ai_live !== false;
        setResult(pred);
        setSavedToHistory(false);
        setBroadcastSuccess(false);

        // Auto-save if farmer is logged in
        if (farmer?.id) {
          saveDiagnosisRecord({
            farmer_id: farmer.id,
            crop: detected,
            disease_name: pred.disease_name,
            disease_name_hi: pred.disease_name_hi,
            confidence: pred.confidence,
            severity_level: pred.severity?.level,
            severity_percentage: pred.severity?.percentage,
            symptoms: pred.symptoms,
            symptoms_hi: pred.symptoms_hi,
            remedies: pred.remedies,
            remedies_hi: pred.remedies_hi,
            expert_advice: pred.expert_advice,
            expert_advice_hi: pred.expert_advice_hi,
            emergency_contact: pred.emergency_contact,
            follow_up_status: 'PENDING_TREATMENT'
          }).then((saveRes) => {
            if (saveRes.success) {
              setSavedToHistory(true);
            }
          });
        }
      } else {
        setError('Failed to analyze image');
      }
    } catch (err) {
      console.error('Error:', err);
      if (axios.isAxiosError(err)) {
        if (err.code === 'ECONNABORTED') {
          setError('Analysis timed out. Please try again with a clearer or smaller photo.');
        } else if (err.response?.status === 500) {
          setError('Server error during image processing. Please try again.');
        } else {
          setError(`Error: ${err.message}`);
        }
      } else {
        setError('Failed to predict disease. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // 1-Click Crop Override / Correction
  const handleCropOverride = async (cropName: string) => {
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      if (selectedFile) {
        formData.append('file', selectedFile);
      } else {
        formData.append('file', new File([''], 'crop_sample.jpg', { type: 'image/jpeg' }));
      }
      const response = await axios.post(`${API_BASE_URL}/api/predict/universal?crop=${encodeURIComponent(cropName)}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 45000,
      });
      if (response.data.success) {
        const pred = response.data.prediction;
        const detected = pred.crop_detected || response.data.crop_detected || cropName;
        const detectedHi = pred.crop_detected_hi || response.data.crop_detected_hi || detected;
        setDetectedCrop(detected);
        setDetectedCropHi(detectedHi);
        pred.is_ai_live = response.data.is_ai_live !== false;
        setResult(pred);
        setSavedToHistory(false);
        setBroadcastSuccess(false);

        if (farmer?.id) {
          saveDiagnosisRecord({
            farmer_id: farmer.id,
            crop: detected,
            disease_name: pred.disease_name,
            disease_name_hi: pred.disease_name_hi,
            confidence: pred.confidence,
            severity_level: pred.severity?.level,
            severity_percentage: pred.severity?.percentage,
            symptoms: pred.symptoms,
            symptoms_hi: pred.symptoms_hi,
            remedies: pred.remedies,
            remedies_hi: pred.remedies_hi,
            expert_advice: pred.expert_advice,
            expert_advice_hi: pred.expert_advice_hi,
            emergency_contact: pred.emergency_contact,
            follow_up_status: 'PENDING_TREATMENT'
          }).then((saveRes) => {
            if (saveRes.success) {
              setSavedToHistory(true);
            }
          });
        }
      }
    } catch (err) {
      console.error('Crop override failed:', err);
    } finally {
      setLoading(false);
    }
  };

  // Broadcast AI Diagnosis to live Outbreak Map
  const handleBroadcastToMap = async () => {
    if (!result) return;
    setBroadcastingToMap(true);
    try {
      const lat = location?.lat || 29.6857;
      const lon = location?.lon || 76.9905;
      const cropName = detectedCrop || result.crop_detected || 'Crop';
      const cropNameHi = detectedCropHi || result.crop_detected_hi || cropName;
      const res = await submitOutbreakReport({
        crop: cropName,
        disease_name: result.disease_name,
        disease_name_hi: result.disease_name_hi,
        severity: (result.severity?.level as 'High' | 'Moderate' | 'Low') || 'High',
        lat: lat,
        lon: lon,
        district: farmer?.location_name || 'Field Sector',
        state: 'Agricultural Zone',
        description: `AI-verified scanner detection: ${cropName} (${cropNameHi}) - ${result.disease_name} (${result.confidence}% confidence). Recommended immediate preventive measures.`,
        reporter_name: farmer?.name ? `${farmer.name} (CropSafe Farmer)` : 'CropSafe AI Scanner',
        reporter_phone: farmer?.phone || '',
        is_ai_verified: true,
        farmer_id: farmer?.id
      });
      if (res.success) {
        setBroadcastSuccess(true);
      } else {
        alert(res.error || 'Failed to broadcast warning to map');
      }
    } catch (err: any) {
      console.error('Broadcast error:', err);
      alert('Failed to broadcast warning to map');
    } finally {
      setBroadcastingToMap(false);
    }
  };

  const containerStyle = {
    display: 'flex',
    gap: '24px',
    marginTop: '24px',
    flexDirection: { xs: 'column', md: 'row' } as const
  };

  const columnStyle = {
    flex: 1,
    minWidth: 0
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ color: '#2E7D32', fontWeight: 'bold' }}>
        🌾 {isHindi ? 'फसल रोग पहचान - कैमरा सहायता' : 'Crop Disease Detection - Camera Support'}
      </Typography>

      {/* Language Selector */}
      <Paper sx={{ p: 2, mb: 3, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
        <TranslateIcon color="primary" />
        <FormControl component="fieldset">
          <RadioGroup
            row
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          >
            {languages.map(lang => (
              <FormControlLabel
                key={lang.code}
                value={lang.code}
                control={<Radio />}
                label={`${lang.flag} ${lang.name}`}
              />
            ))}
          </RadioGroup>
        </FormControl>
      </Paper>
      
      {/* Location Info */}
      {location && (
        <Alert severity="info" sx={{ mb: 2 }}>
          📍 {isHindi ? 'आपका स्थान' : 'Your location'}: {location.lat.toFixed(2)}°N, {location.lon.toFixed(2)}°E
        </Alert>
      )}

      {/* Live AI Status & Key Setup Banner */}
      {!aiAvailable ? (
        <Alert 
          severity="warning" 
          sx={{ mb: 3, borderRadius: 2, alignItems: 'center' }}
          action={
            <Button 
              color="warning" 
              variant="contained" 
              size="small" 
              onClick={() => setKeyModalOpen(true)}
              sx={{ fontWeight: 'bold', textTransform: 'none', boxShadow: 'none' }}
            >
              🔑 {isHindi ? 'Gemini Key जोड़ें' : 'Connect Gemini Key'}
            </Button>
          }
        >
          <strong>{isHindi ? 'ऑफ़लाइन डेमो मोड:' : 'Offline Demo Mode:'}</strong>{' '}
          {isHindi 
            ? 'GEMINI_API_KEY कॉन्फ़िगर नहीं है, इसलिए परिणाम ICAR कैटलॉग प्रीसेट से आ रहे हैं। वास्तविक फोटो के लक्षणों का AI विश्लेषण करने के लिए निःशुल्क Gemini Key जोड़ें।' 
            : 'GEMINI_API_KEY is not configured in backend/.env, so results use ICAR catalog presets. Connect your free Google Gemini API key to enable live computer-vision disease diagnosis on your photos.'}
        </Alert>
      ) : (
        <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
          🟢 <strong>{isHindi ? 'लाइव Gemini Vision AI सक्रिय है:' : 'Live Gemini Vision AI Active:'}</strong>{' '}
          {isHindi 
            ? 'अपलोड की गई फोटो का रीयल-टाइम न्यूरल विज़न (Gemini 2.5 Flash) द्वारा सटीक विश्लेषण किया जाएगा।' 
            : 'Real-time multimodal neural vision is analyzing uploaded leaf lesions directly.'}
        </Alert>
      )}
      
      {/* Two-column layout */}
      <Box sx={containerStyle}>
        {/* Left column - Upload */}
        <Box sx={columnStyle}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AgricultureIcon /> 
              {isHindi ? 'फसल की फोटो अपलोड करें' : 'Upload Crop Image'}
            </Typography>
            
            {/* Universal Zero-Click Crop Detection Banner */}
            <Box
              sx={{
                mb: 3,
                p: 2,
                borderRadius: 2.5,
                bgcolor: '#F1F8E9',
                border: '1px solid #C8E6C9',
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
              }}
            >
              <Typography sx={{ fontSize: '1.8rem', lineHeight: 1 }}>🌱</Typography>
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1B5E20' }}>
                  {isHindi ? 'सभी फसलों के लिए स्वचालित AI पहचान (ज़ीरो-क्लिक)' : 'Universal Zero-Click AI Crop & Disease Scanner'}
                </Typography>
                <Typography variant="caption" sx={{ color: '#33691E', display: 'block', mt: 0.2, lineHeight: 1.4 }}>
                  {isHindi
                    ? 'गेहूं, धान, कपास, आलू, टमाटर, मक्का, गन्ना आदि किसी भी फसल की फोटो लें — AI फसल और बीमारी दोनों खुद पहचान लेगा।'
                    : 'Upload any crop (Cotton, Potato, Tomato, Maize, Sugarcane, Wheat, Rice, etc.) — AI identifies species & disease automatically.'}
                </Typography>
              </Box>
            </Box>
            
            {/* Upload options */}
            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
              <Button
                variant="contained"
                startIcon={<CloudUploadIcon />}
                onClick={() => document.getElementById('file-upload')?.click()}
                sx={{ flex: 1 }}
              >
                {isHindi ? 'फोटो चुनें' : 'Choose Photo'}
              </Button>
              <Button
                variant="contained"
                startIcon={<CameraAltIcon />}
                onClick={openCamera}
                sx={{ flex: 1, bgcolor: '#9C27B0' }}
              >
                {isHindi ? 'कैमरा' : 'Camera'}
              </Button>
              <input
                id="file-upload"
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setSelectedFile(file);
                    setPreview(URL.createObjectURL(file));
                    setResult(null);
                    setError(null);
                  }
                }}
              />
            </Box>
            
            {/* Dropzone */}
            <Box
              {...getRootProps()}
              sx={{
                border: '2px dashed #ccc',
                borderRadius: 2,
                p: 4,
                textAlign: 'center',
                cursor: 'pointer',
                backgroundColor: isDragActive ? '#f0f0f0' : 'transparent',
                '&:hover': {
                  backgroundColor: '#f5f5f5'
                }
              }}
            >
              <input {...getInputProps()} />
              <CloudUploadIcon sx={{ fontSize: 48, color: '#2E7D32', mb: 2 }} />
              {isDragActive ? (
                <Typography>{isHindi ? 'फोटो यहां छोड़ें' : 'Drop the image here...'}</Typography>
              ) : (
                <Typography>
                  {isHindi 
                    ? 'या फोटो यहां खींचकर छोड़ें' 
                    : 'Or drag & drop an image here'}
                </Typography>
              )}
            </Box>

            {/* Preview */}
            {preview && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  {isHindi ? 'चुनी गई फोटो:' : 'Selected Image:'}
                </Typography>
                <Card>
                  <CardMedia
                    component="img"
                    image={preview}
                    alt="Preview"
                    sx={{ maxHeight: 200, objectFit: 'contain' }}
                  />
                  <CardContent>
                    <Typography variant="body2">
                      {selectedFile?.name || 'Camera photo'}
                      {selectedFile?.size ? ` (${(selectedFile.size / 1024 / 1024).toFixed(2)} MB)` : ''}
                    </Typography>
                  </CardContent>
                </Card>
              </Box>
            )}

            {/* Predict button */}
            {selectedFile && (
              <Button
                variant="contained"
                fullWidth
                size="large"
                onClick={handlePredict}
                disabled={loading}
                sx={{ mt: 3 }}
              >
                {loading 
                  ? (isHindi ? 'विश्लेषण हो रहा है...' : 'Analyzing...')
                  : (isHindi ? 'रोग की पहचान करें' : 'Detect Disease')
                }
              </Button>
            )}

            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}
          </Paper>
        </Box>

        {/* Right column - Results */}
        <Box sx={columnStyle}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              {isHindi ? 'परिणाम' : 'Detection Results'}
            </Typography>
            
            {loading && (
              <Box sx={{ width: '100%', mt: 4, textAlign: 'center' }}>
                <LinearProgress />
                <Typography variant="body2" sx={{ mt: 2 }}>
                  {isHindi ? 'AI फोटो का विश्लेषण कर रहा है...' : 'AI is analyzing your image...'}
                </Typography>
              </Box>
            )}

            {!loading && !result && (
              <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
                <ImageIcon sx={{ fontSize: 60, mb: 2, opacity: 0.3 }} />
                <Typography>
                  {isHindi 
                    ? 'परिणाम देखने के लिए फोटो अपलोड करें या कैमरे से फोटो लें' 
                    : 'Upload an image or take a photo to see results'}
                </Typography>
              </Box>
            )}

            {result && !loading && (
              <Box>
                {/* Detected Crop Badge */}
                <Box
                  sx={{
                    mb: 2.5,
                    p: 2,
                    borderRadius: 2.5,
                    bgcolor: '#E8F5E9',
                    border: '1.5px solid #81C784',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    boxShadow: '0 3px 12px rgba(46, 125, 50, 0.12)'
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Typography sx={{ fontSize: '2rem', lineHeight: 1 }}>🌱</Typography>
                    <Box>
                      <Typography variant="caption" sx={{ color: '#2E7D32', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                        {isHindi ? 'AI द्वारा पहचानी गई फसल' : 'AI Detected Crop'}
                      </Typography>
                      <Typography variant="h5" sx={{ color: '#1B5E20', fontWeight: 800, lineHeight: 1.2 }}>
                        {isHindi
                          ? (result.crop_detected_hi || detectedCropHi || result.crop_detected || detectedCrop || 'फसल')
                          : (result.crop_detected || detectedCrop || 'Crop')}
                      </Typography>
                    </Box>
                  </Box>
                  <Chip
                    size="small"
                    label={
                      (result.is_ai_live !== false && aiAvailable)
                        ? (isHindi ? '✓ AI द्वारा सत्यापित' : '✓ AI Verified')
                        : (isHindi ? '✓ ICAR डेटाबेस' : '✓ ICAR Catalog')
                    }
                    sx={{
                      bgcolor: '#C8E6C9',
                      color: '#1B5E20',
                      fontWeight: 700,
                      fontSize: '0.8rem',
                      border: '1px solid #81C784'
                    }}
                  />
                </Box>

                {/* Crop Switcher / Override if AI picked wrong crop */}
                <Paper
                  elevation={0}
                  sx={{
                    p: 1.5,
                    mb: 2.5,
                    bgcolor: '#F9FBE7',
                    borderRadius: 2,
                    border: '1px dashed #81C784',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                    <Typography variant="caption" sx={{ color: '#2E7D32', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      ✏️ {isHindi ? 'गलत फसल पहचानी गई? तुरंत सही फसल चुनें:' : 'Wrong crop detected? Switch to actual crop:'}
                    </Typography>
                    {loading && (
                      <Typography variant="caption" sx={{ color: '#E65100', fontWeight: 600 }}>
                        ⏳ {isHindi ? 'पुनः विश्लेषण जारी...' : 'Re-analyzing...'}
                      </Typography>
                    )}
                  </Box>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
                    {[
                      { en: 'Wheat', hi: 'गेहूं', icon: '🌾' },
                      { en: 'Rice', hi: 'चावल', icon: '🍚' },
                      { en: 'Cotton', hi: 'कपास', icon: '🌿' },
                      { en: 'Potato', hi: 'आलू', icon: '🥔' },
                      { en: 'Tomato', hi: 'टमाटर', icon: '🍅' },
                      { en: 'Maize', hi: 'मक्का', icon: '🌽' },
                      { en: 'Sugarcane', hi: 'गन्ना', icon: '🎋' }
                    ].map((c) => {
                      const currentCrop = (result.crop_detected || detectedCrop || '').toLowerCase();
                      const isCurrent = currentCrop === c.en.toLowerCase();
                      return (
                        <Chip
                          key={c.en}
                          label={`${c.icon} ${isHindi ? c.hi : c.en}`}
                          size="small"
                          clickable
                          onClick={() => handleCropOverride(c.en)}
                          sx={{
                            fontWeight: isCurrent ? 800 : 500,
                            bgcolor: isCurrent ? '#2E7D32' : '#FFFFFF',
                            color: isCurrent ? '#FFFFFF' : '#2E7D32',
                            border: isCurrent ? '1.5px solid #1B5E20' : '1px solid #C8E6C9',
                            boxShadow: isCurrent ? '0 2px 6px rgba(46,125,50,0.3)' : 'none',
                            '&:hover': {
                              bgcolor: isCurrent ? '#1B5E20' : '#E8F5E9',
                            }
                          }}
                        />
                      );
                    })}
                  </Box>
                </Paper>

                {/* Disease Name */}
                <Card sx={{ 
                  bgcolor: result.severity?.level === 'Low' ? '#8BC34A20' : 
                            result.severity?.level === 'Medium' ? '#FFC10720' : 
                            result.severity?.level === 'High' ? '#FF980020' : '#F4433620',
                  borderLeft: `6px solid ${result.severity?.color || '#9E9E9E'}`,
                  mb: 3
                }}>
                  <CardContent>
                    <Typography variant="overline" color="text.secondary">
                      {isHindi ? 'रोग का नाम' : 'Disease Name'}
                    </Typography>
                    <Typography variant="h4" sx={{ color: '#2E7D32', fontWeight: 'bold' }}>
                      {isHindi ? result.disease_name_hi : result.disease_name}
                    </Typography>
                    
                    {/* Confidence */}
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body2" sx={{ mb: 0.5 }}>
                        {isHindi ? 'विश्वसनीयता' : 'Confidence'}: {result.confidence}%
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={result.confidence}
                        sx={{
                          height: 10,
                          borderRadius: 5,
                          bgcolor: '#e0e0e0',
                          '& .MuiLinearProgress-bar': {
                            bgcolor: result.confidence > 80 ? '#4CAF50' : 
                                    result.confidence > 60 ? '#FFC107' : '#F44336'
                          }
                        }}
                      />
                    </Box>

                    {/* Severity */}
                    {result.severity && (
                      <Chip
                        label={isHindi 
                          ? `गंभीरता: ${result.severity.level_hi} (${result.severity.percentage}%)`
                          : `Severity: ${result.severity.level} (${result.severity.percentage}%)`
                        }
                        sx={{
                          mt: 2,
                          bgcolor: result.severity.color,
                          color: 'white',
                          fontWeight: 'bold'
                        }}
                      />
                    )}
                  </CardContent>
                </Card>

                {/* Symptoms */}
                <Accordion defaultExpanded>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="subtitle1" fontWeight="bold">
                      {isHindi ? '🔍 लक्षण' : '🔍 Symptoms'}
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Box component="ul" sx={{ pl: 2, m: 0 }}>
                      {(isHindi ? result.symptoms_hi : result.symptoms)?.map((symptom: string, idx: number) => (
                        <Typography component="li" key={idx} variant="body1" sx={{ mb: 1 }}>
                          {symptom}
                        </Typography>
                      ))}
                    </Box>
                  </AccordionDetails>
                </Accordion>

                {/* Remedies */}
                <Accordion defaultExpanded>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="subtitle1" fontWeight="bold">
                      {isHindi ? '💊 रासायनिक उपचार (सटीक मात्रा सहित)' : '💊 Chemical Remedies (Exact Dosages)'}
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Box component="ul" sx={{ pl: 2, m: 0 }}>
                      {(isHindi ? result.remedies_hi : result.remedies)?.map((remedy: string, idx: number) => (
                        <Typography component="li" key={idx} variant="body1" sx={{ mb: 1 }}>
                          {remedy}
                        </Typography>
                      ))}
                    </Box>
                  </AccordionDetails>
                </Accordion>

                {/* Organic Remedies */}
                {((result.organic_remedies && result.organic_remedies.length > 0) || (result.organic_remedies_hi && result.organic_remedies_hi.length > 0)) && (
                  <Accordion defaultExpanded sx={{ mt: 1.5 }}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography variant="subtitle1" fontWeight="bold" sx={{ color: '#2E7D32' }}>
                        {isHindi ? '🌿 जैविक एवं प्राकृतिक उपचार' : '🌿 Organic & Natural Remedies'}
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Box component="ul" sx={{ pl: 2, m: 0 }}>
                        {(isHindi ? (result.organic_remedies_hi || result.organic_remedies) : (result.organic_remedies || result.organic_remedies_hi))?.map((remedy: string, idx: number) => (
                          <Typography component="li" key={idx} variant="body1" sx={{ mb: 1, color: '#1B5E20' }}>
                            {remedy}
                          </Typography>
                        ))}
                      </Box>
                    </AccordionDetails>
                  </Accordion>
                )}

                {/* Expert Advice */}
                <Alert severity="info" sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    {isHindi ? '👨‍🌾 विशेषज्ञ सलाह' : '👨‍🌾 Expert Advice'}
                  </Typography>
                  <Typography variant="body2">
                    {isHindi ? result.expert_advice_hi : result.expert_advice}
                  </Typography>
                  {result.emergency_contact && (
                    <Typography variant="body2" sx={{ mt: 1, fontWeight: 'bold' }}>
                      📞 {result.emergency_contact}
                    </Typography>
                  )}
                </Alert>

                {/* Save to Farmer Records Box */}
                <Box sx={{ mt: 2.5 }}>
                  {savedToHistory ? (
                    <Alert
                      severity="success"
                      icon={<BookmarkAddedIcon />}
                      action={
                        <Button
                          color="inherit"
                          size="small"
                          component={Link}
                          to="/history"
                          startIcon={<HistoryIcon />}
                        >
                          {isHindi ? 'इतिहास देखें' : 'View Records'}
                        </Button>
                      }
                    >
                      {isHindi
                        ? `✅ यह निदान ${farmer?.name ? farmer.name + ' के' : ''} किसान रिकॉर्ड में सहेज दिया गया है!`
                        : `✅ Diagnosis saved to ${farmer?.name ? farmer.name + "'s" : 'your'} farm records!`}
                    </Alert>
                  ) : (
                    <Button
                      variant="contained"
                      fullWidth
                      size="large"
                      startIcon={savingHistory ? <CircularProgress size={20} color="inherit" /> : <BookmarkBorderIcon />}
                      disabled={savingHistory}
                      onClick={async () => {
                        if (!isLoggedIn) {
                          openLoginModal();
                          return;
                        }
                        setSavingHistory(true);
                        try {
                          const res = await saveDiagnosisRecord({
                            farmer_id: farmer!.id,
                            crop: detectedCrop || result.crop_detected || 'Crop',
                            disease_name: result.disease_name,
                            disease_name_hi: result.disease_name_hi,
                            confidence: result.confidence,
                            severity_level: result.severity?.level,
                            severity_percentage: result.severity?.percentage,
                            symptoms: result.symptoms,
                            symptoms_hi: result.symptoms_hi,
                            remedies: result.remedies,
                            remedies_hi: result.remedies_hi,
                            expert_advice: result.expert_advice,
                            expert_advice_hi: result.expert_advice_hi,
                            emergency_contact: result.emergency_contact,
                            follow_up_status: 'PENDING_TREATMENT'
                          });
                          if (res.success) {
                            setSavedToHistory(true);
                          } else {
                            alert(res.error || 'Failed to save record');
                          }
                        } finally {
                          setSavingHistory(false);
                        }
                      }}
                      sx={{
                        bgcolor: '#1b5e20',
                        '&:hover': { bgcolor: '#0d3d13' },
                        py: 1.3,
                        borderRadius: 2,
                        fontWeight: 'bold'
                      }}
                    >
                      {isLoggedIn
                        ? (isHindi ? '💾 मेरे फार्म रिकॉर्ड में सहेजें' : '💾 Save to My Farm Records')
                        : (isHindi ? '👤 लॉगिन करें और रिकॉर्ड सहेजें' : '👤 Login to Save to Farm Records')}
                    </Button>
                  )}
                </Box>

                {/* Broadcast Warning to Disease Outbreak Map */}
                <Card
                  sx={{
                    mt: 2.5,
                    borderRadius: 3,
                    border: '1px solid #FFD54F',
                    bgcolor: '#FFFDE7',
                    boxShadow: '0 4px 14px rgba(255, 179, 0, 0.12)'
                  }}
                >
                  <CardContent sx={{ p: '18px 20px !important' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 1 }}>
                      <CampaignIcon sx={{ color: '#E65100', fontSize: 28 }} />
                      <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#E65100' }}>
                        {isHindi ? '📢 रोग प्रकोप मानचित्र पर चेतावनी प्रसारित करें' : '📢 Broadcast Alert to Outbreak Map'}
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ color: '#5D4037', mb: 2, fontSize: '0.85rem' }}>
                      {isHindi
                        ? 'इस AI-सत्यापित फसल रोग निदान को लाइव सामुदायिक मानचित्र पर प्रसारित करके आस-पास के किसानों को सतर्क करें।'
                        : 'Alert neighboring farmers in real-time. This AI-verified diagnosis will be pinned to the live Outbreak Map with an official verification badge.'}
                    </Typography>

                    {broadcastSuccess ? (
                      <Alert
                        severity="success"
                        action={
                          <Button
                            color="inherit"
                            size="small"
                            component={Link}
                            to="/map"
                            startIcon={<MapIcon />}
                            sx={{ fontWeight: 700 }}
                          >
                            {isHindi ? 'मानचित्र पर देखें' : 'View on Map'}
                          </Button>
                        }
                      >
                        {isHindi
                          ? '✅ चेतावनी सफलतापूर्वक मानचित्र पर प्रसारित कर दी गई है! आस-पास के किसानों को अलर्ट मिल जाएगा।'
                          : '✅ Alert broadcasted live to Outbreak Map! Nearby farmers can now see this warning.'}
                      </Alert>
                    ) : (
                      <Button
                        variant="contained"
                        fullWidth
                        size="large"
                        disabled={broadcastingToMap}
                        onClick={handleBroadcastToMap}
                        startIcon={broadcastingToMap ? <CircularProgress size={20} color="inherit" /> : <CampaignIcon />}
                        sx={{
                          bgcolor: '#E65100',
                          '&:hover': { bgcolor: '#BF360C' },
                          color: '#FFFFFF',
                          fontWeight: 700,
                          py: 1.2,
                          borderRadius: 2.5
                        }}
                      >
                        {broadcastingToMap
                          ? (isHindi ? 'प्रसारित किया जा रहा है...' : 'Broadcasting Alert...')
                          : (isHindi ? '📢 अभी चेतावनी प्रसारित करें' : '📢 Broadcast Outbreak Warning Now')}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </Box>
            )}
          </Paper>
        </Box>
      </Box>

      {/* Camera Dialog */}
      <Dialog
        open={cameraOpen}
        onClose={closeCamera}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              {isHindi ? '📸 फोटो लें' : '📸 Take Photo'}
            </Typography>
            <IconButton onClick={closeCamera}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ position: 'relative', width: '100%', pt: '56.25%' /* 16:9 aspect ratio */ }}>
            <video
              ref={videoRef}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                borderRadius: '8px'
              }}
              autoPlay
              playsInline
            />
          </Box>
          <canvas ref={canvasRef} style={{ display: 'none' }} />
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
          <Button
            variant="contained"
            color="primary"
            size="large"
            startIcon={<CameraAltIcon />}
            onClick={capturePhoto}
            sx={{ minWidth: 200 }}
          >
            {isHindi ? 'फोटो लें' : 'Capture'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Help Section */}
      <Paper sx={{ mt: 3, p: 2, bgcolor: '#FFF3E0' }}>
        <Typography variant="body2" color="text.secondary" align="center">
          {isHindi 
            ? '🇮🇳 कैमरे से फोटो लें या गैलरी से फोटो चुनें। नियमित फसल निगरानी करें। आपात स्थिति: 1800-180-1551'
            : '🇮🇳 Take photo with camera or choose from gallery. Monitor crops regularly. Emergency: 1800-180-1551'}
        </Typography>
      </Paper>

      {/* Configure Gemini API Key Modal */}
      <Dialog 
        open={keyModalOpen} 
        onClose={() => !keySaving && setKeyModalOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 'bold', color: '#2E7D32' }}>
          🔑 {isHindi ? 'Google Gemini AI API Key कॉन्फ़िगर करें' : 'Configure Google Gemini AI API Key'}
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
            {isHindi
              ? 'CropSafe रीयल-टाइम न्यूरल विज़न (Gemini 2.5 Flash) का उपयोग करके किसी भी पौधे की बीमारी का सटीक विश्लेषण करता है। यह सेवा Google AI Studio द्वारा पूर्णतः निःशुल्क उपलब्ध कराई जाती है।'
              : 'CropSafe uses Google Gemini 2.5 Flash multimodal vision to examine crop leaves and spots in real time. You can get a 100% free API key from Google AI Studio in 30 seconds.'}
          </Typography>

          <Box sx={{ mb: 2.5, p: 1.5, bgcolor: '#F5F5F5', borderRadius: 1.5, border: '1px solid #E0E0E0' }}>
            <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', mb: 0.5, color: '#333' }}>
              📌 {isHindi ? 'निःशुल्क API Key कैसे प्राप्त करें:' : 'How to get your free key:'}
            </Typography>
            <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>
              1. {isHindi ? 'Google AI Studio खोलें:' : 'Visit Google AI Studio:'}{' '}
              <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" style={{ color: '#1976d2', fontWeight: 600 }}>
                https://aistudio.google.com/app/apikey
              </a>
            </Typography>
            <Typography variant="caption" sx={{ display: 'block' }}>
              2. {isHindi ? '"Create API Key" पर क्लिक करें और की को कॉपी करके नीचे पेस्ट करें।' : 'Click "Create API Key", copy the key (starts with AIzaSy...), and paste below.'}
            </Typography>
          </Box>

          <TextField
            fullWidth
            type="password"
            label="Gemini API Key"
            value={inputApiKey}
            onChange={(e) => setInputApiKey(e.target.value)}
            placeholder="AIzaSy..."
            helperText={isHindi ? 'आपकी API Key सर्वर पर backend/.env में सुरक्षित रूप से सहेजी जाएगी।' : 'Your key will be securely saved to backend/.env on your server.'}
            sx={{ mb: 1 }}
          />

          {keyError && (
            <Alert severity="error" sx={{ mt: 2, py: 0.5 }}>
              {keyError}
            </Alert>
          )}
          {keySuccess && (
            <Alert severity="success" sx={{ mt: 2, py: 0.5 }}>
              {keySuccess}
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setKeyModalOpen(false)} disabled={keySaving} sx={{ color: 'text.secondary' }}>
            {isHindi ? 'रद्द करें' : 'Cancel'}
          </Button>
          <Button 
            variant="contained" 
            onClick={handleSaveApiKey} 
            disabled={keySaving || !inputApiKey.trim()}
            sx={{ bgcolor: '#2E7D32', '&:hover': { bgcolor: '#1B5E20' }, fontWeight: 'bold' }}
          >
            {keySaving ? (isHindi ? 'सत्यापन जारी...' : 'Connecting...') : (isHindi ? 'सहेजें और सक्रिय करें' : 'Save & Activate')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PredictPage;