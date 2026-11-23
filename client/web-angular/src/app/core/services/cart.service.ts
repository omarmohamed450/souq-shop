import { Injectable, computed, inject, signal } from '@angular/core';
import { CartLine } from '../models/cart.model';
import { BrowserStorageService } from './browser-storage.service';
import { STORAGE_KEYS } from '../constants/storage-keys';

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly storage = inject(BrowserStorageService);
  private readonly linesSignal = signal<CartLine[]>(this.readInitialCart());

  readonly lines = this.linesSignal.asReadonly();
  readonly count = computed(() =>
    this.linesSignal().reduce((total, line) => total + line.quantity, 0)
  );

  add(itemId: string, quantity = 1): void {
    if (quantity <= 0) {
      return;
    }

    const lines = this.linesSignal();
    const existingLine = lines.find((line) => line.itemId === itemId);

    if (existingLine) {
      this.setLines(
        lines.map((line) =>
          line.itemId === itemId
            ? { ...line, quantity: line.quantity + quantity }
            : line
        )
      );
      return;
    }

    this.setLines([...lines, { itemId, quantity }]);
  }

  setQuantity(itemId: string, quantity: number): void {
    if (quantity <= 0) {
      this.remove(itemId);
      return;
    }

    this.setLines(
      this.linesSignal().map((line) =>
        line.itemId === itemId ? { ...line, quantity } : line
      )
    );
  }

  remove(itemId: string): void {
    this.setLines(this.linesSignal().filter((line) => line.itemId !== itemId));
  }

  clear(): void {
    this.setLines([]);
  }

  private setLines(lines: CartLine[]): void {
    this.linesSignal.set(lines);
    this.storage.writeJson(STORAGE_KEYS.cart, lines);
  }

  private readInitialCart(): CartLine[] {
    const stored = this.storage.readJson<unknown>(STORAGE_KEYS.cart);

    if (!Array.isArray(stored)) {
      return [];
    }

    return stored.filter((line): line is CartLine => {
      if (!line || typeof line !== 'object') {
        return false;
      }

      const candidate = line as CartLine;
      return (
        typeof candidate.itemId === 'string' &&
        Number.isInteger(candidate.quantity) &&
        candidate.quantity > 0
      );
    });
  }
}
