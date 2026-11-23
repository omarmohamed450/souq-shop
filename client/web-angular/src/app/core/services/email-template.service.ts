import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ApiResponse } from '../models/api.model';
import {
  EmailTemplate,
  EmailTemplateList,
  EmailTemplatePayload
} from '../models/email-template.model';

@Injectable({ providedIn: 'root' })
export class EmailTemplateService {
  private readonly http = inject(HttpClient);

  getTemplates(): Observable<EmailTemplateList> {
    return this.http
      .get<ApiResponse<EmailTemplateList>>('/api/manager/email-templates')
      .pipe(map((response) => response.data));
  }

  createTemplate(payload: EmailTemplatePayload): Observable<EmailTemplate> {
    return this.http
      .post<ApiResponse<{ template: EmailTemplate }>>(
        '/api/manager/email-templates',
        payload
      )
      .pipe(map((response) => response.data.template));
  }

  updateTemplate(
    templateId: string,
    payload: EmailTemplatePayload
  ): Observable<EmailTemplate> {
    return this.http
      .put<ApiResponse<{ template: EmailTemplate }>>(
        `/api/manager/email-templates/${templateId}`,
        payload
      )
      .pipe(map((response) => response.data.template));
  }

  deleteTemplate(templateId: string): Observable<void> {
    return this.http
      .delete<ApiResponse<unknown>>(`/api/manager/email-templates/${templateId}`)
      .pipe(map(() => undefined));
  }
}
