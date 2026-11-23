import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-coming-soon',
  imports: [TranslatePipe, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="mx-auto flex min-h-[55vh] max-w-3xl flex-col justify-center py-12">
      <span
        class="w-fit rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-teal-800"
      >
        {{ 'brand.name' | translate }}
      </span>
      <h1 class="mt-5 text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl">
        {{ titleKey() | translate }}
      </h1>
      <p class="mt-4 max-w-xl text-base leading-7 text-stone-600">
        {{ 'common.comingSoon' | translate }}
      </p>
      <a
        routerLink="/"
        class="mt-8 w-fit rounded-full bg-teal-700 px-5 py-2.5 text-sm font-bold text-white shadow-sm shadow-teal-900/20 transition hover:bg-teal-800"
      >
        {{ 'common.backHome' | translate }}
      </a>
    </section>
  `
})
export class ComingSoon {
  readonly titleKey = input.required<string>();
}
