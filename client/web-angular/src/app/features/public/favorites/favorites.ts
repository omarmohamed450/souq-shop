import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Item } from '../../../core/models/item.model';
import { FavoritesService } from '../../../core/services/favorites.service';
import { ItemService } from '../../../core/services/item.service';
import { ItemCard } from '../../../shared/components/item-card/item-card';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-favorites',
  imports: [RouterLink, ItemCard, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './favorites.html'
})
export class Favorites implements OnInit {
  private readonly itemService = inject(ItemService);
  private readonly destroyRef = inject(DestroyRef);

  readonly favorites = inject(FavoritesService);

  readonly items = signal<Item[]>([]);
  readonly loading = signal(true);
  readonly error = signal(false);

  readonly favoriteItems = computed(() => {
    const favoriteIds = this.favorites.itemIds();
    return this.items().filter((item) => favoriteIds.includes(item._id));
  });

  ngOnInit(): void {
    this.loadFavorites();
  }

  loadFavorites(): void {
    const itemIds = this.favorites.itemIds();

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
          missingIds.forEach((itemId) => this.favorites.remove(itemId));
          this.loading.set(false);
        },
        error: () => {
          this.error.set(true);
          this.loading.set(false);
        }
      });
  }
}
