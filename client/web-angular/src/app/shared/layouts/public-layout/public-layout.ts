import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { CartService } from '../../../core/services/cart.service';
import { FavoritesService } from '../../../core/services/favorites.service';
import { TranslationService } from '../../../core/services/translation.service';
import { LanguageSwitcher } from '../../components/language-switcher/language-switcher';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-public-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, TranslatePipe, LanguageSwitcher],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './public-layout.html'
})
export class PublicLayout {
  readonly translation = inject(TranslationService);
  readonly cart = inject(CartService);
  readonly favorites = inject(FavoritesService);
  readonly auth = inject(AuthService);
  readonly currentYear = new Date().getFullYear();
}
