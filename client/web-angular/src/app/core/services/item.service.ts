import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, forkJoin, map, of, throwError } from 'rxjs';
import { ApiMessageResponse, ApiResponse } from '../models/api.model';
import { Item, ManagerItem } from '../models/item.model';

export interface ItemLookupResult {
  items: Item[];
  missingIds: string[];
}

interface ItemLookupEntry {
  item: Item | null;
  itemId: string;
  missing: boolean;
}

@Injectable({ providedIn: 'root' })
export class ItemService {
  private readonly http = inject(HttpClient);

  getItems(): Observable<Item[]> {
    return this.http
      .get<ApiResponse<{ items: Item[] }>>('/api/items')
      .pipe(map((response) => response.data.items));
  }

  getItem(itemId: string): Observable<Item> {
    return this.http
      .get<ApiResponse<{ item: Item }>>(`/api/items/${itemId}`)
      .pipe(map((response) => response.data.item));
  }

  getItemsByIds(itemIds: string[]): Observable<ItemLookupResult> {
    const uniqueIds = [...new Set(itemIds)];

    if (uniqueIds.length === 0) {
      return of({ items: [], missingIds: [] });
    }

    return forkJoin(
      uniqueIds.map((itemId) =>
        this.getItem(itemId).pipe(
          map((item): ItemLookupEntry => ({ item, itemId, missing: false })),
          catchError((error: HttpErrorResponse) => {
            if (error.status === 404) {
              return of<ItemLookupEntry>({ item: null, itemId, missing: true });
            }

            return throwError(() => error);
          })
        )
      )
    ).pipe(
      map((entries) => ({
        items: entries.flatMap((entry) => (entry.item ? [entry.item] : [])),
        missingIds: entries
          .filter((entry) => entry.missing)
          .map((entry) => entry.itemId)
      }))
    );
  }

  getManagerItems(): Observable<ManagerItem[]> {
    return this.http
      .get<ApiResponse<{ items: ManagerItem[] }>>('/api/manager/items')
      .pipe(map((response) => response.data.items));
  }

  getManagerItem(itemId: string): Observable<ManagerItem> {
    return this.http
      .get<ApiResponse<{ item: ManagerItem }>>(`/api/manager/items/${itemId}`)
      .pipe(map((response) => response.data.item));
  }

  createItem(payload: FormData): Observable<ManagerItem> {
    return this.http
      .post<ApiResponse<{ item: ManagerItem }>>('/api/manager/items', payload)
      .pipe(map((response) => response.data.item));
  }

  updateItem(itemId: string, payload: FormData): Observable<ManagerItem> {
    return this.http
      .patch<ApiResponse<{ item: ManagerItem }>>(`/api/manager/items/${itemId}`, payload)
      .pipe(map((response) => response.data.item));
  }

  deleteItem(itemId: string): Observable<ApiMessageResponse> {
    return this.http.delete<ApiMessageResponse>(`/api/manager/items/${itemId}`);
  }
}
