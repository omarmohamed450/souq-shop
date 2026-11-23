import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Language, TranslationService } from '../../../core/services/translation.service';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-language-switcher',
  imports: [TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="inline-flex items-center rounded-full border border-stone-300/80 bg-white p-1 shadow-sm"
      role="group"
      [attr.aria-label]="'nav.language' | translate"
    >
      <button
        type="button"
        class="rounded-full px-2.5 py-1 text-[11px] font-bold transition sm:px-3 sm:text-xs"
        [class.bg-teal-700]="translation.language() === 'en'"
        [class.text-white]="translation.language() === 'en'"
        [class.text-stone-500]="translation.language() !== 'en'"
        [attr.aria-pressed]="translation.language() === 'en'"
        (click)="setLanguage('en')"
      >
        EN
      </button>
      <button
        type="button"
        class="rounded-full px-2.5 py-1 text-[11px] font-bold transition sm:px-3 sm:text-xs"
        [class.bg-teal-700]="translation.language() === 'ar'"
        [class.text-white]="translation.language() === 'ar'"
        [class.text-stone-500]="translation.language() !== 'ar'"
        [attr.aria-pressed]="translation.language() === 'ar'"
        (click)="setLanguage('ar')"
      >
        عربي
      </button>
    </div>
  `
})
export class LanguageSwitcher {
  readonly translation = inject(TranslationService);

  setLanguage(language: Language): void {
    this.translation.setLanguage(language);
  }
}
