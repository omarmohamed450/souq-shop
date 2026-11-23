import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin } from 'rxjs';
import { Category } from '../../../core/models/category.model';
import { Item } from '../../../core/models/item.model';
import { CategoryService } from '../../../core/services/category.service';
import { ItemService } from '../../../core/services/item.service';
import { ItemCard } from '../../../shared/components/item-card/item-card';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-home',
  imports: [ItemCard, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './home.html'
})
export class Home implements OnInit {
  private readonly categoryService = inject(CategoryService);
  private readonly itemService = inject(ItemService);
  private readonly destroyRef = inject(DestroyRef);

  readonly categories = signal<Category[]>([]);
  readonly items = signal<Item[]>([]);
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly selectedCategoryId = signal<string | null>(null);

  readonly filteredItems = computed(() => {
    const categoryId = this.selectedCategoryId();

    if (!categoryId) {
      return this.items();
    }

    return this.items().filter((item) =>
      item.categories.some((category) => category._id === categoryId)
    );
  });

  ngOnInit(): void {
    this.loadStore();
  }

  loadStore(): void {
    this.loading.set(true);
    this.error.set(false);

    forkJoin({
      categories: this.categoryService.getCategories(),
      items: this.itemService.getItems()
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ categories, items }) => {
          this.categories.set(categories);
          this.items.set(items);
          this.loading.set(false);
        },
        error: () => {
          this.error.set(true);
          this.loading.set(false);
        }
      });
  }

  selectCategory(categoryId: string | null): void {
    this.selectedCategoryId.set(categoryId);
  }
}
