import api from './api';
import type { AuthPayload, AuthResponse, MessageResponse, VerifyOtpPayload } from '../types/auth';

export async function login(payload: AuthPayload) {
  const { data } = await api.post<AuthResponse>('/auth/login', payload);
  return data;
}

export async function register(payload: AuthPayload) {
  const { data } = await api.post<MessageResponse>('/auth/register', payload);
  return data;
}

export async function verifyOtp(payload: VerifyOtpPayload) {
  const { data } = await api.post<MessageResponse>('/auth/verify-otp', payload);
  return data;
}
