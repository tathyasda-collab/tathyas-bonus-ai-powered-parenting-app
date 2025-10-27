
import { useContext } from 'react';
import { AuthProvider, useAuth as useAuthFromContext } from '../context/AuthContext';

// This is a re-export for simpler import paths
export const useAuth = useAuthFromContext;