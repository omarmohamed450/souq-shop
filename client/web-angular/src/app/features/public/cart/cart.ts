import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CartLine } from '../../../core/models/cart.model';
import { Item } from '../../../core/models/item.model';
import { CartService } from '../../../core/services/cart.service';
import { ItemService } from '../../../core/services/item.service';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

interface CartRow {
  line: CartLine;
  item: Item;
}

@Component({
  selector: 'app-cart',
  imports: [RouterLink, DecimalPipe, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './cart.html'
})
export class Cart implements OnInit {
  private readonly itemService = inject(ItemService);
  private readonly destroyRef = inject(DestroyRef);

  readonly cart = inject(CartService);

  readonly items = signal<Item[]>([]);
  readonly loading = signal(true);
  readonly error = signal(false);

  readonly rows = computed<CartRow[]>(() => {
    const itemsById = new Map(this.items().map((item) => [item._id, item]));

    return this.cart.lines().flatMap((line) => {
      const item = itemsById.get(line.itemId);
      return item ? [{ line, item }] : [];
    });
  });

  readonly total = computed(() =>
    this.rows().reduce((sum, row) => sum + row.item.price * row.line.quantity, 0)
  );

  readonly hasUnavailable = computed(() =>
    this.rows().some((row) => !row.item.isAvailable)
  );

  ngOnInit(): void {
    this.loadCart();
  }

  loadCart(): void {
    const itemIds = this.cart.lines().map((line) => line.itemId);

    this.error.set(false);

    if (itemIds.length === 0) {
      this.items.set([]);
      this.loading.set(false);
      return;
    }

    this.loading.set(true);

    this.itemService
      .getItemsByIds(itemIds)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ items, missingIds }) => {
          this.items.set(items);
          missingIds.forEach((itemId) => this.cart.remove(itemId));
          this.loading.set(false);
        },
        error: () => {
          this.error.set(true);
          this.loading.set(false);
        }
      });
  }

  increase(row: CartRow): void {
    this.cart.setQuantity(row.line.itemId, row.line.quantity + 1);
  }

  decrease(row: CartRow): void {
    this.cart.setQuantity(row.line.itemId, row.line.quantity - 1);
  }

  remove(row: CartRow): void {
    this.cart.remove(row.line.itemId);
    this.items.update((items) => items.filter((item) => item._id !== row.line.itemId));
  }
}
