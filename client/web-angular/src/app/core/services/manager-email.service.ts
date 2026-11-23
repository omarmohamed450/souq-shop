import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ApiResponse } from '../models/api.model';
import {
  SendManagerEmailPayload,
  SendManagerEmailResult
} from '../models/email-template.model';

@Injectable({ providedIn: 'root' })
export class ManagerEmailService {
  private readonly http = inject(HttpClient);

  sendEmail(
    payload: SendManagerEmailPayload
  ): Observable<{ message: string; delivery: SendManagerEmailResult }> {
    return this.http
      .post<
        ApiResponse<{ delivery: SendManagerEmailResult }>
      >('/api/manager/emails/send', payload)
      .pipe(
        map((response) => ({
          message: response.message || '',
          delivery: response.data.delivery
        }))
      );
  }
}
