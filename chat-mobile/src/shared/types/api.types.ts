export type ApiResponse<T> = {
  data: T;
  message: string;
};

export type ApiError = {
  message: string;
  errors?: Record<string, string | string[]>;
};
