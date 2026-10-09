import axios from 'axios';

// Base URL for the backend API. Override with REACT_APP_API_BASE_URL for deployment.
export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "https://cropsafe.onrender.com";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Test function to check backend connection
export const testBackendConnection = async () => {
  try {
    const response = await api.get('/api/health');
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Backend connection failed:', error);
    return { success: false, error };
  }
};

// Get disease risk for a location
export const getDiseaseRisk = async (lat: number, lon: number, crop: string = 'wheat') => {
  try {
    const response = await api.get('/api/weather-risk', {
      params: { lat, lon, crop }
    });
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Failed to get risk data:', error);
    return { success: false, error };
  }
};

// Upload image for disease prediction (defaults to universal auto-detection)
export const predictDisease = async (file: File, crop?: string) => {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const url = crop ? `/api/predict/${crop}` : '/api/predict/universal';
    const response = await api.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Prediction failed:', error);
    return { success: false, error };
  }
};

export const predictDiseaseUniversal = async (file: File) => {
  return predictDisease(file);
};

// ================= Farmer Profile API =================

export interface FarmerProfile {
  id: number;
  phone: string;
  name: string;
  location_name?: string;
  lat?: number;
  lon?: number;
  created_at?: string;
}

export const loginOrRegisterFarmer = async (
  phone: string,
  name?: string,
  location_name?: string
) => {
  try {
    const response = await api.post('/api/farmers/login', {
      phone,
      name,
      location_name,
    });
    return { success: true, data: response.data };
  } catch (error: any) {
    return {
      success: false,
      error: error.response?.data?.detail || error.message || 'Login failed',
    };
  }
};

export const getFarmerProfile = async (farmerIdOrPhone: string | number) => {
  try {
    const response = await api.get(`/api/farmers/${farmerIdOrPhone}`);
    return { success: true, data: response.data };
  } catch (error: any) {
    return {
      success: false,
      error: error.response?.data?.detail || error.message || 'Profile fetch failed',
    };
  }
};

// ================= Diagnosis History & Prescriptions API =================

export type FollowUpStatus =
  | 'PENDING_TREATMENT'
  | 'TREATED'
  | 'RESOLVED'
  | 'EXPERT_HELP_NEEDED';

export interface DiagnosisRecord {
  id: number;
  farmer_id: number;
  crop: string;
  disease_name: string;
  disease_name_hi?: string;
  confidence: number;
  severity_level: 'Low' | 'Medium' | 'High' | 'Very High' | string;
  severity_percentage: number;
  symptoms: string[];
  symptoms_hi: string[];
  remedies: string[];
  remedies_hi: string[];
  expert_advice?: string;
  expert_advice_hi?: string;
  emergency_contact?: string;
  image_preview?: string;
  follow_up_status: FollowUpStatus;
  notes?: string;
  created_at: string;
}

export interface SaveDiagnosisPayload {
  farmer_id: number;
  crop: string;
  disease_name: string;
  disease_name_hi?: string;
  confidence?: number;
  severity_level?: string;
  severity_percentage?: number;
  symptoms?: string[];
  symptoms_hi?: string[];
  remedies?: string[];
  remedies_hi?: string[];
  expert_advice?: string;
  expert_advice_hi?: string;
  emergency_contact?: string;
  image_preview?: string;
  follow_up_status?: FollowUpStatus;
  notes?: string;
}

export const saveDiagnosisRecord = async (payload: SaveDiagnosisPayload) => {
  try {
    const response = await api.post('/api/history', payload);
    return { success: true, data: response.data };
  } catch (error: any) {
    return {
      success: false,
      error: error.response?.data?.detail || error.message || 'Save record failed',
    };
  }
};

export const getFarmerDiagnosisHistory = async (
  farmerId: number,
  crop?: string,
  status?: string
) => {
  try {
    const response = await api.get(`/api/history/farmer/${farmerId}`, {
      params: { crop, status }
    });
    return { success: true, data: response.data };
  } catch (error: any) {
    return {
      success: false,
      error: error.response?.data?.detail || error.message || 'Fetch history failed',
    };
  }
};

