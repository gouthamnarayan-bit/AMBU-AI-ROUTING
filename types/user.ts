export type UserRole = 'ADMIN' | 'AMBULANCE_OPERATOR';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  badgeNumber?: string;
  station?: string;
  createdAt: string;
}

export interface AuthState {
  user: UserProfile | null;
  loading: boolean;
  isDemoUser: boolean;
}
