export type UserProfile = {
  id: string;
  username: string;
  email: string;
  avatar?: string;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type RegisterRequest = {
  username: string;
  email: string;
  password: string;
};

export type AuthResponse = {
  user: UserProfile;
  accessToken: string;
  refreshToken: string;
};
