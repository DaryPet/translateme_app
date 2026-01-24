export type User = {
  id: number;
  email: string;
  name: string;
  role: string | null;
  avatar_url: string | null;
};

export type AuthState = {
  accessToken: string | null;
  user: User | null;
};
export type LoginPayload = {
  email: string;
  password: string;
};
export type RegisterPayload = {
  email: string;
  password: string;
  confirmPassword: string;
};
export type AuthResponse = {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  user: User | null;
};
