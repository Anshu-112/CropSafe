import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  Alert,
  CircularProgress
} from '@mui/material';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';

export interface Farmer {
  id: number;
  phone: string;
  name: string;
  location_name?: string;
  lat?: number;
  lon?: number;
  created_at?: string;
}

interface FarmerContextType {
  farmer: Farmer | null;
  isLoggedIn: boolean;
  login: (phone: string, name?: string, location_name?: string) => Promise<boolean>;
  logout: () => void;
  openLoginModal: () => void;
  closeLoginModal: () => void;
  isLoginModalOpen: boolean;
}

const FarmerContext = createContext<FarmerContextType | undefined>(undefined);

export const FarmerProvider: React.FC<{ children: ReactNode; language?: string }> = ({ 
  children,
  language = 'en' 
}) => {
  const [farmer, setFarmer] = useState<Farmer | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  
  // Login form state inside modal
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [locationName, setLocationName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Restore session from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('cropsafe_farmer');
      if (saved) {
        setFarmer(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Error loading saved farmer session:', e);
    }
  }, []);

  const login = async (inputPhone: string, inputName?: string, inputLocation?: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const cleanPhone = inputPhone.trim().replace(/\D/g, '');
      if (cleanPhone.length < 10) {
        throw new Error(language === 'hi' ? 'कृपया मान्य 10 अंकों का मोबाइल नंबर दर्ज करें।' : 'Please enter a valid 10-digit mobile number.');
      }

      const res = await axios.post(`${API_BASE_URL}/api/farmers/login`, {
        phone: cleanPhone,
        name: inputName?.trim() || undefined,
        location_name: inputLocation?.trim() || undefined
      });

      if (res.data?.success && res.data.farmer) {
        const farmerData: Farmer = res.data.farmer;
        setFarmer(farmerData);
        localStorage.setItem('cropsafe_farmer', JSON.stringify(farmerData));
        setIsLoginModalOpen(false);
        setPhone('');
        setName('');
        setLocationName('');
        return true;
      }
      return false;
    } catch (err: any) {
      console.error('Login error:', err);
      const msg = err.response?.data?.detail || err.message || 'Login failed';
      setError(msg);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setFarmer(null);
    localStorage.removeItem('cropsafe_farmer');
  };

  const openLoginModal = () => {
    // Navigate to dedicated /login page instead of opening an intrusive modal
    window.location.href = '/login';
  };

  const closeLoginModal = () => {
    setIsLoginModalOpen(false);
  };

  return (
    <FarmerContext.Provider
      value={{
        farmer,
        isLoggedIn: !!farmer,
        login,
        logout,
        openLoginModal,
        closeLoginModal,
        isLoginModalOpen: false
      }}
    >
      {children}
    </FarmerContext.Provider>
  );
};

export const useFarmer = () => {
  const context = useContext(FarmerContext);
  if (!context) {
    throw new Error('useFarmer must be used within a FarmerProvider');
  }
  return context;
};
