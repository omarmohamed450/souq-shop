export interface ApiErrorItem {
  field: string;
  message: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  errors?: ApiErrorItem[];
}

export interface ApiMessageResponse {
  success: boolean;
  message?: string;
}
