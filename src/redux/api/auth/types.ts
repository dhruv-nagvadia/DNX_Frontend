import { Role } from '../types';

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  phone?: string | null;
  avatarUrl?: string | null;
  /** When the account was created ("Provider since …"). */
  createdAt?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  role?: Exclude<Role, 'ADMIN'>;
}

export interface AuthData extends AuthUser {
  accessToken: string;
  refreshToken: string;
}

export interface RequestPasswordResetRequest {
  email: string;
}

export interface ResetPasswordRequest {
  email: string;
  otp: string;
  newPassword: string;
}
