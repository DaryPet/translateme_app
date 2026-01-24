import { axiosClient } from '@/lib/axios/client';
import { LoginPayload, AuthResponse, RegisterPayload } from './types';

export const login = async (data: LoginPayload): Promise<AuthResponse> => {
  const response = await axiosClient.post<AuthResponse>('/auth/login', data);
  return response.data;
};

export const register = async (
  data: RegisterPayload,
): Promise<AuthResponse> => {
  const response = await axiosClient.post<AuthResponse>('/register', data);
  return response.data;
};

export const refreshToken = async (): Promise<AuthResponse> => {
  const refresh_token = localStorage.getItem('refresh_token');
  if (!refresh_token) throw new Error('No refresh token found');

  // Отправляем запрос на обновление токена, добавляем refresh_token в URL
  const response = await axiosClient.post<AuthResponse>(
    `/auth/refresh_token?refresh_token=${refresh_token}`,
  );

  return response.data; // Возвращаем новые токены
};
