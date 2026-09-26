import React, { useState, useRef } from 'react';
import {
  Typography,
  Paper,
  Box,
  Button,
  Card,
  CardContent,
  LinearProgress,
  Alert,
  Chip,
  IconButton,
  Avatar
} from '@mui/material';
import {
  Mic as MicIcon,
  Stop as StopIcon,
  VolumeUp as VolumeIcon,
  VolumeOff as VolumeOffIcon,
  CleaningServices as CleanIcon,
  Psychology as AiIcon,
  Grass as GrassIcon
} from '@mui/icons-material';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';

interface VoicePageProps {
  language?: 'en' | 'hi';
  setLanguage?: (l: string) => void;
}

const VoicePage: React.FC<VoicePageProps> = ({
  language = 'en',
  setLanguage: propSetLanguage
}) => {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const setLanguage = (l: string) => {
    if (propSetLanguage) {
      propSetLanguage(l);
    }
  };
  const [cropType, setCropType] = useState<string>('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  const recognitionRef = useRef<any>(null);
  const speechSynthRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Cleanup function to stop any ongoing speech
  const stopSpeaking = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  // Initialize speech recognition
  const initRecognition = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert(isHindi 
        ? 'आपका ब्राउज़र स्पीच रिकग्निशन को सपोर्ट नहीं करता। कृपया Chrome या Edge का उपयोग करें।'
        : 'Your browser does not support speech recognition. Please use Chrome or Edge.');
      return null;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = language === 'hi' ? 'hi-IN' : 'en-IN';
    recognition.maxAlternatives = 1;
    
    recognition.onresult = (event: any) => {
      const text = event.results[0][0].transcript;
      setTranscript(text);
      detectCropFromText(text);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setListening(false);
    };

    recognition.onend = () => {
      setListening(false);
    };

    return recognition;
  };

  const detectCropFromText = (text: string) => {
    const lowerText = text.toLowerCase();
    const crops = [
      'गेहूं', 'wheat', 
      'चावल', 'धान', 'rice', 'paddy',
      'मक्का', 'corn', 'maize',
      'सरसों', 'mustard',
      'आलू', 'potato',
      'टमाटर', 'tomato',
      'प्याज', 'onion',
      'कपास', 'cotton',
      'गन्ना', 'sugarcane',
      'दाल', 'pulses',
      'सोयाबीन', 'soybean',
      'मूंगफली', 'peanut',
      'बाजरा', 'millet',
      'जौ', 'barley',
      'चना', 'chickpea'
    ];
    
    for (const crop of crops) {
      if (lowerText.includes(crop)) {
        setCropType(crop);
        break;
      }
    }
  };

  const handleListen = () => {
    // Stop any ongoing speech before listening
    stopSpeaking();
    
    const recognition = initRecognition();
    if (recognition) {
      recognitionRef.current = recognition;
      recognition.start();
      setListening(true);
      setTranscript('');
      setResponse('');
    }
  };

  const handleStop = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setListening(false);
    }
  };

  const handleSubmit = async () => {
    if (!transcript.trim()) return;

    // Stop any ongoing speech
    stopSpeaking();
    
    setLoading(true);
    
    try {
      const response = await axios.post(`${API_BASE_URL}/api/voice/query`, {
        query: transcript,
        language: language,
        detected_crop: cropType || 'unknown'
      });
      
      setResponse(response.data.response);
    } catch (error) {
      console.error('Voice query error:', error);
      if (language === 'hi') {
        setResponse('क्षमा करें, अभी समस्या है। कृपया बाद में प्रयास करें या किसान कॉल सेंटर 1800-180-1551 पर कॉल करें।');
      } else {
        setResponse('Sorry, there was an issue. Please try again later or call Kisan Call Center 1800-180-1551.');
      }
    } finally {
      setLoading(false);
    }
  };

  const speakResponse = () => {
    if (!response || !('speechSynthesis' in window)) return;

    // Stop any ongoing speech first
    stopSpeaking();

    // Clean the response text - remove special characters, slashes, and format for speech
    let cleanText = response
      .replace(/[-/\\_*#`~]/g, ' ')  // Replace slashes and special chars with space
      .replace(/\s+/g, ' ')             // Replace multiple spaces with single space
      .replace(/[^\w\s\u0900-\u097F]/g, '') // Keep only letters, numbers, and Hindi characters
      .trim();

    // If it's Hindi, add proper pauses and intonation markers
    if (language === 'hi') {
      cleanText = cleanText
        .replace(/\./g, '। ')  // Replace English periods with Hindi pause
        .replace(/,/g, '، ');  // Replace commas with Hindi comma
    }

    const utterance = new SpeechSynthesisUtterance(cleanText);
    
    // Set language and voice preferences
    utterance.lang = language === 'hi' ? 'hi-IN' : 'en-IN';
    utterance.rate = 0.9;  // Slightly slower for clarity
    utterance.pitch = 1;
    utterance.volume = 1;
    
    // Try to get a Hindi voice if available
    if (language === 'hi') {
      const voices = window.speechSynthesis.getVoices();
      const hindiVoice = voices.find(voice => voice.lang.includes('hi'));
      if (hindiVoice) {
        utterance.voice = hindiVoice;
      }
    }

    utterance.onstart = () => {
      setIsSpeaking(true);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
    };

    speechSynthRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const clearAll = () => {
    stopSpeaking();
    setTranscript('');
    setResponse('');
    setCropType('');
  };

  const isHindi = language === 'hi';

  const sampleQueries = [
    { hi: 'मेरे टमाटर के पौधों में झुलसा रोग है', en: 'My tomato plants have blight' },
    { hi: 'आलू की पत्तियां पीली हो रही हैं', en: 'Potato leaves are turning yellow' },
    { hi: 'मक्का में तना छेदक कीट का इलाज', en: 'Corn stem borer treatment' },
    { hi: 'प्याज की फसल में फफूंद रोग', en: 'Onion crop has fungal disease' }
  ];

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h4" sx={{ color: '#9C27B0', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
          <MicIcon fontSize="large" />
          {isHindi ? '🎤 किसान आवाज सहायक' : '🎤 Farmer Voice Assistant'}
        </Typography>

        <Box>
          <Button
            variant={language === 'en' ? 'contained' : 'outlined'}
            onClick={() => {
              stopSpeaking();
              setLanguage('en');
            }}
            size="small"
            sx={{ mr: 1 }}
          >
            🇬🇧 English
          </Button>
          <Button
            variant={language === 'hi' ? 'contained' : 'outlined'}
            onClick={() => {
              stopSpeaking();
              setLanguage('hi');
            }}
            size="small"
          >
            🇮🇳 हिन्दी
          </Button>
        </Box>
      </Box>

      {/* Detected Crop Chip */}
      {cropType && (
        <Chip
          icon={<GrassIcon />}
          label={isHindi ? `पहचानी गई फसल: ${cropType}` : `Detected Crop: ${cropType}`}
          color="secondary"
          sx={{ mb: 2 }}
        />
      )}

      {/* Main Content */}
      <Box sx={{ 
        display: 'grid',
        gridTemplateColumns: {
          xs: '1fr',
          md: '1fr 1fr'
        },
        gap: 3
      }}>
        {/* Left Column */}
        <Box>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <MicIcon color="primary" />
              {isHindi ? 'अपनी समस्या बोलें' : 'Speak Your Problem'}
            </Typography>

            {/* Sample Queries */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="caption" color="text.secondary" gutterBottom display="block">
                {isHindi ? 'उदाहरण:' : 'Examples:'}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {sampleQueries.map((query, idx) => (
                  <Chip
                    key={idx}
                    label={isHindi ? query.hi : query.en}
                    size="small"
                    variant="outlined"
                    onClick={() => {
                      stopSpeaking();
                      setTranscript(isHindi ? query.hi : query.en);
                    }}
                    sx={{ cursor: 'pointer' }}
                  />
                ))}
              </Box>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
              <IconButton
                onClick={listening ? handleStop : handleListen}
                sx={{
                  width: 100,
                  height: 100,
                  backgroundColor: listening ? '#F44336' : '#9C27B0',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: listening ? '#D32F2F' : '#7B1FA2',
                  },
                  mb: 2
                }}
              >
                {listening ? <StopIcon sx={{ fontSize: 40 }} /> : <MicIcon sx={{ fontSize: 40 }} />}
              </IconButton>
            </Box>

            <Typography variant="body2" color="text.secondary" align="center" gutterBottom>
              {listening
                ? (isHindi ? '🎤 सुन रहा हूँ... बोलिए' : '🎤 Listening... Speak now')
                : (isHindi ? 'बोलने के लिए माइक्रोफोन बटन दबाएं' : 'Press the microphone button to speak')}
            </Typography>

            {transcript && (
              <Card sx={{ mt: 3, bgcolor: '#F3E5F5' }}>
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    {isHindi ? 'आपने पूछा:' : 'You asked:'}
                  </Typography>
                  <Typography variant="body1">
                    "{transcript}"
                  </Typography>
                </CardContent>
              </Card>
            )}

            <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
              <Button
                variant="contained"
                fullWidth
                onClick={handleSubmit}
                disabled={!transcript || loading}
                sx={{ bgcolor: '#9C27B0' }}
              >
                {loading ? (isHindi ? 'AI सोच रहा है...' : 'AI is thinking...') : (isHindi ? 'सवाल पूछें' : 'Ask Question')}
              </Button>
              <Button
                variant="outlined"
                onClick={clearAll}
                disabled={!transcript && !response}
                startIcon={<CleanIcon />}
              >
                {isHindi ? 'साफ करें' : 'Clear'}
              </Button>
            </Box>
          </Paper>
        </Box>

        {/* Right Column */}
        <Box>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AiIcon color="primary" />
                {isHindi ? 'AI सलाह' : 'AI Advice'}
              </Typography>
              
              {/* Stop Speaking Button - Always visible when speaking */}
              {isSpeaking && (
                <Button
                  variant="contained"
                  color="error"
                  startIcon={<VolumeOffIcon />}
                  onClick={stopSpeaking}
                  size="small"
                >
                  {isHindi ? 'बंद करें' : 'Stop'}
                </Button>
              )}
            </Box>

            {loading && (
              <Box sx={{ width: '100%', mt: 4 }}>
                <LinearProgress />
                <Typography variant="body2" sx={{ mt: 2 }} align="center">
                  {isHindi ? 'AI आपकी समस्या का विश्लेषण कर रहा है...' : 'AI is analyzing your problem...'}
                </Typography>
              </Box>
            )}

            {!loading && !response && (
              <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
                <Avatar sx={{ width: 60, height: 60, bgcolor: '#F3E5F5', mb: 2, mx: 'auto' }}>
                  <GrassIcon sx={{ fontSize: 30, color: '#9C27B0' }} />
                </Avatar>
                <Typography variant="body1">
                  {isHindi
                    ? 'अपना सवाल बोलें और AI से तुरंत जवाब पाएं'
                    : 'Speak your question and get instant AI response'}
                </Typography>
              </Box>
            )}

            {response && !loading && (
              <Box>
                <Card sx={{ bgcolor: '#F3E5F5', mb: 3 }}>
                  <CardContent>
                    <Typography variant="body1" sx={{ whiteSpace: 'pre-line', fontFamily: language === 'hi' ? 'inherit' : 'inherit' }}>
                      {response}
                    </Typography>
                  </CardContent>
                </Card>

                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button
                    variant="contained"
                    fullWidth
                    startIcon={isSpeaking ? <VolumeOffIcon /> : <VolumeIcon />}
                    onClick={isSpeaking ? stopSpeaking : speakResponse}
                    sx={{ bgcolor: isSpeaking ? '#F44336' : '#9C27B0' }}
                  >
                    {isSpeaking 
                      ? (isHindi ? '🔊 रोकें' : '🔊 Stop') 
                      : (isHindi ? '🔊 सुनें' : '🔊 Listen')}
                  </Button>
                </Box>

                <Alert severity="info" sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    📞 {isHindi ? 'आपातकालीन किसान हेल्पलाइन' : 'Emergency Farmer Helpline'}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Kisan Call Center:</strong> 1800-180-1551
                  </Typography>
                </Alert>
              </Box>
            )}
          </Paper>
        </Box>
      </Box>

      {/* Tips Section */}
      <Paper sx={{ mt: 3, p: 2, bgcolor: '#F3E5F5' }}>
        <Typography variant="subtitle2" gutterBottom>
          💡 {isHindi ? 'सुझाव:' : 'Tips:'}
        </Typography>
        <Box sx={{ 
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' },
          gap: 2
        }}>
          <Typography variant="body2" color="text.secondary">
            • {isHindi ? 'फसल का नाम बताएं' : 'Mention crop name'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • {isHindi ? 'लक्षण बताएं' : 'Describe symptoms'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • {isHindi ? 'अपना स्थान बताएं' : 'Tell your location'}
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

// Add type declarations for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export default VoicePage;
