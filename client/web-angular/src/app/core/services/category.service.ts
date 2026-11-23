import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ApiMessageResponse, ApiResponse } from '../models/api.model';
import { Category } from '../models/category.model';

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private readonly http = inject(HttpClient);

  getCategories(): Observable<Category[]> {
    return this.http
      .get<ApiResponse<{ categories: Category[] }>>('/api/categories')
      .pipe(map((response) => response.data.categories));
  }

  getManagerCategories(): Observable<Category[]> {
    return this.http
      .get<ApiResponse<{ categories: Category[] }>>('/api/manager/categories')
      .pipe(map((response) => response.data.categories));
  }

  createCategory(payload: { name: string; description?: string }): Observable<Category> {
    return this.http
      .post<ApiResponse<{ category: Category }>>('/api/manager/categories', payload)
      .pipe(map((response) => response.data.category));
  }

  updateCategory(
    categoryId: string,
    payload: { name?: string; description?: string }
  ): Observable<Category> {
    return this.http
      .patch<ApiResponse<{ category: Category }>>(
        `/api/manager/categories/${categoryId}`,
        payload
      )
      .pipe(map((response) => response.data.category));
  }

  deleteCategory(categoryId: string): Observable<ApiMessageResponse> {
    return this.http.delete<ApiMessageResponse>(`/api/manager/categories/${categoryId}`);
  }
}
