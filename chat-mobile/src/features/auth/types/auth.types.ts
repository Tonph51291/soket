export type AuthUser = {
  id: string;
  username: string;
  email?: string | null;
  avatar?: string;
  roles?: string[];
  iat?: number;
  exp?: number;
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
  user: AuthUser;
  accessToken?: string;
  refreshToken?: string;
};

// Giữ alias tương thích để các file cũ chưa đổi tên vẫn hoạt động.
export type UserProfile = AuthUser;
