import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ApiResponse } from '../models/api.model';
import {
  ManagerSettings,
  UpdateManagerSettingsPayload
} from '../models/settings.model';

@Injectable({ providedIn: 'root' })
export class ManagerSettingsService {
  private readonly http = inject(HttpClient);

  getSettings(): Observable<ManagerSettings> {
    return this.http
      .get<ApiResponse<{ settings: ManagerSettings }>>('/api/manager/settings')
      .pipe(map((response) => response.data.settings));
  }

  updateSettings(
    payload: UpdateManagerSettingsPayload
  ): Observable<ManagerSettings> {
    return this.http
      .put<ApiResponse<{ settings: ManagerSettings }>>(
        '/api/manager/settings',
        payload
      )
      .pipe(map((response) => response.data.settings));
  }
}
