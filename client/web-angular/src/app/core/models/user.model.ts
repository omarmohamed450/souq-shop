export interface AuthUser {
  _id: string;
  username: string;
  role: 'manager';
}

export interface LoginCredentials {
  username: string;
  password: string;
}
