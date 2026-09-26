import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  IconButton,
  Alert,
  CircularProgress,
  Divider,
  Paper,
  Tooltip,
  InputAdornment,
  Slider,
  Checkbox,
  FormControlLabel,
  Badge,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import {
  Add as AddIcon,
  MyLocation as GpsIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  ThumbUp as ThumbUpIcon,
  ChatBubbleOutline as CommentIcon,
  Close as CloseIcon,
  FilterList as FilterIcon,
  Send as SendIcon,
  Agriculture as AgriIcon,
  Place as PlaceIcon,
  WhatsApp as WhatsAppIcon,
  Sms as SmsIcon,
  WarningAmber as EmergencyIcon,
  Notifications as NotificationIcon,
  OpenInNew as OpenInNewIcon,
  ContentCopy as CopyIcon,
  Check as CheckIcon
} from '@mui/icons-material';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

import {
  getOutbreakReports,
  submitOutbreakReport,
  upvoteOutbreakReport,
  addReportComment,
  getNearbyOutbreakAlerts,
  OutbreakReport,
  CreateReportPayload,
  NearbyFarmer,
  DispatchAlertsResponse,
  getReportNearbyFarmers,
  dispatchReportAlerts,
  getReportDispatchedHistory,
  getFarmerEmergencyNotifications
} from '../services/api';
import { useFarmer } from '../context/FarmerContext';

interface MapPageProps {
  language?: string;
}

// User Live Farm Location Pin Generator
const createUserLocationIcon = () => {
  return L.divIcon({
    className: 'custom-user-marker',
    html: `
      <div class="user-location-pin" style="
        background: linear-gradient(135deg, #2563EB, #1D4ED8);
        width: 38px;
        height: 38px;
        border-radius: 50%;
        border: 3px solid #FFFFFF;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 16px rgba(37, 99, 235, 0.45);
        color: #FFFFFF;
        font-size: 18px;
        cursor: pointer;
      ">
        📍
      </div>
    `,
    iconSize: [38, 38],
    iconAnchor: [19, 19],
    popupAnchor: [0, -20]
  });
};

