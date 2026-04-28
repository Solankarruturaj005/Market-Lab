export interface User {
  id: number;
  email: string;
  name?: string | null;
}

export interface AuthResponse {
  user: User;
  access_token: string;
}

export interface MessageResponse {
  message: string;
}

export interface AuthPayload {
  email: string;
  password: string;
  name?: string;
}

export interface VerifyOtpPayload {
  email: string;
  otp: string;
}
