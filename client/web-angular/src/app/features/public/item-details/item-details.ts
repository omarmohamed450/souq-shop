import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  inject,
  signal
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Item } from '../../../core/models/item.model';
import { CartService } from '../../../core/services/cart.service';
import { FavoritesService } from '../../../core/services/favorites.service';
import { ItemService } from '../../../core/services/item.service';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-item-details',
  imports: [RouterLink, DecimalPipe, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './item-details.html'
})
export class ItemDetails implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly itemService = inject(ItemService);
  private readonly destroyRef = inject(DestroyRef);

  readonly cart = inject(CartService);
  readonly favorites = inject(FavoritesService);

  readonly item = signal<Item | null>(null);
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly notFound = signal(false);
  readonly imageFailed = signal(false);

  private currentItemId: string | null = null;
  private requestId = 0;

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const itemId = params.get('id');

      if (!itemId) {
        this.notFound.set(true);
        this.loading.set(false);
        return;
      }

      this.currentItemId = itemId;
      this.loadItem(itemId);
    });
  }

  loadItem(itemId: string): void {
    const requestId = ++this.requestId;

    this.loading.set(true);
    this.error.set(false);
    this.notFound.set(false);
    this.item.set(null);
    this.imageFailed.set(false);

    this.itemService
      .getItem(itemId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (item) => {
          if (requestId !== this.requestId) return;

          this.item.set(item);
          this.loading.set(false);
        },
        error: (error: HttpErrorResponse) => {
          if (requestId !== this.requestId) return;

          this.notFound.set(error.status === 404);
          this.error.set(error.status !== 404);
          this.loading.set(false);
        }
      });
  }

  retry(): void {
    if (this.currentItemId) {
      this.loadItem(this.currentItemId);
    }
  }
}
