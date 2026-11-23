import { Injectable, computed, inject, signal } from '@angular/core';
import { BrowserStorageService } from './browser-storage.service';
import { STORAGE_KEYS } from '../constants/storage-keys';

@Injectable({ providedIn: 'root' })
export class FavoritesService {
  private readonly storage = inject(BrowserStorageService);
  private readonly itemIdsSignal = signal<string[]>(this.readInitialFavorites());

  readonly itemIds = this.itemIdsSignal.asReadonly();
  readonly count = computed(() => this.itemIdsSignal().length);

  isFavorite(itemId: string): boolean {
    return this.itemIdsSignal().includes(itemId);
  }

  toggle(itemId: string): void {
    const itemIds = this.itemIdsSignal();

    if (itemIds.includes(itemId)) {
      this.setItemIds(itemIds.filter((id) => id !== itemId));
    } else {
      this.setItemIds([...itemIds, itemId]);
    }
  }

  remove(itemId: string): void {
    this.setItemIds(this.itemIdsSignal().filter((id) => id !== itemId));
  }

  clear(): void {
    this.setItemIds([]);
  }

  private setItemIds(itemIds: string[]): void {
    this.itemIdsSignal.set(itemIds);
    this.storage.writeJson(STORAGE_KEYS.favorites, itemIds);
  }

  private readInitialFavorites(): string[] {
    const stored = this.storage.readJson<unknown>(STORAGE_KEYS.favorites);

    if (!Array.isArray(stored)) {
      return [];
    }

    return stored.filter((itemId): itemId is string => typeof itemId === 'string');
  }
}
