import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class BrowserStorageService {
  private readonly platformId = inject(PLATFORM_ID);

  read(key: string): string | null {
    if (!isPlatformBrowser(this.platformId)) {
      return null;
    }

    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  write(key: string, value: string): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    try {
      localStorage.setItem(key, value);
    } catch {
      // Storage can be unavailable in private browsing mode.
    }
  }

  remove(key: string): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    try {
      localStorage.removeItem(key);
    } catch {
      // Ignore storage errors.
    }
  }

  readJson<T>(key: string): T | null {
    const value = this.read(key);

    if (!value) {
      return null;
    }

    try {
      return JSON.parse(value) as T;
    } catch {
      return null;
    }
  }

  writeJson(key: string, value: unknown): void {
    try {
      this.write(key, JSON.stringify(value));
    } catch {
      // Ignore serialization errors.
    }
  }
}
