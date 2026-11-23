import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, map, tap } from 'rxjs';
import { ApiMessageResponse, ApiResponse } from '../models/api.model';
import { AuthUser, LoginCredentials } from '../models/user.model';
import { BrowserStorageService } from './browser-storage.service';
import { STORAGE_KEYS } from '../constants/storage-keys';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly storage = inject(BrowserStorageService);
  private readonly router = inject(Router);

  private readonly tokenSignal = signal<string | null>(this.storage.read(STORAGE_KEYS.token));
  private readonly userSignal = signal<AuthUser | null>(
    this.storage.readJson<AuthUser>(STORAGE_KEYS.user)
  );

  readonly token = this.tokenSignal.asReadonly();
  readonly user = this.userSignal.asReadonly();
  readonly isAuthenticated = computed(() => this.tokenSignal() !== null);

  login(credentials: LoginCredentials): Observable<AuthUser> {
    return this.http
      .post<ApiResponse<{ token: string; user: AuthUser }>>('/api/auth/login', credentials)
      .pipe(
        tap((response) => {
          this.tokenSignal.set(response.data.token);
          this.userSignal.set(response.data.user);
          this.storage.write(STORAGE_KEYS.token, response.data.token);
          this.storage.writeJson(STORAGE_KEYS.user, response.data.user);
        }),
        map((response) => response.data.user)
      );
  }

  logout(): void {
    this.tokenSignal.set(null);
    this.userSignal.set(null);
    this.storage.remove(STORAGE_KEYS.token);
    this.storage.remove(STORAGE_KEYS.user);
    void this.router.navigate(['/manager/login']);
  }

  changePassword(currentPassword: string, newPassword: string): Observable<ApiMessageResponse> {
    return this.http.patch<ApiMessageResponse>('/api/auth/change-password', {
      currentPassword,
      newPassword
    });
  }
}
