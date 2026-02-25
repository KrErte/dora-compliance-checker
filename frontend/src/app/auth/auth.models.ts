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
  userId: string;
  email: string;
  fullName: string;
  earlyAdopter?: boolean;
  earlyAdopterNumber?: number;
  accountTier?: 'FREE' | 'PREMIUM';
  trialEndDate?: string;
  role?: 'USER' | 'ADMIN';
}

export interface AuthUser {
  userId: string;
  email: string;
  fullName: string;
  earlyAdopter?: boolean;
  earlyAdopterNumber?: number;
  accountTier?: 'FREE' | 'PREMIUM';
  trialEndDate?: string;
  role?: 'USER' | 'ADMIN';
}
