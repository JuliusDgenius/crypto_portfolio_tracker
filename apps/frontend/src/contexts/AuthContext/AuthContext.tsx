import React, { createContext, useReducer, useEffect } from 'react';
import { AuthContextType, AuthState, LoginCredentials, RegisterData, User } from './types';
import { authReducer } from '../AuthContext/authReducer';
import { useAuthService } from '../AuthContext/userAuthService';

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const authService = useAuthService();

  // Initialize auth state on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (token) {
          await refreshToken();
        }
      } catch (error) {
        // Handle initialization error
        console.error('Auth initialization failed:', error);
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    initializeAuth();
  }, []);

  const login = async (credentials: LoginCredentials) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const { user, accessToken } = await authService.login(credentials);
      localStorage.setItem('accessToken', accessToken);
      dispatch({ type: 'LOGIN_SUCCESS', payload: user });
    } catch (error) {
      dispatch({ type: 'AUTH_ERROR', payload: error as Error });
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
      localStorage.removeItem('accessToken');
      dispatch({ type: 'LOGOUT' });
    } catch (error) {
      dispatch({ type: 'AUTH_ERROR', payload: error as Error });
      throw error;
    }
  };

  const register = async (userData: RegisterData) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const { user, accessToken } = await authService.register(userData);
      localStorage.setItem('accessToken', accessToken);
      dispatch({ type: 'REGISTER_SUCCESS', payload: user });
    } catch (error) {
      dispatch({ type: 'AUTH_ERROR', payload: error as Error });
      throw error;
    }
  };

  const updateProfile = async (data: Partial<User>) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const updatedUser = await authService.updateProfile(data);
      dispatch({ type: 'UPDATE_USER', payload: updatedUser });
    } catch (error) {
      dispatch({ type: 'AUTH_ERROR', payload: error as Error });
      throw error;
    }
  };

  const uploadProfilePicture = async (file: File) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const updatedUser = await authService.uploadProfilePicture(file);
      dispatch({ type: 'UPDATE_USER', payload: updatedUser });
    } catch (error) {
      dispatch({ type: 'AUTH_ERROR', payload: error as Error });
      throw error;
    }
  };

  const enable2FA = async () => {
    try {
      const response = await authService.enable2FA();
      if (!state.user?.id) {
        throw new Error('User ID is required to enable 2FA');
      }
      dispatch({ type: 'UPDATE_USER', payload: { ...state.user, is2FAEnabled: true } });
      return response;
    } catch (error) {
      dispatch({ type: 'AUTH_ERROR', payload: error as Error });
      throw error;
    }
  };

  const verify2FA = async (token: string) => {
    try {
      await authService.verify2FA(token);
    } catch (error) {
      dispatch({ type: 'AUTH_ERROR', payload: error as Error });
      throw error;
    }
  };

  const refreshToken = async () => {
    try {
      const { user, accessToken } = await authService.refreshToken();
      localStorage.setItem('accessToken', accessToken);
      dispatch({ type: 'LOGIN_SUCCESS', payload: user });
    } catch (error) {
      localStorage.removeItem('accessToken');
      dispatch({ type: 'LOGOUT' });
      throw error;
    }
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const value = {
    ...state,
    login,
    logout,
    register,
    updateProfile,
    uploadProfilePicture,
    enable2FA,
    verify2FA,
    refreshToken,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
