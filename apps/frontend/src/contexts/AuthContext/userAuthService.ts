import { useCallback } from 'react';
import { LoginCredentials, RegisterData, User } from './types';
import { apiClient } from '../../services/api';

export const useAuthService = () => {
  const login = useCallback(async (credentials: LoginCredentials) => {
    const response = await apiClient.post<{ user: User; accessToken: string }>(
      '/api/auth/login',
      credentials
    );
    return response.data;
  }, []);

  const register = useCallback(async (userData: RegisterData) => {
    const response = await apiClient.post<{ user: User; accessToken: string }>(
      '/api/auth/register',
      userData
    );
    return response.data;
  }, []);

  const logout = useCallback(async () => {
    await apiClient.post('/api/auth/logout');
  }, []);

  const updateProfile = useCallback(async (data: Partial<User>) => {
    const response = await apiClient.put<User>('/api/auth/profile', data);
    return response.data;
  }, []);

  const uploadProfilePicture = useCallback(async (file: File) => {
    const formData = new FormData();
    formData.append('profilePicture', file);
    const response = await apiClient.post<User>('/api/auth/profile/picture', formData);
    return response.data;
  }, []);

  const enable2FA = useCallback(async () => {
    const response = await apiClient.post<{ qrCode: string }>('/api/auth/2fa/enable');
    return response.data;
  }, []);

  const verify2FA = useCallback(async (token: string) => {
    await apiClient.post('/api/auth/2fa/verify', { token });
  }, []);

  const refreshToken = useCallback(async () => {
    const response = await apiClient.post<{ user: User; accessToken: string }>(
      '/api/auth/refresh'
    );
    return response.data;
  }, []);

  return {
    login,
    register,
    logout,
    updateProfile,
    uploadProfilePicture,
    enable2FA,
    verify2FA,
    refreshToken,
  };
};
