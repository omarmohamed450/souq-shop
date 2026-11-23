import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Item } from '../../../core/models/item.model';
import { CartService } from '../../../core/services/cart.service';
import { FavoritesService } from '../../../core/services/favorites.service';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-item-card',
  imports: [RouterLink, DecimalPipe, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './item-card.html'
})
export class ItemCard {
  readonly item = input.required<Item>();
  readonly cart = inject(CartService);
  readonly favorites = inject(FavoritesService);
  readonly imageFailed = signal(false);
}