export const updateFollowUpStatus = async (
  historyId: number,
  follow_up_status: FollowUpStatus,
  notes?: string
) => {
  try {
    const response = await api.patch(`/api/history/${historyId}/status`, {
      follow_up_status,
      notes,
    });
    return { success: true, data: response.data };
  } catch (error: any) {
    return {
      success: false,
      error: error.response?.data?.detail || error.message || 'Status update failed',
    };
  }
};

export const deleteDiagnosisRecord = async (historyId: number) => {
  try {
    const response = await api.delete(`/api/history/${historyId}`);
    return { success: true, data: response.data };
  } catch (error: any) {
    return {
      success: false,
      error: error.response?.data?.detail || error.message || 'Delete record failed',
    };
  }
};

// ================= Saved Weather Alerts API =================

export interface SavedWeatherAlert {
  id: number;
  farmer_id: number;
  crop: string;
  risk_level: string;
  primary_disease?: string;
  primary_disease_hi?: string;
  summary?: string;
  summary_hi?: string;
  created_at: string;
}

export const saveWeatherAlert = async (payload: {
  farmer_id: number;
  crop: string;
  risk_level: string;
  primary_disease?: string;
  primary_disease_hi?: string;
  summary?: string;
  summary_hi?: string;
}) => {
  try {
    const response = await api.post('/api/history/weather-alert', payload);
    return { success: true, data: response.data };
  } catch (error: any) {
    return {
      success: false,
      error: error.response?.data?.detail || error.message || 'Save alert failed',
    };
  }
};

export const getFarmerWeatherAlerts = async (farmerId: number) => {
  try {
    const response = await api.get(`/api/history/weather-alert/${farmerId}`);
    return { success: true, data: response.data };
  } catch (error: any) {
    return {
      success: false,
      error: error.response?.data?.detail || error.message || 'Fetch alerts failed',
    };
  }
};

export const deleteWeatherAlert = async (alertId: number) => {
  try {
    const response = await api.delete(`/api/history/weather-alert/${alertId}`);
    return { success: true, data: response.data };
  } catch (error: any) {
    return {
      success: false,
      error: error.response?.data?.detail || error.message || 'Delete alert failed',
    };
  }
};

// ================= Disease Outbreak Map API =================

export interface OutbreakReport {
  id: number;
  farmer_id?: number;
  reporter_name: string;
  reporter_phone?: string;
  crop: string;
  disease_name: string;
  disease_name_hi?: string;
  severity: 'Low' | 'Moderate' | 'High';
  lat: number;
  lon: number;
  district: string;
  state: string;
  description?: string;
  image_url?: string;
  is_ai_verified: number | boolean;
  upvotes: number;
  comment_count?: number;
  distance_km?: number;
  created_at: string;
  comments?: ReportComment[];
}

export interface ReportComment {
  id: number;
  report_id: number;
  farmer_name: string;
  comment_text: string;
  created_at: string;
}

export interface CreateReportPayload {
  crop: string;
  disease_name: string;
  disease_name_hi?: string;
  severity: string;
  lat: number;
  lon: number;
  district: string;
  state: string;
  description?: string;
  image_url?: string;
  reporter_name?: string;
  reporter_phone?: string;
  farmer_id?: number;
  is_ai_verified?: boolean;
}

export const getOutbreakReports = async (params?: {
  crop?: string;
  severity?: string;
  days?: number;
}) => {
  try {
    const response = await api.get('/api/map/reports', { params });
    return { success: true, data: response.data };
  } catch (error: any) {
    return {
      success: false,
      error: error.response?.data?.detail || error.message || 'Failed to fetch outbreak reports',
    };
  }
};

export const submitOutbreakReport = async (payload: CreateReportPayload) => {
  try {
    const response = await api.post('/api/map/reports', payload);
    return { success: true, data: response.data };
  } catch (error: any) {
    return {
      success: false,
      error: error.response?.data?.detail || error.message || 'Failed to submit report',
    };
  }
};

export const getReportDetails = async (reportId: number) => {
  try {
    const response = await api.get(`/api/map/reports/${reportId}`);
    return { success: true, data: response.data };
  } catch (error: any) {
    return {
      success: false,
      error: error.response?.data?.detail || error.message || 'Failed to fetch report details',
    };
  }
};