// Custom Marker Generator
const createOutbreakIcon = (severity: string, isAiVerified: boolean) => {
  const color =
    severity.toLowerCase() === 'high'
      ? '#DC2626'
      : severity.toLowerCase() === 'moderate'
      ? '#F59E0B'
      : '#10B981';

  const pulseClass =
    severity.toLowerCase() === 'high'
      ? 'outbreak-pin-high'
      : severity.toLowerCase() === 'moderate'
      ? 'outbreak-pin-moderate'
      : '';

  return L.divIcon({
    className: 'custom-outbreak-marker',
    html: `
      <div class="${pulseClass}" style="
        background-color: ${color};
        width: 32px;
        height: 32px;
        border-radius: 50%;
        border: 3px solid #FFFFFF;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 12px rgba(0,0,0,0.35);
        color: #FFFFFF;
        font-size: 14px;
        font-weight: bold;
        cursor: pointer;
      ">
        ${severity.toLowerCase() === 'high' ? '⚠️' : '🌾'}
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -18]
  });
};

// Key agricultural hubs for testing / navigation
const farmingHubs = [
  { name: 'Vadodara (Gujarat)', nameHi: 'वडोदरा (गुजरात)', lat: 22.3072, lon: 73.1812, tag: 'Rice Blast' },
  { name: 'Anand (Gujarat)', nameHi: 'आणंद (गुजरात)', lat: 22.5645, lon: 72.9289, tag: 'Wheat Rust' },
  { name: 'Karnal (Haryana)', nameHi: 'करनाल (हरियाणा)', lat: 29.6857, lon: 76.9905, tag: 'Yellow Rust' },
  { name: 'Ludhiana (Punjab)', nameHi: 'लुधियाना (पंजाब)', lat: 30.9010, lon: 75.8573, tag: 'Wheat Rust' },
  { name: 'Meerut (UP)', nameHi: 'मेरठ (उ.प्र.)', lat: 28.9845, lon: 77.7064, tag: 'Leaf Blight' },
  { name: 'Patna (Bihar)', nameHi: 'पटना (बिहार)', lat: 25.5941, lon: 85.1376, tag: 'Bacterial Blight' },
  { name: 'Burdwan (WB)', nameHi: 'बर्दवान (पं.बंगाल)', lat: 23.2324, lon: 87.8615, tag: 'Blast Disease' },
];

// Map Click Listener Component
function MapClickHandler({ onLocationSelect }: { onLocationSelect: (lat: number, lon: number) => void }) {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    }
  });
  return null;
}

// Map Recenter Helper Component
function ChangeView({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

export const MapPage: React.FC<MapPageProps> = ({ language = 'en' }) => {
  const { farmer, isLoggedIn } = useFarmer();
  const isHindi = language === 'hi';

  // Outbreak Reports State
  const [reports, setReports] = useState<OutbreakReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter States
  const [cropFilter, setCropFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<'all' | 'High' | 'Moderate' | 'Low'>('all');
  const [daysFilter, setDaysFilter] = useState<number>(60);

  const getCropHindiName = (crop: string) => {
    const map: Record<string, string> = {
      wheat: 'गेहूं',
      rice: 'धान / चावल',
      cotton: 'कपास',
      potato: 'आलू',
      tomato: 'टमाटर',
      maize: 'मक्का',
      sugarcane: 'गन्ना',
      mustard: 'सरसों',
      soybean: 'सोयाबीन',
      chili: 'मिर्च',
      onion: 'प्याज'
    };
    return map[crop?.toLowerCase()] || crop;
  };

  // Map Coordinates & GPS
  const [mapCenter, setMapCenter] = useState<[number, number]>([28.6139, 77.2090]); // New Delhi/North India
  const [mapZoom, setMapZoom] = useState<number>(6);
  const [userCoords, setUserCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [nearbyAlerts, setNearbyAlerts] = useState<OutbreakReport[]>([]);
  const [gpsDetecting, setGpsDetecting] = useState(false);
  const [locationStatus, setLocationStatus] = useState<{
    type: 'success' | 'warning' | 'info' | 'error';
    message: string;
    regionName?: string;
  } | null>(null);

  // Search Location State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchingLocation, setSearchingLocation] = useState(false);

  // Report Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newReport, setNewReport] = useState<CreateReportPayload>({
    crop: 'rice',
    disease_name: 'Blast Disease',
    disease_name_hi: 'झोंका रोग',
    severity: 'Moderate',
    lat: 22.3072,
    lon: 73.1812,
    district: 'Vadodara',
    state: 'Gujarat',
    description: '',
    reporter_name: farmer?.name || 'Farmer',
    reporter_phone: farmer?.phone || '',
    is_ai_verified: false
  });

  // Comment Modal / Inline State
  const [activeCommentId, setActiveCommentId] = useState<number | null>(null);
  const [commentText, setCommentText] = useState('');
  const [commenting, setCommenting] = useState(false);

  // Emergency Alert Broadcast Modal State (30-40km SMS & WhatsApp)
  const [alertModalOpen, setAlertModalOpen] = useState(false);
  const [alertReport, setAlertReport] = useState<OutbreakReport | null>(null);
  const [alertRadius, setAlertRadius] = useState<number>(35);
  const [nearbyFarmers, setNearbyFarmers] = useState<NearbyFarmer[]>([]);
  const [loadingNearbyFarmers, setLoadingNearbyFarmers] = useState(false);
  const [channelSms, setChannelSms] = useState(true);
  const [channelWhatsApp, setChannelWhatsApp] = useState(true);
  const [customAlertNote, setCustomAlertNote] = useState('');
  const [dispatchingAlerts, setDispatchingAlerts] = useState(false);
  const [dispatchResult, setDispatchResult] = useState<DispatchAlertsResponse | null>(null);
  const [copiedLinkIndex, setCopiedLinkIndex] = useState<number | null>(null);

  // Farmer Emergency Notifications Drawer State
  const [notifDrawerOpen, setNotifDrawerOpen] = useState(false);
  const [farmerNotifications, setFarmerNotifications] = useState<any[]>([]);
  const [loadingNotifs, setLoadingNotifs] = useState(false);

  // Open Alert Broadcast Modal for a selected report
  const handleOpenAlertModal = (report: OutbreakReport) => {
    setAlertReport(report);
    setAlertRadius(35);
    setDispatchResult(null);
    setCustomAlertNote('');
    setAlertModalOpen(true);
    fetchNearbyFarmers(report.id, 35);
  };

  // Fetch nearby farmers dynamically based on selected radius
  const fetchNearbyFarmers = async (reportId: number, radius: number) => {
    setLoadingNearbyFarmers(true);
    const res = await getReportNearbyFarmers(reportId, radius);
    if (res.success && res.data) {
      setNearbyFarmers(res.data.farmers || []);
    } else {
      setNearbyFarmers([]);
    }
    setLoadingNearbyFarmers(false);
  };

  // Dispatch Emergency Alerts across SMS and WhatsApp
  const handleDispatchAlerts = async () => {
    if (!alertReport) return;
    const channels: string[] = [];
    if (channelSms) channels.push('SMS');
    if (channelWhatsApp) channels.push('WHATSAPP');

    if (channels.length === 0) {
      alert(isHindi ? 'कृपया कम से कम एक चैनल (SMS या WhatsApp) चुनें।' : 'Please select at least one channel (SMS or WhatsApp).');
      return;
    }

    setDispatchingAlerts(true);
    const res = await dispatchReportAlerts(alertReport.id, {
      radius_km: alertRadius,
      channels,
      custom_note: customAlertNote.trim() || undefined
    });

    if (res.success && res.data) {
      setDispatchResult(res.data);
    } else {
      alert(res.error || 'Failed to dispatch alerts');
    }
    setDispatchingAlerts(false);
  };

  // Load Farmer Emergency Notifications if logged in
  const loadFarmerNotifications = async () => {
    if (!farmer?.id) return;
    setLoadingNotifs(true);
    const res = await getFarmerEmergencyNotifications(farmer.id);
    if (res.success && res.data) {
      setFarmerNotifications(res.data.notifications || []);
    }
    setLoadingNotifs(false);
  };

  // Fetch Reports
  const loadReports = async () => {
    setLoading(true);
    setError(null);
    const res = await getOutbreakReports({
      crop: cropFilter === 'all' ? undefined : cropFilter,
      severity: severityFilter === 'all' ? undefined : severityFilter,
      days: daysFilter
    });
    if (res.success && res.data) {
      setReports(res.data.reports || []);
    } else {
      setError(res.error || 'Failed to load outbreak reports');
    }
    setLoading(false);
  };

  useEffect(() => {
    loadReports();
  }, [cropFilter, severityFilter, daysFilter]);

  // Apply location: drop user pin, draw 60km perimeter, center map, and fetch proximity warnings
  const applyLocation = async (lat: number, lon: number, regionName?: string) => {
    setGpsDetecting(true);
    setUserCoords({ lat, lon });
    setMapCenter([lat, lon]);
    setMapZoom(10);

    // Sync newReport coordinates for the reporting modal too
    setNewReport((prev) => ({
      ...prev,
      lat,
      lon,
      district: regionName ? regionName.split(',')[0].trim() : prev.district,
      state: regionName && regionName.includes(',') ? regionName.split(',')[1].trim() : prev.state
    }));

    try {
      const alertRes = await getNearbyOutbreakAlerts(lat, lon, 60);
      if (alertRes.success && alertRes.data) {
        const found = alertRes.data.reports || [];
        setNearbyAlerts(found);
        if (found.length > 0) {
          setLocationStatus({
            type: 'warning',
            regionName,
            message: isHindi
              ? `⚠️ निकटवर्ती चेतावनी: ${regionName ? `[${regionName}]` : ''} 60 किमी के दायरे में ${found.length} फसल रोग प्रकोप सक्रिय हैं!`
              : `⚠️ Proximity Warning: ${regionName ? `Around ${regionName}, ` : ''}${found.length} active disease outbreak(s) detected within 60 km!`
          });
        } else {
          setLocationStatus({
            type: 'success',
            regionName,
            message: isHindi
              ? `✅ सुरक्षित क्षेत्र: ${regionName ? `[${regionName}]` : ''} (${lat.toFixed(2)}, ${lon.toFixed(2)}) 60 किमी के दायरे में कोई सक्रिय प्रकोप दर्ज नहीं है।`
              : `✅ Safe Zone: ${regionName ? `${regionName} ` : ''}(${lat.toFixed(2)}, ${lon.toFixed(2)}) is identified. No active outbreaks within 60 km!`
          });
        }
      } else {
        setLocationStatus({
          type: 'info',
          regionName,
          message: isHindi
            ? `📍 आपका स्थान (${lat.toFixed(2)}, ${lon.toFixed(2)}) मानचित्र पर चिह्नित किया गया है।`
            : `📍 Your location (${lat.toFixed(2)}, ${lon.toFixed(2)}) is now marked on the map.`
        });
      }
    } catch (e) {
      console.error('Proximity alert error:', e);
    } finally {
      setGpsDetecting(false);
    }
  };

  // Search city/district via OpenStreetMap Nominatim
  const handleSearchLocation = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearchingLocation(true);
    try {
      const q = encodeURIComponent(searchQuery.trim() + ', India');
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${q}&limit=1`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          const lat = parseFloat(data[0].lat);
          const lon = parseFloat(data[0].lon);
          const parts = data[0].display_name.split(',');
          const displayName = parts.slice(0, 3).join(',').trim();
          await applyLocation(lat, lon, displayName);
          setSearchQuery('');
        } else {
          alert(isHindi ? 'स्थान नहीं मिला। कृपया दूसरा शहर या जिला लिखें।' : 'Location not found in India. Please check spelling or try another city/district.');
        }
      }
    } catch (err) {
      console.error('Location search error:', err);
    } finally {
      setSearchingLocation(false);
    }
  };

  // Detect User GPS with instant IP network fallback (auto-detects Vadodara, Gujarat!)
  const detectLocation = async () => {
    setGpsDetecting(true);
    setLocationStatus({
      type: 'info',
      message: isHindi
        ? '🛰️ उपग्रह GPS और नेटवर्क से आपका स्थान खोजा जा रहा है...'
        : '🛰️ Detecting your location via GPS and network...'
    });

    const tryIpLocation = async () => {
      try {
        const ipRes = await fetch('https://get.geojs.io/v1/ip/geo.json');
        if (ipRes.ok) {
          const ipData = await ipRes.json();
          const lat = parseFloat(ipData.latitude);
          const lon = parseFloat(ipData.longitude);
          const cityName = ipData.city || 'Vadodara';
          const regionName = ipData.region || 'Gujarat';
          const locName = `${cityName}, ${regionName}`;
          if (!isNaN(lat) && !isNaN(lon)) {
            await applyLocation(lat, lon, locName);
            return true;
          }
        }
      } catch (ipErr) {
        console.warn('IP location fetch failed:', ipErr);
      }
      return false;
    };

    if (!navigator.geolocation) {
      const ok = await tryIpLocation();
      if (!ok) {
        await applyLocation(22.3072, 73.1812, 'Vadodara, Gujarat');
      }
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        await applyLocation(latitude, longitude, isHindi ? 'आपका खेत (GPS)' : 'Your Farm (GPS)');
      },
      async (err) => {
        console.warn('GPS unavailable, using IP network location:', err);
        const ok = await tryIpLocation();
        if (!ok) {
          // Fallback to user's location Vadodara, Gujarat
          await applyLocation(22.3072, 73.1812, isHindi ? 'वडोदरा, गुजरात' : 'Vadodara, Gujarat');
          setLocationStatus({
            type: 'info',
            message: isHindi
              ? `📍 वडोदरा, गुजरात पर स्थापित किया गया। आप ऊपर खोज बार में अपना गाँव/शहर भी खोज सकते हैं!`
              : `📍 Located at Vadodara, Gujarat. You can also search your exact district or click on the map!`
          });
        }
      },
      { timeout: 5000, enableHighAccuracy: true }
    );
  };

  // Upvote report
  const handleUpvote = async (reportId: number) => {
    const res = await upvoteOutbreakReport(reportId);
    if (res.success) {
      setReports((prev) =>
        prev.map((r) => (r.id === reportId ? { ...r, upvotes: res.data.upvotes } : r))
      );
    }
  };

  // Submit new comment
  const handleAddComment = async (reportId: number) => {
    if (!commentText.trim()) return;
    setCommenting(true);
    const commenterName = farmer?.name || (isHindi ? 'स्थानीय किसान' : 'Local Farmer');
    const res = await addReportComment(reportId, commenterName, commentText.trim());
    if (res.success) {
      setCommentText('');
      setActiveCommentId(null);
      loadReports();
    }
    setCommenting(false);
  };

  // Submit new report
  const handleCreateReport = async () => {
    if (!newReport.disease_name || !newReport.district || !newReport.state) {
      alert(isHindi ? 'कृपया सभी आवश्यक फ़ील्ड भरें।' : 'Please fill all required fields.');
      return;
    }
    setSubmitting(true);
    const payload: CreateReportPayload = {
      ...newReport,
      farmer_id: farmer?.id,
      reporter_name: farmer?.name || newReport.reporter_name || 'Farmer',
      reporter_phone: farmer?.phone || newReport.reporter_phone
    };

    const res = await submitOutbreakReport(payload);
    if (res.success) {
      setModalOpen(false);
      loadReports();
      // Center map on new report
      setMapCenter([newReport.lat, newReport.lon]);
      setMapZoom(10);

      // Prompt to immediately alert nearby farmers within 30-40 km
      if (res.data?.report_id) {
        handleOpenAlertModal({
          id: res.data.report_id,
          crop: (newReport.crop === 'rice' ? 'rice' : 'wheat') as 'wheat' | 'rice',
          disease_name: newReport.disease_name,
          disease_name_hi: newReport.disease_name_hi,
          severity: (newReport.severity === 'High' || newReport.severity === 'Low' ? newReport.severity : 'Moderate') as 'Low' | 'Moderate' | 'High',
          lat: newReport.lat,
          lon: newReport.lon,
          district: newReport.district,
          state: newReport.state,
          reporter_name: newReport.reporter_name || 'Local Farmer',
          description: newReport.description,
          upvotes: 0,
          is_ai_verified: Boolean(newReport.is_ai_verified),
          created_at: new Date().toISOString()
        });
      }
    } else {
      alert(res.error || 'Failed to submit report');
    }
    setSubmitting(false);
  };

  // Common crop diseases for dropdown
  const commonDiseases = useMemo(() => {
    switch (newReport.crop?.toLowerCase()) {
      case 'wheat':
        return [
          { name: 'Yellow Rust', nameHi: 'पीला रतुआ' },
          { name: 'Brown Rust', nameHi: 'भूरा रतुआ' },
          { name: 'Leaf Blight', nameHi: 'पत्ती झुलसा' },
          { name: 'Powdery Mildew', nameHi: 'चूर्णिल आसिता' },
          { name: 'Loose Smut', nameHi: 'कंडुआ रोग' }
        ];
      case 'rice':
        return [
          { name: 'Blast Disease', nameHi: 'झोंका रोग' },
          { name: 'Brown Spot', nameHi: 'भूरा धब्बा' },
          { name: 'Sheath Blight', nameHi: 'शीथ ब्लाइट' },
          { name: 'Bacterial Leaf Blight', nameHi: 'जीवाणु पत्ती झुलसा' }
        ];
      case 'cotton':
        return [
          { name: 'Bacterial Blight', nameHi: 'जीवाणु झुलसा' },
          { name: 'Cotton Leaf Curl Virus', nameHi: 'पत्ती मरोड़ वायरस' },
          { name: 'Boll Rot', nameHi: 'टिंडा सड़न' },
          { name: 'Alternaria Leaf Spot', nameHi: 'अल्टरनेरिया पत्ती धब्बा' }
        ];
      case 'potato':
        return [
          { name: 'Late Blight', nameHi: 'पिछेता झुलसा' },
          { name: 'Early Blight', nameHi: 'अगेती झुलसा' },
          { name: 'Black Scurf', nameHi: 'काली खुरंड' },
          { name: 'Common Scab', nameHi: 'साधारण खुरंड' }
        ];
      case 'tomato':
        return [
          { name: 'Early Blight', nameHi: 'अगेती झुलसा' },
          { name: 'Late Blight', nameHi: 'पिछेता झुलसा' },
          { name: 'Leaf Curl Virus', nameHi: 'पत्ती मरोड़ विषाणु' },
          { name: 'Bacterial Spot', nameHi: 'जीवाणु धब्बा' }
        ];
      case 'maize':
        return [
          { name: 'Fall Armyworm', nameHi: 'फॉल आर्मीवर्म' },
          { name: 'Turcicum Leaf Blight', nameHi: 'टर्सिकम पत्ती झुलसा' },
          { name: 'Maydis Leaf Blight', nameHi: 'मेयडिस झुलसा' }
        ];
      case 'sugarcane':
        return [
          { name: 'Red Rot', nameHi: 'लाल सड़न' },
          { name: 'Smut', nameHi: 'कंडुआ' },
          { name: 'Wilt Disease', nameHi: 'उकठा रोग' }
        ];
      default:
        return [
          { name: 'Fungal Blight', nameHi: 'फफूंद झुलसा' },
          { name: 'Leaf Spot', nameHi: 'पत्ती धब्बा' },
          { name: 'Powdery Mildew', nameHi: 'चूर्णिल आसिता' },
          { name: 'Pest Infestation', nameHi: 'कीट प्रकोप' }
        ];
    }
  }, [newReport.crop]);

  return (
    <Box sx={{ width: '100%', pb: 6 }}>
      {/* HEADER SECTION */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 800, color: '#1B5E20', mb: 0.5 }}>
              🗺️ {isHindi ? 'फसल रोग प्रकोप मानचित्र' : 'Live Crop Disease Outbreak Map'}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {isHindi
                ? 'किसानों और कृषि विशेषज्ञों द्वारा रिपोर्ट की गई लाइव फसल बीमारियों का सामुदायिक नक्शा'
                : 'Crowdsourced disease sightings from farmers and agronomists across India in real-time'}
            </Typography>
          </Box>

          {/* Action CTAs */}
          <Stack direction="row" spacing={1.5} flexWrap="wrap" alignItems="center">
            {/* Notification Drawer Button */}
            <Tooltip title={isHindi ? 'मेरी प्राप्त चेतावनियाँ (SMS/WhatsApp)' : 'My Received Alerts'}>
              <IconButton
                onClick={() => {
                  loadFarmerNotifications();
                  setNotifDrawerOpen(true);
                }}
                sx={{
                  border: '1px solid #CBD5E1',
                  borderRadius: 3,
                  bgcolor: '#FFFFFF',
                  color: '#1E293B',
                  px: 1.5,
                  py: 1,
                  '&:hover': { bgcolor: '#F8FAFC' }
                }}
              >
                <Badge badgeContent={farmerNotifications.length} color="error">
                  <NotificationIcon sx={{ color: '#D97706', fontSize: 22 }} />
                </Badge>
              </IconButton>
            </Tooltip>

            <Button
              variant="outlined"
              onClick={detectLocation}
              startIcon={gpsDetecting ? <CircularProgress size={18} /> : <GpsIcon />}
              sx={{
                borderColor: '#2E7D32',
                color: '#2E7D32',
                fontWeight: 700,
                borderRadius: 3,
                px: 2.5
              }}
            >
              {isHindi ? 'मेरा इलाका खोजें' : 'Locate Near Me'}
            </Button>

            <Button
              variant="contained"
              onClick={() => setModalOpen(true)}
              startIcon={<AddIcon />}
              sx={{
                bgcolor: '#2E7D32',
                '&:hover': { bgcolor: '#1B5E20' },
                color: '#FFFFFF',
                fontWeight: 700,
                borderRadius: 3,
                px: 2.8,
                boxShadow: '0 4px 14px rgba(46, 125, 50, 0.3)'
              }}
            >
              {isHindi ? 'रोग रिपोर्ट करें' : 'Report Disease'}
            </Button>
          </Stack>
        </Box>

        {/* SEARCH BAR & INTERACTION BAR */}
        <Box
          sx={{
            mt: 2.5,
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            gap: 2,
            alignItems: { xs: 'stretch', md: 'center' },
            justifyContent: 'space-between'
          }}
        >
          <Box
            component="form"
            onSubmit={handleSearchLocation}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              flex: 1,
              maxWidth: { xs: '100%', md: 520 }
            }}
          >
            <TextField
              size="small"
              fullWidth
              placeholder={
                isHindi
                  ? 'अपना शहर, जिला या गांव खोजें (उदा: Vadodara, Anand, Karnal)...'
                  : 'Search your city, district or village (e.g. Vadodara, Anand)...'
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PlaceIcon sx={{ color: '#2E7D32', fontSize: 20 }} />
                  </InputAdornment>
                ),
                sx: { borderRadius: 3, bgcolor: '#FFFFFF' }
              }}
            />
            <Button
              type="submit"
              variant="contained"
              disabled={searchingLocation || !searchQuery.trim()}
              sx={{
                bgcolor: '#2E7D32',
                '&:hover': { bgcolor: '#1B5E20' },
                borderRadius: 3,
                px: 2.5,
                fontWeight: 700,
                whiteSpace: 'nowrap'
              }}
            >
              {searchingLocation ? <CircularProgress size={18} color="inherit" /> : (isHindi ? 'खोजें' : 'Search')}
            </Button>
          </Box>

          <Typography
            variant="caption"
            sx={{
              color: '#475569',
              display: 'flex',
              alignItems: 'center',
              gap: 0.6,
              fontWeight: 600,
              bgcolor: '#F1F5F9',
              py: 0.8,
              px: 1.5,
              borderRadius: 2
            }}
          >
            💡 {isHindi ? 'नक्शे पर कहीं भी क्लिक करके अपना सटीक खेत चुन सकते हैं' : 'Click anywhere on the map to pin your exact farm location'}
          </Typography>
        </Box>
      </Box>

      {/* DYNAMIC LOCATION STATUS BANNER */}
      {locationStatus && (
        <Alert
          severity={locationStatus.type}
          onClose={() => setLocationStatus(null)}
          icon={
            locationStatus.type === 'warning' ? <WarningIcon fontSize="inherit" /> :
            locationStatus.type === 'success' ? <CheckCircleIcon fontSize="inherit" /> :
            <GpsIcon fontSize="inherit" />
          }
          sx={{
            mb: 2.5,
            borderRadius: 3,
            fontWeight: 600,
            boxShadow: '0 2px 10px rgba(0,0,0,0.06)'
          }}
          action={
            nearbyAlerts.length > 0 ? (
              <Button
                color="inherit"
                size="small"
                onClick={() => {
                  if (nearbyAlerts[0]) {
                    setMapCenter([nearbyAlerts[0].lat, nearbyAlerts[0].lon]);
                    setMapZoom(11);
                  }
                }}
                sx={{ fontWeight: 700 }}
              >
                {isHindi ? 'प्रकोप देखें' : 'View Outbreaks'}
              </Button>
            ) : undefined
          }
        >
          {locationStatus.message}
        </Alert>
      )}

      {/* QUICK REGION HOTSPOTS BAR */}
      <Card sx={{ mb: 2.5, borderRadius: 3, bgcolor: '#F8FAFC', border: '1px solid #E2E8F0', boxShadow: 'none' }}>
        <CardContent sx={{ p: '10px 16px !important' }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }}>
            <Typography variant="caption" sx={{ fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: 0.5, whiteSpace: 'nowrap' }}>
              ⚡ {isHindi ? 'त्वरित क्षेत्र परीक्षण:' : 'Quick Farming Hubs:'}
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ gap: 0.8 }}>
              {farmingHubs.map((hub) => {
                const isSelected = userCoords && Math.abs(userCoords.lat - hub.lat) < 0.01;
                return (
                  <Chip
                    key={hub.name}
                    size="small"
                    clickable
                    icon={<GpsIcon sx={{ fontSize: 13 }} />}
                    label={`${isHindi ? hub.nameHi : hub.name} (${hub.tag})`}
                    onClick={() => applyLocation(hub.lat, hub.lon, isHindi ? hub.nameHi : hub.name)}
                    sx={{
                      fontWeight: 600,
                      fontSize: '0.74rem',
                      bgcolor: isSelected ? '#DBEAFE' : '#FFFFFF',
                      borderColor: isSelected ? '#2563EB' : '#CBD5E1',
                      color: isSelected ? '#1D4ED8' : '#334155',
                      borderWidth: 1,
                      borderStyle: 'solid',
                      '&:hover': { bgcolor: '#EFF6FF' }
                    }}
                  />
                );
              })}
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      {/* FILTER CONTROLS BAR */}
      <Card sx={{ mb: 3, borderRadius: 3, boxShadow: '0 2px 10px rgba(0,0,0,0.04)', border: '1px solid #E5E7EB' }}>
        <CardContent sx={{ p: '16px 20px !important' }}>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            justifyContent="space-between"
            alignItems={{ xs: 'flex-start', md: 'center' }}
            spacing={2}
          >
            {/* Crop Filter */}
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
              <Typography variant="body2" sx={{ fontWeight: 700, color: '#374151', mr: 0.5 }}>
                <FilterIcon sx={{ fontSize: 18, verticalAlign: 'middle', mr: 0.5 }} />
                {isHindi ? 'फसल:' : 'Crop:'}
              </Typography>
              <TextField
                select
                size="small"
                value={cropFilter}
                onChange={(e) => setCropFilter(e.target.value)}
                sx={{ minWidth: 160 }}
              >
                <MenuItem value="all">🌱 {isHindi ? 'सभी फसलें (All)' : 'All Crops'}</MenuItem>
                <MenuItem value="wheat">🌾 {isHindi ? 'गेहूं (Wheat)' : 'Wheat'}</MenuItem>
                <MenuItem value="rice">🍚 {isHindi ? 'धान / चावल (Rice)' : 'Rice'}</MenuItem>
                <MenuItem value="cotton">🌿 {isHindi ? 'कपास (Cotton)' : 'Cotton'}</MenuItem>
                <MenuItem value="potato">🥔 {isHindi ? 'आलू (Potato)' : 'Potato'}</MenuItem>
                <MenuItem value="tomato">🍅 {isHindi ? 'टमाटर (Tomato)' : 'Tomato'}</MenuItem>
                <MenuItem value="maize">🌽 {isHindi ? 'मक्का (Maize)' : 'Maize'}</MenuItem>
                <MenuItem value="sugarcane">🎋 {isHindi ? 'गन्ना (Sugarcane)' : 'Sugarcane'}</MenuItem>
              </TextField>
            </Stack>

            {/* Severity & Timeframe */}
            <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
              <TextField
                select
                size="small"
                label={isHindi ? 'गंभीरता' : 'Severity'}
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value as any)}
                sx={{ minWidth: 130 }}
              >
                <MenuItem value="all">{isHindi ? 'सभी' : 'All'}</MenuItem>
                <MenuItem value="High">{isHindi ? '🔴 उच्च (High)' : '🔴 High'}</MenuItem>
                <MenuItem value="Moderate">{isHindi ? '🟠 मध्यम (Moderate)' : '🟠 Moderate'}</MenuItem>
                <MenuItem value="Low">{isHindi ? '🟡 कम (Low)' : '🟡 Low'}</MenuItem>
              </TextField>

              <TextField
                select
                size="small"
                label={isHindi ? 'समय सीमा' : 'Timeframe'}
                value={daysFilter}
                onChange={(e) => setDaysFilter(Number(e.target.value))}
                sx={{ minWidth: 140 }}
              >
                <MenuItem value={7}>{isHindi ? 'पिछले 7 दिन' : 'Last 7 Days'}</MenuItem>
                <MenuItem value={30}>{isHindi ? 'पिछले 30 दिन' : 'Last 30 Days'}</MenuItem>
                <MenuItem value={60}>{isHindi ? 'पिछले 60 दिन' : 'Last 60 Days'}</MenuItem>
              </TextField>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      {/* MAP CONTAINER */}
      <Paper
        elevation={0}
        sx={{
          height: { xs: 480, sm: 540, md: 620 },
          borderRadius: 4,
          overflow: 'hidden',
          border: '1px solid #E5E7EB',
          boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
          position: 'relative'
        }}
      >
        {loading && (
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              bgcolor: 'rgba(255,255,255,0.7)',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              gap: 1.5
            }}
          >
            <CircularProgress color="success" />
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#2E7D32' }}>
              {isHindi ? 'मानचित्र डेटा लोड हो रहा है...' : 'Loading outbreak map...'}
            </Typography>
          </Box>
        )}

        <MapContainer
          center={mapCenter}
          zoom={mapZoom}
          scrollWheelZoom={true}
          style={{ width: '100%', height: '100%' }}
        >
          <ChangeView center={mapCenter} zoom={mapZoom} />
          <MapClickHandler
            onLocationSelect={(lat, lon) =>
              applyLocation(lat, lon, isHindi ? 'मानचित्र पर चिह्नित खेत' : 'Selected Farm Location')
            }
          />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* User Live Farm Location Marker & Proximity Circle */}
          {userCoords && (
            <>
              <Marker
                position={[userCoords.lat, userCoords.lon]}
                icon={createUserLocationIcon()}
                zIndexOffset={1000}
              >
                <Popup>
                  <Box sx={{ p: 0.5, textAlign: 'center' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#1D4ED8', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                      📍 {isHindi ? 'आपका खेत / स्थान' : 'Your Farm / Location'}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#4B5563', display: 'block', mt: 0.5 }}>
                      {userCoords.lat.toFixed(4)}, {userCoords.lon.toFixed(4)}
                    </Typography>
                    <Chip
                      size="small"
                      label={isHindi ? '60 किमी निगरानी घेरा' : '60 km Surveillance Zone'}
                      color="primary"
                      variant="outlined"
                      sx={{ mt: 1, fontSize: '0.72rem', height: 22, fontWeight: 700 }}
                    />
                  </Box>
                </Popup>
              </Marker>
              <Circle
                center={[userCoords.lat, userCoords.lon]}
                radius={60000}
                pathOptions={{
                  color: '#2563EB',
                  fillColor: '#3B82F6',
                  fillOpacity: 0.12,
                  weight: 2,
                  dashArray: '6, 6'
                }}
              />
            </>
          )}

          {/* Outbreak Markers */}
          {reports.map((report) => (
            <Marker
              key={report.id}
              position={[report.lat, report.lon]}
              icon={createOutbreakIcon(report.severity, Boolean(report.is_ai_verified))}
            >
              <Popup>
                <Box sx={{ minWidth: 240, maxWidth: 280, p: 0.5 }}>
                  {/* Disease Title & Crop */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#111827' }}>
                      {isHindi && report.disease_name_hi ? report.disease_name_hi : report.disease_name}
                    </Typography>
                    <Chip
                      size="small"
                      label={report.severity}
                      color={
                        report.severity.toLowerCase() === 'high'
                          ? 'error'
                          : report.severity.toLowerCase() === 'moderate'
                          ? 'warning'
                          : 'success'
                      }
                      sx={{ fontWeight: 700, height: 22 }}
                    />
                  </Box>

                  {/* Verification Badge */}
                  <Box sx={{ mb: 1 }}>
                    {report.is_ai_verified ? (
                      <Chip
                        icon={<CheckCircleIcon sx={{ fontSize: 16 }} />}
                        label={isHindi ? 'AI सत्यापित (Gemini)' : 'AI Verified'}
                        color="success"
                        variant="outlined"
                        size="small"
                        sx={{ fontSize: '0.72rem', height: 20, fontWeight: 700 }}
                      />
                    ) : (
                      <Chip
                        label={isHindi ? 'सामुदायिक रिपोर्ट' : 'Community Reported'}
                        variant="outlined"
                        size="small"
                        sx={{ fontSize: '0.72rem', height: 20 }}
                      />
                    )}
                  </Box>

                  {/* Location & Crop */}
                  <Typography variant="body2" sx={{ color: '#4B5563', mb: 0.5 }}>
                    📍 <strong>{report.district}</strong>, {report.state}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#6B7280', display: 'block', mb: 1 }}>
                    🌾 {report.crop === 'wheat' ? (isHindi ? 'गेहूं' : 'Wheat') : (isHindi ? 'धान' : 'Rice')} · {new Date(report.created_at).toLocaleDateString()}
                  </Typography>

                  {/* Description Notes */}
                  {report.description && (
                    <Typography
                      variant="body2"
                      sx={{
                        color: '#374151',
                        bgcolor: '#F9FAFB',
                        p: 1,
                        borderRadius: 1.5,
                        fontSize: '0.82rem',
                        lineHeight: 1.4,
                        mb: 1.5
                      }}
                    >
                      "{report.description}"
                    </Typography>
                  )}

                  <Divider sx={{ my: 1 }} />

                  {/* Community Upvote & Comments Button */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<ThumbUpIcon sx={{ fontSize: 14 }} />}
                      onClick={() => handleUpvote(report.id)}
                      sx={{
                        fontSize: '0.75rem',
                        py: 0.4,
                        px: 1,
                        borderRadius: 2,
                        color: '#2E7D32',
                        borderColor: '#2E7D32'
                      }}
                    >
                      {isHindi ? 'मैंने भी देखा' : 'Saw this'} ({report.upvotes})
                    </Button>

                    <Button
                      size="small"
                      variant="text"
                      startIcon={<CommentIcon sx={{ fontSize: 14 }} />}
                      onClick={() => setActiveCommentId(activeCommentId === report.id ? null : report.id)}
                      sx={{ fontSize: '0.75rem', py: 0.4, color: '#4B5563' }}
                    >
                      {isHindi ? 'टिप्पणी' : 'Comment'}
                    </Button>
                  </Box>

                  {/* 30-40km Emergency Alert Button */}
                  <Button
                    fullWidth
                    size="small"
                    variant="contained"
                    startIcon={<EmergencyIcon sx={{ fontSize: 16 }} />}
                    onClick={() => handleOpenAlertModal(report)}
                    sx={{
                      mt: 1.2,
                      bgcolor: '#DC2626',
                      '&:hover': { bgcolor: '#B91C1C' },
                      color: '#FFFFFF',
                      fontWeight: 700,
                      fontSize: '0.74rem',
                      py: 0.6,
                      borderRadius: 2,
                      boxShadow: '0 2px 8px rgba(220,38,38,0.25)'
                    }}
                  >
                    🚨 {isHindi ? 'किसानों को SMS/WhatsApp अलर्ट (30-40 km)' : 'Alert Nearby Farmers (30-40 km)'}
                  </Button>

                  {/* Inline Comment Input Box */}
                  {activeCommentId === report.id && (
                    <Box sx={{ mt: 1.5, pt: 1, borderTop: '1px dashed #E5E7EB' }}>
                      <TextField
                        size="small"
                        fullWidth
                        placeholder={isHindi ? 'अपनी टिप्पणी या पुष्टि लिखें...' : 'Add your observation...'}
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        sx={{ mb: 1, fontSize: '0.8rem' }}
                      />
                      <Button
                        size="small"
                        variant="contained"
                        disabled={commenting || !commentText.trim()}
                        onClick={() => handleAddComment(report.id)}
                        endIcon={commenting ? <CircularProgress size={12} /> : <SendIcon sx={{ fontSize: 12 }} />}
                        sx={{ bgcolor: '#2E7D32', py: 0.4, width: '100%', fontSize: '0.75rem' }}
                      >
                        {isHindi ? 'भेजें' : 'Post Comment'}
                      </Button>
                    </Box>
                  )}
                </Box>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </Paper>

      {/* MAP LEGEND BAR */}
      <Box sx={{ mt: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Stack direction="row" spacing={3} alignItems="center">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 14, height: 14, borderRadius: '50%', bgcolor: '#DC2626' }} />
            <Typography variant="caption" sx={{ fontWeight: 600, color: '#374151' }}>
              {isHindi ? '🔴 उच्च जोखिम / गंभीर (High)' : '🔴 High Outbreak'}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 14, height: 14, borderRadius: '50%', bgcolor: '#F59E0B' }} />
            <Typography variant="caption" sx={{ fontWeight: 600, color: '#374151' }}>
              {isHindi ? '🟠 मध्यम जोखिम (Moderate)' : '🟠 Moderate Outbreak'}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 14, height: 14, borderRadius: '50%', bgcolor: '#10B981' }} />
            <Typography variant="caption" sx={{ fontWeight: 600, color: '#374151' }}>
              {isHindi ? '🟡 कम जोखिम / निगरानी (Low)' : '🟡 Low / Watch'}
            </Typography>
          </Box>
        </Stack>

        <Typography variant="caption" color="text.secondary">
          {isHindi ? `कुल प्रदर्शित प्रकोप: ${reports.length}` : `Showing ${reports.length} active outbreaks across India`}
        </Typography>
      </Box>

      {/* REPORT OUTBREAK DIALOG MODAL */}
      <Dialog
        open={modalOpen}
        onClose={() => !submitting && setModalOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 4, p: 1 } }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 800, color: '#1B5E20' }}>
            🌾 {isHindi ? 'फसल रोग प्रकोप दर्ज करें' : 'Report Disease Outbreak'}
          </Typography>
          <IconButton size="small" onClick={() => setModalOpen(false)} disabled={submitting}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            {/* Auto GPS Location Detector */}
            <Paper sx={{ p: 2, bgcolor: '#F1F8E9', borderRadius: 3, border: '1px solid #C8E6C9' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#2E7D32' }}>
                    📍 {isHindi ? 'खेत का स्थान (GPS)' : 'Field Location Coordinates'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {newReport.lat.toFixed(4)}, {newReport.lon.toFixed(4)} ({newReport.district}, {newReport.state})
                  </Typography>
                </Box>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={detectLocation}
                  startIcon={<GpsIcon />}
                  sx={{ borderColor: '#2E7D32', color: '#2E7D32', borderRadius: 2 }}
                >
                  {isHindi ? 'GPS से लें' : 'Auto Detect'}
                </Button>
              </Box>
            </Paper>

            {/* Crop Selector */}
            <TextField
              select
              fullWidth
              label={isHindi ? 'फसल का प्रकार *' : 'Crop Type *'}
              value={newReport.crop}
              onChange={(e) => {
                const c = e.target.value;
                setNewReport({
                  ...newReport,
                  crop: c,
                  disease_name: 
                    c === 'wheat' ? 'Yellow Rust' : 
                    c === 'rice' ? 'Blast Disease' :
                    c === 'cotton' ? 'Bacterial Blight' :
                    c === 'potato' ? 'Late Blight' :
                    c === 'tomato' ? 'Early Blight' :
                    c === 'maize' ? 'Fall Armyworm' :
                    c === 'sugarcane' ? 'Red Rot' : 'Fungal Blight',
                  disease_name_hi: 
                    c === 'wheat' ? 'पीला रतुआ' : 
                    c === 'rice' ? 'झोंका रोग' :
                    c === 'cotton' ? 'जीवाणु झुलसा' :
                    c === 'potato' ? 'पिछेता झुलसा' :
                    c === 'tomato' ? 'अगेती झुलसा' :
                    c === 'maize' ? 'फॉल आर्मीवर्म' :
                    c === 'sugarcane' ? 'लाल सड़न' : 'फफूंद झुलसा'
                });
              }}
            >
              <MenuItem value="wheat">🌾 {isHindi ? 'गेहूं (Wheat)' : 'Wheat (गेहूं)'}</MenuItem>
              <MenuItem value="rice">🍚 {isHindi ? 'धान / चावल (Rice)' : 'Rice (धान)'}</MenuItem>
              <MenuItem value="cotton">🌿 {isHindi ? 'कपास (Cotton)' : 'Cotton (कपास)'}</MenuItem>
              <MenuItem value="potato">🥔 {isHindi ? 'आलू (Potato)' : 'Potato (आलू)'}</MenuItem>
              <MenuItem value="tomato">🍅 {isHindi ? 'टमाटर (Tomato)' : 'Tomato (टमाटर)'}</MenuItem>
              <MenuItem value="maize">🌽 {isHindi ? 'मक्का (Maize)' : 'Maize (मक्का)'}</MenuItem>
              <MenuItem value="sugarcane">🎋 {isHindi ? 'गन्ना (Sugarcane)' : 'Sugarcane (गन्ना)'}</MenuItem>
              <MenuItem value="other">🌱 {isHindi ? 'अन्य फसल (Other Crop)' : 'Other Crop'}</MenuItem>
            </TextField>

            {/* Disease Name Dropdown */}
            <TextField
              select
              fullWidth
              label={isHindi ? 'रोग का नाम *' : 'Disease Name *'}
              value={newReport.disease_name}
              onChange={(e) => {
                const sel = commonDiseases.find((d) => d.name === e.target.value);
                setNewReport({
                  ...newReport,
                  disease_name: e.target.value,
                  disease_name_hi: sel?.nameHi || ''
                });
              }}
            >
              {commonDiseases.map((d) => (
                <MenuItem key={d.name} value={d.name}>
                  {d.name} {d.nameHi ? `(${d.nameHi})` : ''}
                </MenuItem>
              ))}
            </TextField>

            {/* Severity Selector */}
            <TextField
              select
              fullWidth
              label={isHindi ? 'गंभीरता स्तर *' : 'Severity Level *'}
              value={newReport.severity}
              onChange={(e) => setNewReport({ ...newReport, severity: e.target.value })}
            >
              <MenuItem value="High">🔴 {isHindi ? 'उच्च (High / तीव्र प्रकोप)' : 'High (Severe outbreak)'}</MenuItem>
              <MenuItem value="Moderate">🟠 {isHindi ? 'मध्यम (Moderate / प्रारंभिक फैलाव)' : 'Moderate (Early spreading)'}</MenuItem>
              <MenuItem value="Low">🟡 {isHindi ? 'कम (Low / कुछ पत्तियों पर लक्षण)' : 'Low (Few leaves spotted)'}</MenuItem>
            </TextField>

            {/* District & State */}
            <Stack direction="row" spacing={2}>
              <TextField
                fullWidth
                label={isHindi ? 'जिला (District) *' : 'District *'}
                value={newReport.district}
                onChange={(e) => setNewReport({ ...newReport, district: e.target.value })}
              />
              <TextField
                fullWidth
                label={isHindi ? 'राज्य (State) *' : 'State *'}
                value={newReport.state}
                onChange={(e) => setNewReport({ ...newReport, state: e.target.value })}
              />
            </Stack>

            {/* Field Notes */}
            <TextField
              fullWidth
              multiline
              rows={3}
              label={isHindi ? 'खेत का विवरण व लक्षण (वैकल्पिक)' : 'Field Observations & Notes (Optional)'}
              placeholder={
                isHindi
                  ? 'उदाहरण: खेत के उत्तरी हिस्से में पत्तियों पर पीली धारियां दिख रही हैं, हवा से तेजी से फैल रहा है।'
                  : 'Example: Yellow stripes noticed across 2 acres. Cool winds causing rapid spread.'
              }
              value={newReport.description}
              onChange={(e) => setNewReport({ ...newReport, description: e.target.value })}
            />

            {/* Reporter Name */}
            <TextField
              fullWidth
              label={isHindi ? 'रिपोर्टर का नाम' : 'Your Name'}
              value={newReport.reporter_name}
              onChange={(e) => setNewReport({ ...newReport, reporter_name: e.target.value })}
            />
          </Stack>
        </DialogContent>

        <DialogActions sx={{ p: 2.5, justifyContent: 'space-between' }}>
          <Button onClick={() => setModalOpen(false)} color="inherit" disabled={submitting}>
            {isHindi ? 'रद्द करें' : 'Cancel'}
          </Button>

          <Button
            variant="contained"
            onClick={handleCreateReport}
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={18} /> : <SendIcon />}
            sx={{ bgcolor: '#2E7D32', '&:hover': { bgcolor: '#1B5E20' }, px: 3, borderRadius: 2.5 }}
          >
            {isHindi ? 'मानचित्र पर सबमिट करें' : 'Publish to Map'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ================= EMERGENCY ALERT BROADCAST MODAL (30-40 KM) ================= */}
      <Dialog
        open={alertModalOpen}
        onClose={() => !dispatchingAlerts && setAlertModalOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 4, p: 1 } }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                bgcolor: '#FEE2E2',
                color: '#DC2626',
                p: 1,
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <EmergencyIcon sx={{ fontSize: 28 }} />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#991B1B' }}>
                🚨 {isHindi ? 'निकटवर्ती किसानों को आपातकालीन अलर्ट (30-40 किमी)' : 'Emergency Outbreak Broadcast (30-40 km)'}
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748B' }}>
                {isHindi
                  ? 'रोग फैलाव रोकने हेतु क्षेत्र के पंजीकृत किसानों को SMS व WhatsApp चेतावनी भेजें'
                  : 'Broadcast real-time SMS & WhatsApp alerts to prevent epidemic spread across nearby farms'}
              </Typography>
            </Box>
          </Box>
          <IconButton size="small" onClick={() => setAlertModalOpen(false)} disabled={dispatchingAlerts}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers>
          {alertReport && (
            <Stack spacing={2.5} sx={{ mt: 0.5 }}>
              {/* Target Report Card */}
              <Paper sx={{ p: 2, bgcolor: '#FFF1F2', borderRadius: 3, border: '1px solid #FECDD3' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 1 }}>
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#9F1239' }}>
                      🌾 {isHindi && alertReport.disease_name_hi ? alertReport.disease_name_hi : alertReport.disease_name} (
                      {alertReport.crop === 'wheat' ? (isHindi ? 'गेहूं' : 'Wheat') : (isHindi ? 'धान' : 'Rice')})
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#881337', mt: 0.3 }}>
                      📍 <strong>{alertReport.district}</strong>, {alertReport.state} ({alertReport.lat.toFixed(4)}, {alertReport.lon.toFixed(4)})
                    </Typography>
                  </Box>
                  <Chip
                    label={alertReport.severity}
                    color={
                      alertReport.severity.toLowerCase() === 'high' ? 'error' :
                      alertReport.severity.toLowerCase() === 'moderate' ? 'warning' : 'success'
                    }
                    sx={{ fontWeight: 800, textTransform: 'uppercase' }}
                  />
                </Box>
              </Paper>

              {!dispatchResult ? (
                <>
                  {/* Radius Slider & Quick Presets */}
                  <Box sx={{ p: 2, bgcolor: '#F8FAFC', borderRadius: 3, border: '1px solid #E2E8F0' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1E293B' }}>
                        📏 {isHindi ? 'चेतावनी दायरा (Radius):' : 'Broadcast Radius:'} <strong>{alertRadius} km</strong>
                      </Typography>
                      <Stack direction="row" spacing={1}>
                        {[30, 35, 40, 50].map((r) => (
                          <Chip
                            key={r}
                            label={`${r} km`}
                            size="small"
                            clickable
                            color={alertRadius === r ? 'error' : 'default'}
                            onClick={() => {
                              setAlertRadius(r);
                              if (alertReport) fetchNearbyFarmers(alertReport.id, r);
                            }}
                            sx={{ fontWeight: 700, fontSize: '0.74rem' }}
                          />
                        ))}
                      </Stack>
                    </Box>
                    <Slider
                      value={alertRadius}
                      min={15}
                      max={60}
                      step={5}
                      marks={[
                        { value: 15, label: '15km' },
                        { value: 30, label: '30km' },
                        { value: 40, label: '40km' },
                        { value: 60, label: '60km' },
                      ]}
                      valueLabelDisplay="auto"
                      onChange={(_, val) => setAlertRadius(val as number)}
                      onChangeCommitted={(_, val) => {
                        if (alertReport) fetchNearbyFarmers(alertReport.id, val as number);
                      }}
                      sx={{ color: '#DC2626' }}
                    />
                  </Box>

                  {/* Nearby Farmers Recipient List */}
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.2 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1E293B' }}>
                        👥 {isHindi ? 'इस दायरे में पंजीकृत किसान:' : 'Registered Farmers in Range:'}{' '}
                        <span style={{ color: '#DC2626' }}>({nearbyFarmers.length})</span>
                      </Typography>
                      {loadingNearbyFarmers && <CircularProgress size={16} sx={{ color: '#DC2626' }} />}
                    </Box>

                    {nearbyFarmers.length === 0 ? (
                      <Paper sx={{ p: 2.5, textAlign: 'center', bgcolor: '#F8FAFC', borderRadius: 3, border: '1px dashed #CBD5E1' }}>
                        <Typography variant="body2" color="text.secondary">
                          {isHindi
                            ? `इस ${alertRadius} किमी के दायरे में कोई अन्य पंजीकृत किसान नहीं मिला। दायरा बढ़ाकर 40-50 किमी करें।`
                            : `No registered farmers within ${alertRadius} km. Try expanding the radius slider to 40-50 km.`}
                        </Typography>
                      </Paper>
                    ) : (
                      <TableContainer component={Paper} sx={{ borderRadius: 3, border: '1px solid #E2E8F0', maxHeight: 200 }}>
                        <Table size="small">
                          <TableHead sx={{ bgcolor: '#F1F5F9' }}>
                            <TableRow>
                              <TableCell sx={{ fontWeight: 700, py: 1 }}>{isHindi ? 'किसान का नाम' : 'Farmer'}</TableCell>
                              <TableCell sx={{ fontWeight: 700, py: 1 }}>{isHindi ? 'गाँव / क्षेत्र' : 'Village / Area'}</TableCell>
                              <TableCell sx={{ fontWeight: 700, py: 1 }}>{isHindi ? 'दूरी' : 'Distance'}</TableCell>
                              <TableCell sx={{ fontWeight: 700, py: 1 }}>{isHindi ? 'मोबाइल नंबर' : 'Phone'}</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {nearbyFarmers.map((f) => (
                              <TableRow key={f.farmer_id} hover>
                                <TableCell sx={{ fontWeight: 600, py: 0.8 }}>{f.name}</TableCell>
                                <TableCell sx={{ color: '#475569', py: 0.8 }}>{f.location_name}</TableCell>
                                <TableCell sx={{ py: 0.8 }}>
                                  <Chip
                                    size="small"
                                    label={`${f.distance_km} km`}
                                    color={f.distance_km <= 20 ? 'success' : f.distance_km <= 35 ? 'warning' : 'default'}
                                    sx={{ fontWeight: 700, height: 20, fontSize: '0.72rem' }}
                                  />
                                </TableCell>
                                <TableCell sx={{ fontFamily: 'monospace', color: '#64748B', py: 0.8 }}>
                                  {f.masked_phone}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    )}
                  </Box>

                  {/* Channel Selection & Options */}
                  <Paper sx={{ p: 2, bgcolor: '#F8FAFC', borderRadius: 3, border: '1px solid #E2E8F0' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1E293B', mb: 1 }}>
                      📡 {isHindi ? 'प्रसारण चैनल चुनें:' : 'Select Alert Delivery Channels:'}
                    </Typography>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={channelSms}
                            onChange={(e) => setChannelSms(e.target.checked)}
                            color="error"
                          />
                        }
                        label={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                            <SmsIcon sx={{ color: '#2563EB', fontSize: 20 }} />
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {isHindi ? 'SMS अलर्ट (सीधे मोबाइल पर)' : 'SMS Alert (Direct to Mobile)'}
                            </Typography>
                          </Box>
                        }
                      />
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={channelWhatsApp}
                            onChange={(e) => setChannelWhatsApp(e.target.checked)}
                            color="success"
                          />
                        }
                        label={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                            <WhatsAppIcon sx={{ color: '#16A34A', fontSize: 20 }} />
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {isHindi ? 'WhatsApp अलर्ट व किसान ग्रुप' : 'WhatsApp & Kisan Group Links'}
                            </Typography>
                          </Box>
                        }
                      />
                    </Stack>
                  </Paper>

                  {/* Custom Note Input */}
                  <TextField
                    fullWidth
                    size="small"
                    label={isHindi ? 'विशिष्ट दवा या उपचार सलाह जोड़ें (वैकल्पिक)' : 'Add Specific Treatment / Advisory Note (Optional)'}
                    placeholder={
                      isHindi
                        ? 'उदा: तुरंत प्रोपिकोनाजोल 25% EC का 1ml/लीटर पानी में छिड़काव करें।'
                        : 'e.g., Spray Propiconazole 25% EC @ 1ml/L immediately.'
                    }
                    value={customAlertNote}
                    onChange={(e) => setCustomAlertNote(e.target.value)}
                  />

                  {/* Emergency Message Preview */}
                  <Paper sx={{ p: 2, bgcolor: '#1E293B', color: '#F8FAFC', borderRadius: 3 }}>
                    <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      📲 {isHindi ? 'भेजे जाने वाले SMS व WhatsApp संदेश का पूर्वावलोकन:' : 'SMS & WhatsApp Message Preview:'}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        mt: 1,
                        whiteSpace: 'pre-wrap',
                        fontFamily: 'system-ui, sans-serif',
                        fontSize: '0.82rem',
                        lineHeight: 1.5,
                        color: '#E2E8F0',
                        bgcolor: 'rgba(255,255,255,0.06)',
                        p: 1.5,
                        borderRadius: 2
                      }}
                    >
                      {`🚨 [CropSafe आपातकालीन अलर्ट]\nसावधान किसान भाई! आपके खेत से 30-40 किमी दायरे (${alertReport.district}) में ${getCropHindiName(alertReport.crop)} की फसल में '${alertReport.disease_name_hi || alertReport.disease_name}' का प्रकोप देखा गया है।\nतुरंत फसल की जांच करें व निवारक उपाय अपनाएं।${customAlertNote ? `\nसलाह: ${customAlertNote}` : ''}\n📍 लाइव नक्शा: http://localhost:3000/map\n📞 किसान हेल्पलाइन: 1800-180-1551`}
                    </Typography>
                  </Paper>
                </>
              ) : (
                /* Post-Dispatch Success View */
                <Stack spacing={2.5}>
                  <Alert
                    severity="success"
                    icon={<CheckCircleIcon fontSize="inherit" />}
                    sx={{ borderRadius: 3, fontWeight: 700, fontSize: '0.95rem' }}
                  >
                    {isHindi
                      ? `🎉 सफलतापूर्वक ${dispatchResult.farmers_count} निकटवर्ती किसानों को ${dispatchResult.alerts_dispatched_count} अलर्ट प्रसारित कर दिए गए!`
                      : `🎉 Successfully dispatched ${dispatchResult.alerts_dispatched_count} alerts to ${dispatchResult.farmers_count} neighboring farmers!`}
                  </Alert>

                  {/* Kisan WhatsApp Group Blast CTA */}
                  <Paper
                    sx={{
                      p: 2.2,
                      bgcolor: '#F0FDF4',
                      borderRadius: 3,
                      border: '1px solid #BBF7D0',
                      display: 'flex',
                      flexDirection: { xs: 'column', sm: 'row' },
                      justifyContent: 'space-between',
                      alignItems: { sm: 'center' },
                      gap: 1.5
                    }}
                  >
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <WhatsAppIcon sx={{ color: '#16A34A', fontSize: 24 }} />
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#166534' }}>
                          {isHindi ? 'किसान WhatsApp ग्रुप में शेयर करें' : 'Share to Kisan WhatsApp Group'}
                        </Typography>
                      </Box>
                      <Typography variant="caption" sx={{ color: '#15803D' }}>
                        {isHindi
                          ? 'गाँव के किसान समूह को 1-क्लिक में चेतावनी और दवा की जानकारी भेजें'
                          : 'Blast this emergency advisory directly to your local farmer WhatsApp group'}
                      </Typography>
                    </Box>
                    <Button
                      variant="contained"
                      startIcon={<WhatsAppIcon />}
                      onClick={() => window.open(dispatchResult.group_whatsapp_url, '_blank')}
                      sx={{
                        bgcolor: '#16A34A',
                        '&:hover': { bgcolor: '#15803D' },
                        color: '#FFFFFF',
                        fontWeight: 700,
                        borderRadius: 2.5,
                        px: 2.5,
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {isHindi ? 'ग्रुप में भेजें' : 'Share to Group'}
                    </Button>
                  </Paper>

                  {/* Individual Farmer Direct WhatsApp Links */}
                  {dispatchResult.whatsapp_direct_links && dispatchResult.whatsapp_direct_links.length > 0 && (
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1E293B', mb: 1 }}>
                        💬 {isHindi ? 'किसानों के साथ 1-to-1 WhatsApp चैट:' : '1-to-1 WhatsApp Direct Send:'}
                      </Typography>
                      <Stack spacing={1}>
                        {dispatchResult.whatsapp_direct_links.map((link, idx) => (
                          <Paper
                            key={idx}
                            sx={{
                              p: 1.2,
                              px: 2,
                              borderRadius: 2.5,
                              border: '1px solid #E2E8F0',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center'
                            }}
                          >
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A' }}>
                                {link.farmer_name}{' '}
                                <span style={{ color: '#64748B', fontWeight: 500, fontSize: '0.8rem' }}>
                                  ({link.distance_km} km away · {link.masked_phone})
                                </span>
                              </Typography>
                            </Box>
                            <Button
                              size="small"
                              variant="outlined"
                              color="success"
                              startIcon={<WhatsAppIcon sx={{ fontSize: 16 }} />}
                              endIcon={<OpenInNewIcon sx={{ fontSize: 14 }} />}
                              onClick={() => window.open(link.url, '_blank')}
                              sx={{ fontWeight: 700, borderRadius: 2, fontSize: '0.74rem' }}
                            >
                              {isHindi ? 'WhatsApp भेजें' : 'Send WhatsApp'}
                            </Button>
                          </Paper>
                        ))}
                      </Stack>
                    </Box>
                  )}

                  {/* Dispatched Delivery Log */}
                  <Box>
                    <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>
                      📋 {isHindi ? 'डिलीवरी स्थिति विवरण:' : 'Delivery Audit Summary:'}
                    </Typography>
                    <TableContainer component={Paper} sx={{ borderRadius: 2.5, border: '1px solid #E2E8F0', mt: 0.8, maxHeight: 160 }}>
                      <Table size="small">
                        <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 700, py: 0.6 }}>{isHindi ? 'किसान' : 'Farmer'}</TableCell>
                            <TableCell sx={{ fontWeight: 700, py: 0.6 }}>{isHindi ? 'चैनल' : 'Channel'}</TableCell>
                            <TableCell sx={{ fontWeight: 700, py: 0.6 }}>{isHindi ? 'दूरी' : 'Distance'}</TableCell>
                            <TableCell sx={{ fontWeight: 700, py: 0.6 }}>{isHindi ? 'स्थिति' : 'Status'}</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {dispatchResult.dispatched_records.map((r, i) => (
                            <TableRow key={i}>
                              <TableCell sx={{ py: 0.5, fontWeight: 600 }}>{r.farmer_name}</TableCell>
                              <TableCell sx={{ py: 0.5 }}>
                                <Chip
                                  size="small"
                                  label={r.channel}
                                  color={r.channel === 'SMS' ? 'primary' : 'success'}
                                  sx={{ height: 18, fontSize: '0.68rem', fontWeight: 700 }}
                                />
                              </TableCell>
                              <TableCell sx={{ py: 0.5, color: '#64748B' }}>{r.distance_km} km</TableCell>
                              <TableCell sx={{ py: 0.5 }}>
                                <Chip
                                  size="small"
                                  label={r.status}
                                  color="success"
                                  variant="outlined"
                                  sx={{ height: 18, fontSize: '0.68rem', fontWeight: 700 }}
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                </Stack>
              )}
            </Stack>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2.5, justifyContent: 'space-between' }}>
          <Button onClick={() => setAlertModalOpen(false)} color="inherit" disabled={dispatchingAlerts}>
            {dispatchResult ? (isHindi ? 'बंद करें' : 'Close') : (isHindi ? 'रद्द करें' : 'Cancel')}
          </Button>

          {!dispatchResult ? (
            <Button
              variant="contained"
              onClick={handleDispatchAlerts}
              disabled={dispatchingAlerts || nearbyFarmers.length === 0}
              startIcon={dispatchingAlerts ? <CircularProgress size={18} color="inherit" /> : <EmergencyIcon />}
              sx={{
                bgcolor: '#DC2626',
                '&:hover': { bgcolor: '#B91C1C' },
                color: '#FFFFFF',
                px: 3,
                py: 1,
                borderRadius: 2.5,
                fontWeight: 800
              }}
            >
              {dispatchingAlerts
                ? (isHindi ? 'अलर्ट भेजे जा रहे हैं...' : 'Broadcasting Alerts...')
                : isHindi
                ? `🚀 ${nearbyFarmers.length} किसानों को तुरंत अलर्ट भेजें`
                : `🚀 Dispatch Alerts to ${nearbyFarmers.length} Farmers`}
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={() => {
                setDispatchResult(null);
                setAlertModalOpen(false);
              }}
              sx={{ bgcolor: '#16A34A', '&:hover': { bgcolor: '#15803D' }, px: 3, borderRadius: 2.5, fontWeight: 700 }}
            >
              {isHindi ? 'संपन्न (Done)' : 'Done'}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* ================= FARMER RECEIVED EMERGENCY NOTIFICATIONS DIALOG ================= */}
      <Dialog
        open={notifDrawerOpen}
        onClose={() => setNotifDrawerOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 4, p: 1 } }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <NotificationIcon sx={{ color: '#D97706' }} />
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#1E293B' }}>
              {isHindi ? 'मेरी प्राप्त चेतावनियाँ' : 'My Emergency Alerts'}
            </Typography>
          </Box>
          <IconButton size="small" onClick={() => setNotifDrawerOpen(false)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {loadingNotifs ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress color="warning" />
            </Box>
          ) : farmerNotifications.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 600 }}>
                {isHindi ? '✅ वर्तमान में आपके खेत के 30-40 किमी दायरे में कोई सक्रिय चेतावनी नहीं है।' : '✅ No active emergency disease alerts for your farm at this time.'}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                {isHindi ? 'जब कोई पड़ोसी किसान रोग की सूचना देगा, आपको यहां तुरंत अलर्ट दिखेगा।' : 'When neighboring farmers report outbreaks within 30-40 km, you will see alerts here.'}
              </Typography>
            </Box>
          ) : (
            <Stack spacing={1.5}>
              {farmerNotifications.map((notif: any, i: number) => (
                <Paper key={i} sx={{ p: 2, borderRadius: 3, border: '1px solid #FED7AA', bgcolor: '#FFFBEB' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#9A3412' }}>
                      🚨 {isHindi && notif.disease_name_hi ? notif.disease_name_hi : notif.disease_name} ({notif.crop})
                    </Typography>
                    <Chip
                      size="small"
                      label={`${notif.distance_km} km away`}
                      color="warning"
                      sx={{ fontWeight: 700, height: 20, fontSize: '0.72rem' }}
                    />
                  </Box>
                  <Typography variant="body2" sx={{ color: '#7C2D12', fontSize: '0.82rem', whiteSpace: 'pre-wrap' }}>
                    {notif.message_content}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#9A3412', display: 'block', mt: 1 }}>
                    🕒 {new Date(notif.sent_at).toLocaleString()} · Channel: {notif.channel}
                  </Typography>
                </Paper>
              ))}
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setNotifDrawerOpen(false)} color="inherit">
            {isHindi ? 'बंद करें' : 'Close'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MapPage;
