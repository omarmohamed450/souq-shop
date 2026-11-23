import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  signal
} from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '../../../core/services/auth.service';
import { TranslationService } from '../../../core/services/translation.service';
import { LanguageSwitcher } from '../../../shared/components/language-switcher/language-switcher';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-manager-login',
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe, LanguageSwitcher],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './login.html'
})
export class ManagerLogin {
  private readonly formBuilder = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly translation = inject(TranslationService);
  private readonly destroyRef = inject(DestroyRef);

  readonly form = this.formBuilder.nonNullable.group({
    username: ['', [Validators.required, Validators.maxLength(60)]],
    password: ['', [Validators.required, Validators.maxLength(120)]]
  });

  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);

  get usernameControl() {
    return this.form.controls.username;
  }

  get passwordControl() {
    return this.form.controls.password;
  }

  submit(): void {
    this.form.markAllAsTouched();

    if (this.form.invalid || this.submitting()) {
      return;
    }

    this.submitting.set(true);
    this.error.set(null);

    this.auth
      .login(this.form.getRawValue())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.submitting.set(false);
          void this.router.navigate(['/manager/orders']);
        },
        error: (error: HttpErrorResponse) => {
          this.submitting.set(false);

          if (error.status === 401) {
            this.error.set(this.translation.t('manager.login.invalid'));
            return;
          }

          const message = error.error?.message;
          this.error.set(
            typeof message === 'string'
              ? message
              : this.translation.t('manager.login.error')
          );
        }
      });
  }
}
