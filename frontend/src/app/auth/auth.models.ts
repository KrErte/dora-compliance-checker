export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
}

export interface AuthResponse {
  token: string;
  refreshToken?: string;
  userId: string;
  email: string;
  fullName: string;
  earlyAdopter?: boolean;
  earlyAdopterNumber?: number;
  accountTier?: 'FREE' | 'PREMIUM';
  trialEndsAt?: string;
  role?: 'USER' | 'ADMIN';
}

export interface AuthUser {
  userId: string;
  email: string;
  fullName: string;
  earlyAdopter?: boolean;
  earlyAdopterNumber?: number;
  accountTier?: 'FREE' | 'PREMIUM';
  trialEndsAt?: string;
  role?: 'USER' | 'ADMIN';
}
