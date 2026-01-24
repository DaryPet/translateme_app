// src/features/auth/useAuth.ts
import { useEffect } from 'react';
import { useAppDispatch } from '@/store/hooks';
import { setCredentials } from './authSlice';
import { refreshToken } from './authApi';
import { jwtDecode } from 'jwt-decode';
import { useRouter } from 'next/router';
import { AuthResponse } from './types';

const useAuth = () => {
  const dispatch = useAppDispatch();
  const router = useRouter();

  const refreshAuthToken = async () => {
    try {
      const response: AuthResponse = await refreshToken();
      const decodedUser = jwtDecode<any>(response.access_token);
      dispatch(
        setCredentials({
          access_token: response.access_token,
          token_type: response.token_type, // Добавляем обязательное поле token_type
          user: decodedUser || null, // user может быть как объектом, так и null
        }),
      );
      localStorage.setItem('token', response.access_token); // Сохраняем новый токен
    } catch (error) {
      console.error('Token refresh failed', error);
      localStorage.removeItem('token');
      dispatch(
        setCredentials({ access_token: '', user: null, token_type: '' }),
      );
      router.push('/login');
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const decodedToken = jwtDecode<any>(token);
      const expirationTime = decodedToken.exp * 1000; // Преобразуем в миллисекунды

      if (Date.now() >= expirationTime) {
        // Если токен истёк, обновляем его
        refreshAuthToken();
      }
    }
  }, [dispatch, router]); // Хук срабатывает при изменении состояния
};

export default useAuth;
