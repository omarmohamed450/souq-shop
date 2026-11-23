import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  signal
} from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators
} from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '../../../core/services/auth.service';
import { TranslationService } from '../../../core/services/translation.service';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

interface Feedback {
  type: 'success' | 'error';
  message: string;
}

const passwordsMatchValidator = (group: AbstractControl): ValidationErrors | null => {
  const newPassword = group.get('newPassword')?.value;
  const confirmPassword = group.get('confirmPassword')?.value;

  return newPassword === confirmPassword ? null : { passwordsMismatch: true };
};

@Component({
  selector: 'app-manager-change-password',
  imports: [ReactiveFormsModule, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './change-password.html'
})
export class ManagerChangePassword {
  private readonly formBuilder = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly translation = inject(TranslationService);
  private readonly destroyRef = inject(DestroyRef);

  readonly submitting = signal(false);
  readonly feedback = signal<Feedback | null>(null);

  readonly form = this.formBuilder.nonNullable.group(
    {
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    },
    { validators: passwordsMatchValidator }
  );

  get currentPasswordControl() {
    return this.form.controls.currentPassword;
  }

  get newPasswordControl() {
    return this.form.controls.newPassword;
  }

  get confirmPasswordControl() {
    return this.form.controls.confirmPassword;
  }

  submit(): void {
    this.form.markAllAsTouched();

    if (this.form.invalid || this.submitting()) {
      return;
    }

    const values = this.form.getRawValue();

    this.submitting.set(true);
    this.feedback.set(null);

    this.auth
      .changePassword(values.currentPassword, values.newPassword)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.form.reset({
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
          });
          this.feedback.set({
            type: 'success',
            message: this.translation.t('manager.password.success')
          });
          this.submitting.set(false);
        },
        error: (error: HttpErrorResponse) => {
          const message = error.error?.message;
          this.feedback.set({
            type: 'error',
            message:
              typeof message === 'string'
                ? message
                : this.translation.t('manager.password.error')
          });
          this.submitting.set(false);
        }
      });
  }
}