export const upvoteOutbreakReport = async (reportId: number) => {
  try {
    const response = await api.post(`/api/map/reports/${reportId}/upvote`);
    return { success: true, data: response.data };
  } catch (error: any) {
    return {
      success: false,
      error: error.response?.data?.detail || error.message || 'Failed to upvote report',
    };
  }
};

export const addReportComment = async (
  reportId: number,
  farmerName: string,
  commentText: string
) => {
  try {
    const response = await api.post(`/api/map/reports/${reportId}/comment`, {
      farmer_name: farmerName,
      comment_text: commentText,
    });
    return { success: true, data: response.data };
  } catch (error: any) {
    return {
      success: false,
      error: error.response?.data?.detail || error.message || 'Failed to add comment',
    };
  }
};

export const getNearbyOutbreakAlerts = async (
  lat: number,
  lon: number,
  radiusKm: number = 50,
  crop?: string
) => {
  try {
    const response = await api.get('/api/map/reports/nearby/alerts', {
      params: { lat, lon, radius_km: radiusKm, crop },
    });
    return { success: true, data: response.data };
  } catch (error: any) {
    return {
      success: false,
      error: error.response?.data?.detail || error.message || 'Failed to fetch nearby alerts',
    };
  }
};

// ================= SMS & WhatsApp Outbreak Alerts API =================

export interface NearbyFarmer {
  farmer_id: number;
  name: string;
  phone: string;
  masked_phone: string;
  location_name: string;
  lat: number;
  lon: number;
  distance_km: number;
}

export interface WhatsAppDirectLink {
  farmer_name: string;
  phone: string;
  masked_phone: string;
  distance_km: number;
  url: string;
}

export interface DispatchedAlertRecord {
  farmer_id: number;
  farmer_name: string;
  phone: string;
  distance_km: number;
  location_name: string;
  channel: string;
  status: string;
}

export interface DispatchAlertsResponse {
  success: boolean;
  report_id: number;
  disease_name: string;
  disease_name_hi?: string;
  district: string;
  radius_km: number;
  farmers_count: number;
  alerts_dispatched_count: number;
  dispatched_records: DispatchedAlertRecord[];
  whatsapp_direct_links: WhatsAppDirectLink[];
  group_whatsapp_url: string;
  message_preview: {
    hindi: string;
    english: string;
  };
}

export const getReportNearbyFarmers = async (reportId: number, radiusKm: number = 35) => {
  try {
    const response = await api.get(`/api/map/reports/${reportId}/nearby-farmers`, {
      params: { radius_km: radiusKm },
    });
    return { success: true, data: response.data };
  } catch (error: any) {
    return {
      success: false,
      error: error.response?.data?.detail || error.message || 'Failed to fetch nearby farmers',
    };
  }
};

export const dispatchReportAlerts = async (
  reportId: number,
  payload: {
    radius_km?: number;
    channels?: string[];
    custom_note?: string;
  }
) => {
  try {
    const response = await api.post(`/api/map/reports/${reportId}/dispatch-alerts`, payload);
    return { success: true, data: response.data as DispatchAlertsResponse };
  } catch (error: any) {
    return {
      success: false,
      error: error.response?.data?.detail || error.message || 'Failed to dispatch alerts',
    };
  }
};

export const getReportDispatchedHistory = async (reportId: number) => {
  try {
    const response = await api.get(`/api/map/reports/${reportId}/dispatched-alerts`);
    return { success: true, data: response.data };
  } catch (error: any) {
    return {
      success: false,
      error: error.response?.data?.detail || error.message || 'Failed to fetch alert history',
    };
  }
};

export const getFarmerEmergencyNotifications = async (farmerId: number) => {
  try {
    const response = await api.get(`/api/map/farmer/${farmerId}/notifications`);
    return { success: true, data: response.data };
  } catch (error: any) {
    return {
      success: false,
      error: error.response?.data?.detail || error.message || 'Failed to fetch notifications',
    };
  }
};

export default api;

