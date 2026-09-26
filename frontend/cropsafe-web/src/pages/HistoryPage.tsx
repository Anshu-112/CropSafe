import React, { useState, useEffect, useCallback } from 'react';
import {
  Typography,
  Box,
  Card,
  CardContent,
  Chip,
  Button,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
  Paper,
  Divider,
  Stack
} from '@mui/material';
import {
  Agriculture as CropIcon,
  MedicalServices as RxIcon,
  Warning as WarningIcon,
  CheckCircle as ResolvedIcon,
  HourglassEmpty as PendingIcon,
  Biotech as TreatedIcon,
  ContactPhone as ExpertIcon,
  DeleteOutline as DeleteIcon,
  EditNote as NoteIcon,
  CalendarMonth as DateIcon,
  PhoneInTalk as CallIcon,
  Person as PersonIcon,
  AddAPhoto as ScanIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { useFarmer } from '../context/FarmerContext';
import {
  getFarmerDiagnosisHistory,
  updateFollowUpStatus,
  deleteDiagnosisRecord,
  getFarmerWeatherAlerts,
  deleteWeatherAlert,
  DiagnosisRecord,
  SavedWeatherAlert,
  FollowUpStatus
} from '../services/api';

interface HistoryPageProps {
  language?: string;
}

const statusConfig: Record<
  FollowUpStatus,
  { labelEn: string; labelHi: string; color: 'warning' | 'info' | 'success' | 'error'; icon: React.ReactNode }
> = {
  PENDING_TREATMENT: {
    labelEn: 'Pending Treatment',
    labelHi: 'इलाज बाकी',
    color: 'warning',
    icon: <PendingIcon fontSize="small" />
  },
  TREATED: {
    labelEn: 'Treated & Monitoring',
    labelHi: 'उपचार किया गया',
    color: 'info',
    icon: <TreatedIcon fontSize="small" />
  },
  RESOLVED: {
    labelEn: 'Resolved / Cured',
    labelHi: 'फसल ठीक हुई',
    color: 'success',
    icon: <ResolvedIcon fontSize="small" />
  },
  EXPERT_HELP_NEEDED: {
    labelEn: 'Expert Help Needed',
    labelHi: 'विशेषज्ञ सहायता चाहिए',
    color: 'error',
    icon: <ExpertIcon fontSize="small" />
  }
};

const severityColor = (level: string) => {
  switch (level?.toLowerCase()) {
    case 'low':
      return '#4CAF50';
    case 'medium':
      return '#FF9800';
    case 'high':
      return '#F44336';
    case 'very high':
      return '#B71C1C';
    default:
      return '#757575';
  }
};

const getCropLabel = (crop: string, isHindi: boolean) => {
  const map: Record<string, { en: string; hi: string; icon: string }> = {
    wheat: { en: 'Wheat', hi: 'गेहूं', icon: '🌾' },
    rice: { en: 'Rice', hi: 'धान', icon: '🌾' },
    cotton: { en: 'Cotton', hi: 'कपास', icon: '🌿' },
    potato: { en: 'Potato', hi: 'आलू', icon: '🥔' },
    tomato: { en: 'Tomato', hi: 'टमाटर', icon: '🍅' },
    maize: { en: 'Maize', hi: 'मक्का', icon: '🌽' },
    sugarcane: { en: 'Sugarcane', hi: 'गन्ना', icon: '🎋' },
    mustard: { en: 'Mustard', hi: 'सरसों', icon: '🌱' },
    soybean: { en: 'Soybean', hi: 'सोयाबीन', icon: '🌱' },
    chili: { en: 'Chili', hi: 'मिर्च', icon: '🌶️' },
    onion: { en: 'Onion', hi: 'प्याज', icon: '🧅' }
  };
  const key = crop?.toLowerCase();
  if (map[key]) {
    return `${map[key].icon} ${isHindi ? map[key].hi : map[key].en}`;
  }
  return `🌱 ${crop ? crop.charAt(0).toUpperCase() + crop.slice(1) : 'Crop'}`;
};

export const HistoryPage: React.FC<HistoryPageProps> = ({ language: propLanguage }) => {
  const { farmer, isLoggedIn, logout, openLoginModal } = useFarmer();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Diagnosis Records state
  const [records, setRecords] = useState<DiagnosisRecord[]>([]);
  const [summary, setSummary] = useState<any>({
    total_scans: 0,
    pending_count: 0,
    treated_count: 0,
    resolved_count: 0,
    expert_needed_count: 0
  });

  // Weather Alerts state
  const [weatherAlerts, setWeatherAlerts] = useState<SavedWeatherAlert[]>([]);

  // Filter state
  const [cropFilter, setCropFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Edit Note state
  const [editingRecord, setEditingRecord] = useState<DiagnosisRecord | null>(null);
  const [newStatus, setNewStatus] = useState<FollowUpStatus>('PENDING_TREATMENT');
  const [noteText, setNoteText] = useState('');
  const [updating, setUpdating] = useState(false);

  const isHindi = propLanguage === 'hi';

  // Fetch farmer history records
  const fetchRecords = useCallback(async () => {
    if (!farmer) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getFarmerDiagnosisHistory(
        farmer.id,
        cropFilter === 'all' ? undefined : cropFilter,
        statusFilter === 'all' ? undefined : statusFilter
      );
      if (res.success) {
        setRecords(res.data.records || []);
        setSummary(res.data.summary || {});
      } else {
        setError(res.error || 'Failed to load records');
      }
    } catch (err: any) {
      setError(err.message || 'Error loading diagnosis history');
    } finally {
      setLoading(false);
    }
  }, [farmer, cropFilter, statusFilter]);

  // Fetch saved weather alerts
  const fetchAlerts = useCallback(async () => {
    if (!farmer) return;
    try {
      const res = await getFarmerWeatherAlerts(farmer.id);
      if (res.success) {
        setWeatherAlerts(res.data.alerts || []);
      }
    } catch (err) {
      console.error('Error loading weather alerts:', err);
    }
  }, [farmer]);

  useEffect(() => {
    if (farmer) {
      fetchRecords();
      fetchAlerts();
    }
  }, [farmer, fetchRecords, fetchAlerts]);

  // Open note/status edit dialog
  const handleOpenEdit = (rec: DiagnosisRecord) => {
    setEditingRecord(rec);
    setNewStatus(rec.follow_up_status || 'PENDING_TREATMENT');
    setNoteText(rec.notes || '');
  };

  const handleSaveStatus = async () => {
    if (!editingRecord) return;
    setUpdating(true);
    try {
      const res = await updateFollowUpStatus(editingRecord.id, newStatus, noteText);
      if (res.success) {
        setEditingRecord(null);
        await fetchRecords();
      } else {
        alert(res.error || 'Failed to update status');
      }
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteRecord = async (id: number) => {
    const confirmMsg = isHindi ? 'क्या आप इस स्कैन रिकॉर्ड को हटाना चाहते हैं?' : 'Are you sure you want to delete this scan record?';
    if (!window.confirm(confirmMsg)) return;

    const res = await deleteDiagnosisRecord(id);
    if (res.success) {
      setRecords((prev) => prev.filter((r) => r.id !== id));
      await fetchRecords();
    } else {
      alert(res.error || 'Delete failed');
    }
  };

  const handleDeleteAlert = async (id: number) => {
    const res = await deleteWeatherAlert(id);
    if (res.success) {
      setWeatherAlerts((prev) => prev.filter((a) => a.id !== id));
    }
  };

  // If farmer is not logged in, show simple banner / login prompt
  if (!isLoggedIn) {
    return (
      <Box sx={{ py: 6, textAlign: 'center' }}>
        <Paper sx={{ p: 5, maxWidth: 550, mx: 'auto', borderRadius: 4, boxShadow: 3 }}>
          <Typography variant="h3" sx={{ mb: 2 }}>
            📜
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#2E7D32', mb: 1 }}>
            {isHindi ? 'किसान निदान एवं पर्चा इतिहास' : 'Farmer Diagnosis & Prescription History'}
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            {isHindi
              ? 'अपने खेत के पुराने स्कैन, रोग पर्चे, मौसम चेतावनी और दवाइयों की स्थिति देखने के लिए अपने फोन नंबर से लॉगिन करें।'
              : 'Log in with your phone number to access your past crop scans, AI prescriptions, saved weather warnings, and treatment follow-ups.'}
          </Typography>
          <Button
            variant="contained"
            size="large"
            component={Link}
            to="/login"
            state={{ from: '/history' }}
            sx={{ bgcolor: '#2E7D32', '&:hover': { bgcolor: '#1b5e20' }, px: 4, py: 1.5, fontSize: '1.1rem', borderRadius: 3 }}
            startIcon={<PersonIcon />}
          >
            {isHindi ? 'लॉगिन करें / खाता खोलें' : 'Login / Enter Mobile Number'}
          </Button>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ pb: 6 }}>
      {/* Farmer Profile Header */}
      <Paper sx={{ p: 3, mb: 3, borderRadius: 3, bgcolor: '#f1f8e9', border: '1px solid #c5e1a5' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#2E7D32' }}>
              👤 {farmer?.name || (isHindi ? 'किसान' : 'Farmer')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              📱 {farmer?.phone} {farmer?.location_name ? `• 📍 ${farmer.location_name}` : ''}
            </Typography>
          </Box>
          <Stack direction="row" spacing={1.5}>
            <Button
              variant="outlined"
              component={Link}
              to="/predict"
              startIcon={<ScanIcon />}
              sx={{ borderColor: '#2E7D32', color: '#2E7D32' }}
            >
              {isHindi ? 'नया स्कैन करें' : 'Scan New Crop'}
            </Button>
            <Button variant="text" color="inherit" onClick={logout} size="small">
              {isHindi ? 'लॉग आउट' : 'Logout'}
            </Button>
          </Stack>
        </Box>

        {/* Summary Metric Cards */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(5, 1fr)' }, gap: 2, mt: 2 }}>
          <Card sx={{ textAlign: 'center', p: 1.5, borderRadius: 2 }}>
            <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#2E7D32' }}>
              {summary.total_scans}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {isHindi ? 'कुल स्कैन' : 'Total Scans'}
            </Typography>
          </Card>
          <Card sx={{ textAlign: 'center', p: 1.5, borderRadius: 2, bgcolor: '#fffde7' }}>
            <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#F57F17' }}>
              {summary.pending_count}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {isHindi ? 'इलाज बाकी' : 'Pending'}
            </Typography>
          </Card>
          <Card sx={{ textAlign: 'center', p: 1.5, borderRadius: 2, bgcolor: '#e1f5fe' }}>
            <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#0288D1' }}>
              {summary.treated_count}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {isHindi ? 'उपचार जारी' : 'Treated'}
            </Typography>
          </Card>
          <Card sx={{ textAlign: 'center', p: 1.5, borderRadius: 2, bgcolor: '#e8f5e9' }}>
            <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#388E3C' }}>
              {summary.resolved_count}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {isHindi ? 'ठीक हुआ' : 'Resolved'}
            </Typography>
          </Card>
          <Card sx={{ textAlign: 'center', p: 1.5, borderRadius: 2, bgcolor: '#ffebee' }}>
            <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#D32F2F' }}>
              {summary.expert_needed_count}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {isHindi ? 'सहायता चाहिए' : 'Need Expert'}
            </Typography>
          </Card>
        </Box>
      </Paper>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
          <Tab
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <RxIcon fontSize="small" />
                <span>{isHindi ? 'फसल निदान एवं पर्चे' : 'Diagnosis & Prescriptions'} ({records.length})</span>
              </Box>
            }
          />
          <Tab
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <WarningIcon fontSize="small" />
                <span>{isHindi ? 'सहेजे गए मौसम अलर्ट' : 'Saved Weather Alerts'} ({weatherAlerts.length})</span>
              </Box>
            }
          />
        </Tabs>
      </Box>

      {/* TAB 0: DIAGNOSIS & PRESCRIPTION CARDS */}
      {activeTab === 0 && (
        <Box>
          {/* Filters */}
          <Paper sx={{ p: 2, mb: 3, borderRadius: 2, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <FilterIcon color="action" />
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                {isHindi ? 'फ़िल्टर:' : 'Filter:'}
              </Typography>
            </Box>

            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>{isHindi ? 'फसल' : 'Crop'}</InputLabel>
              <Select value={cropFilter} label={isHindi ? 'फसल' : 'Crop'} onChange={(e) => setCropFilter(e.target.value)}>
                <MenuItem value="all">🌱 {isHindi ? 'सभी फसलें' : 'All Crops'}</MenuItem>
                <MenuItem value="wheat">🌾 {isHindi ? 'गेहूं (Wheat)' : 'Wheat'}</MenuItem>
                <MenuItem value="rice">🍚 {isHindi ? 'धान / चावल (Rice)' : 'Rice'}</MenuItem>
                <MenuItem value="cotton">🌿 {isHindi ? 'कपास (Cotton)' : 'Cotton'}</MenuItem>
                <MenuItem value="potato">🥔 {isHindi ? 'आलू (Potato)' : 'Potato'}</MenuItem>
                <MenuItem value="tomato">🍅 {isHindi ? 'टमाटर (Tomato)' : 'Tomato'}</MenuItem>
                <MenuItem value="maize">🌽 {isHindi ? 'मक्का (Maize)' : 'Maize'}</MenuItem>
                <MenuItem value="sugarcane">🎋 {isHindi ? 'गन्ना (Sugarcane)' : 'Sugarcane'}</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel>{isHindi ? 'उपचार स्थिति' : 'Follow-up Status'}</InputLabel>
              <Select value={statusFilter} label={isHindi ? 'उपचार स्थिति' : 'Follow-up Status'} onChange={(e) => setStatusFilter(e.target.value)}>
                <MenuItem value="all">{isHindi ? 'सभी स्थितियाँ' : 'All Statuses'}</MenuItem>
                <MenuItem value="PENDING_TREATMENT">{isHindi ? 'इलाज बाकी' : 'Pending Treatment'}</MenuItem>
                <MenuItem value="TREATED">{isHindi ? 'उपचार किया गया' : 'Treated & Monitoring'}</MenuItem>
                <MenuItem value="RESOLVED">{isHindi ? 'फसल ठीक हुई' : 'Resolved / Cured'}</MenuItem>
                <MenuItem value="EXPERT_HELP_NEEDED">{isHindi ? 'विशेषज्ञ सहायता चाहिए' : 'Expert Help Needed'}</MenuItem>
              </Select>
            </FormControl>
          </Paper>

          {loading ? (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <CircularProgress color="success" />
              <Typography variant="body2" sx={{ mt: 2 }} color="text.secondary">
                {isHindi ? 'रिकॉर्ड लोड हो रहे हैं...' : 'Loading scan records...'}
              </Typography>
            </Box>
          ) : error ? (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          ) : records.length === 0 ? (
            <Paper sx={{ textAlign: 'center', py: 6, px: 3, borderRadius: 3 }}>
              <Typography variant="h4" sx={{ mb: 1 }}>
                🌾
              </Typography>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                {isHindi ? 'कोई स्कैन रिकॉर्ड नहीं मिला' : 'No diagnosis records found'}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {isHindi
                  ? 'रोग की पहचान करने और पर्चा सहेजने के लिए पहली फसल की पत्ती की तस्वीर लें।'
                  : 'Start by scanning your crop leaf to identify diseases and save actionable treatment prescriptions.'}
              </Typography>
              <Button
                variant="contained"
                component={Link}
                to="/predict"
                sx={{ bgcolor: '#2E7D32', '&:hover': { bgcolor: '#1b5e20' }, px: 3 }}
                startIcon={<ScanIcon />}
              >
                {isHindi ? 'अभी स्कैन करें' : 'Scan Leaf Now'}
              </Button>
            </Paper>
          ) : (
            <Stack spacing={3}>
              {records.map((rec) => {
                const statusInfo = statusConfig[rec.follow_up_status] || statusConfig.PENDING_TREATMENT;
                const formattedDate = new Date(rec.created_at).toLocaleDateString(isHindi ? 'hi-IN' : 'en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                });

                return (
                  <Box key={rec.id}>
                    <Card sx={{ borderRadius: 3, boxShadow: 2, borderLeft: `6px solid ${severityColor(rec.severity_level)}` }}>
                      <CardContent sx={{ p: 3 }}>
                        {/* Header Row */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 1 }}>
                          <Box>
                            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                              <Chip
                                label={getCropLabel(rec.crop, isHindi)}
                                size="small"
                                color="success"
                                variant="outlined"
                              />
                              <Chip
                                label={isHindi ? `${rec.severity_level} गंभीरता` : `${rec.severity_level} Severity`}
                                size="small"
                                sx={{
                                  bgcolor: severityColor(rec.severity_level),
                                  color: '#fff',
                                  fontWeight: 'bold'
                                }}
                              />
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <DateIcon fontSize="inherit" /> {formattedDate}
                              </Typography>
                            </Stack>

                            <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#1b5e20', mt: 1 }}>
                              {isHindi ? rec.disease_name_hi || rec.disease_name : rec.disease_name}
                              {rec.disease_name_hi && !isHindi && (
                                <Typography component="span" variant="subtitle1" color="text.secondary" sx={{ ml: 1 }}>
                                  ({rec.disease_name_hi})
                                </Typography>
                              )}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {isHindi ? 'विश्वास स्तर:' : 'Confidence:'} {Math.round(rec.confidence)}% • {isHindi ? 'प्रभावित:' : 'Affected:'}{' '}
                              {Math.round(rec.severity_percentage)}%
                            </Typography>
                          </Box>

                          {/* Status and Action Buttons */}
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Chip
                              icon={statusInfo.icon as any}
                              label={isHindi ? statusInfo.labelHi : statusInfo.labelEn}
                              color={statusInfo.color}
                              variant="filled"
                              sx={{ fontWeight: 'bold' }}
                            />
                            <Tooltip title={isHindi ? 'स्थिति या टिप्पणी बदलें' : 'Update Status / Notes'}>
                              <IconButton size="small" onClick={() => handleOpenEdit(rec)} color="primary">
                                <NoteIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title={isHindi ? 'हटाएं' : 'Delete'}>
                              <IconButton size="small" onClick={() => handleDeleteRecord(rec.id)} color="error">
                                <DeleteIcon />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </Box>

                        <Divider sx={{ my: 2 }} />

                        {/* Prescription Section */}
                        <Box sx={{ bgcolor: '#f9fbe7', p: 2, borderRadius: 2, mb: 2 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#33691e', display: 'flex', alignItems: 'center', gap: 1 }}>
                            <RxIcon /> {isHindi ? 'पर्चा एवं उपचार (Prescription / Remedies)' : 'Treatment Prescription & Remedies'}
                          </Typography>
                          <Box component="ul" sx={{ pl: 3, my: 1 }}>
                            {(isHindi && rec.remedies_hi?.length ? rec.remedies_hi : rec.remedies).map((rem, idx) => (
                              <li key={idx}>
                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                  {rem}
                                </Typography>
                              </li>
                            ))}
                          </Box>

                          {/* Pathologist advice */}
                          {(isHindi ? rec.expert_advice_hi || rec.expert_advice : rec.expert_advice) && (
                            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', mt: 1 }}>
                              💡 <strong>{isHindi ? 'सलाह:' : 'Advice:'}</strong>{' '}
                              {isHindi ? rec.expert_advice_hi || rec.expert_advice : rec.expert_advice}
                            </Typography>
                          )}
                        </Box>

                        {/* Farmer Notes Display */}
                        {rec.notes && (
                          <Paper sx={{ p: 1.5, bgcolor: '#fff', border: '1px dashed #bbb', borderRadius: 2, mb: 1 }}>
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                              📝 {isHindi ? 'मेरी टिप्पणी (My Notes):' : 'My Field Notes:'}
                            </Typography>
                            <Typography variant="body2">{rec.notes}</Typography>
                          </Paper>
                        )}

                        {/* Bottom Bar with Emergency Contact */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 1, flexWrap: 'wrap', gap: 1 }}>
                          <Button
                            size="small"
                            variant="outlined"
                            color="success"
                            href={`tel:${rec.emergency_contact || '1800-180-1551'}`}
                            startIcon={<CallIcon />}
                          >
                            {isHindi ? 'किसान हेल्पलाइन कॉल करें: ' : 'Call Kisan Helpline: '} {rec.emergency_contact || '1800-180-1551'}
                          </Button>

                          <Button size="small" onClick={() => handleOpenEdit(rec)} sx={{ color: '#2E7D32' }}>
                            ✏️ {isHindi ? 'स्थिति अपडेट करें' : 'Update Status'}
                          </Button>
                        </Box>
                      </CardContent>
                    </Card>
                  </Box>
                );
              })}
            </Stack>
          )}
        </Box>
      )}

      {/* TAB 1: SAVED WEATHER ALERTS */}
      {activeTab === 1 && (
        <Box>
          {weatherAlerts.length === 0 ? (
            <Paper sx={{ textAlign: 'center', py: 6, px: 3, borderRadius: 3 }}>
              <Typography variant="h4" sx={{ mb: 1 }}>
                🌤️
              </Typography>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                {isHindi ? 'कोई सहेजा गया मौसम अलर्ट नहीं है' : 'No saved weather alerts'}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {isHindi
                  ? 'मौसम जोखिम की जाँच करें और जोखिम होने पर चेतावनी को यहाँ सहेजें।'
                  : 'Check the 7-day disease risk forecast on the Early Warning page and save critical alerts here.'}
              </Typography>
              <Button
                variant="contained"
                component={Link}
                to="/early-warning"
                sx={{ bgcolor: '#FF9800', '&:hover': { bgcolor: '#f57c00' }, px: 3 }}
                startIcon={<WarningIcon />}
              >
                {isHindi ? 'पूर्व चेतावनी देखें' : 'View Early Warning'}
              </Button>
            </Paper>
          ) : (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 2 }}>
              {weatherAlerts.map((alert) => (
                <Card key={alert.id} sx={{ borderRadius: 3, p: 2, borderLeft: '6px solid #FF9800' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box>
                      <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                        <Chip label={getCropLabel(alert.crop, isHindi)} size="small" color="primary" variant="outlined" />
                        <Chip label={`${alert.risk_level} RISK`} size="small" color="warning" />
                      </Stack>
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        {isHindi ? alert.primary_disease_hi || alert.primary_disease : alert.primary_disease}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ my: 1 }}>
                        {isHindi ? alert.summary_hi || alert.summary : alert.summary}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(alert.created_at).toLocaleDateString()}
                      </Typography>
                    </Box>
                    <IconButton size="small" color="error" onClick={() => handleDeleteAlert(alert.id)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Card>
              ))}
            </Box>
          )}
        </Box>
      )}

      {/* Dialog for Updating Follow-up Status and Field Notes */}
      <Dialog open={!!editingRecord} onClose={() => setEditingRecord(null)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 'bold', color: '#2E7D32' }}>
          📝 {isHindi ? 'उपचार स्थिति एवं टिप्पणी' : 'Update Status & Notes'}
        </DialogTitle>
        <DialogContent>
          <Typography variant="subtitle2" sx={{ mb: 2 }}>
            {editingRecord?.disease_name} ({editingRecord?.crop})
          </Typography>

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>{isHindi ? 'उपचार स्थिति' : 'Follow-up Status'}</InputLabel>
            <Select
              value={newStatus}
              label={isHindi ? 'उपचार स्थिति' : 'Follow-up Status'}
              onChange={(e) => setNewStatus(e.target.value as FollowUpStatus)}
            >
              <MenuItem value="PENDING_TREATMENT">🟡 {isHindi ? 'इलाज बाकी (Pending)' : 'Pending Treatment'}</MenuItem>
              <MenuItem value="TREATED">🔵 {isHindi ? 'उपचार किया गया (Treated)' : 'Treated & Monitoring'}</MenuItem>
              <MenuItem value="RESOLVED">🟢 {isHindi ? 'फसल ठीक हुई (Cured)' : 'Resolved / Recovered'}</MenuItem>
              <MenuItem value="EXPERT_HELP_NEEDED">🔴 {isHindi ? 'विशेषज्ञ सहायता चाहिए' : 'Expert Help Needed'}</MenuItem>
            </Select>
          </FormControl>

          <TextField
            label={isHindi ? 'खेत की टिप्पणी / क्या दवाई छिड़की?' : 'Field Observation / What was sprayed?'}
            multiline
            rows={3}
            fullWidth
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder={isHindi ? 'उदा. 15 तारीख को प्रोपिकोनाजोल 25 ईसी का छिड़काव किया।' : 'e.g. Sprayed recommended fungicide on Friday.'}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setEditingRecord(null)} color="inherit" disabled={updating}>
            {isHindi ? 'रद्द करें' : 'Cancel'}
          </Button>
          <Button
            onClick={handleSaveStatus}
            variant="contained"
            disabled={updating}
            sx={{ bgcolor: '#2E7D32', '&:hover': { bgcolor: '#1b5e20' } }}
          >
            {updating ? (isHindi ? 'सहेज रहे हैं...' : 'Saving...') : (isHindi ? 'सहेजें' : 'Save Update')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default HistoryPage;
