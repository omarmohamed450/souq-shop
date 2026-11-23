import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { TranslationService } from '../../../core/services/translation.service';
import { LanguageSwitcher } from '../../components/language-switcher/language-switcher';
import { TranslatePipe } from '../../pipes/translate.pipe';

interface ManagerNavLink {
  path: string;
  labelKey: string;
}

@Component({
  selector: 'app-manager-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, TranslatePipe, LanguageSwitcher],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './manager-layout.html'
})
export class ManagerLayout {
  readonly auth = inject(AuthService);
  readonly translation = inject(TranslationService);

  readonly navLinks: ManagerNavLink[] = [
    { path: '/manager/categories', labelKey: 'manager.nav.categories' },
    { path: '/manager/items', labelKey: 'manager.nav.items' },
    { path: '/manager/orders', labelKey: 'manager.nav.orders' },
    { path: '/manager/email-templates', labelKey: 'manager.nav.emailTemplates' },
    { path: '/manager/emails', labelKey: 'manager.nav.emailDispatcher' },
    { path: '/manager/settings', labelKey: 'manager.nav.settings' },
    { path: '/manager/change-password', labelKey: 'manager.nav.changePassword' }
  ];

  logout(): void {
    this.auth.logout();
  }
}
