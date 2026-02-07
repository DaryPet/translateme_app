import axios from 'axios';
import { applyInterceptors } from './interceptors';

export const axiosClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

applyInterceptors(axiosClient);
