import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  inject,
  signal
} from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  ManagerSettings as ManagerSettingsModel,
  UpdateManagerSettingsPayload
} from '../../../core/models/settings.model';
import { ManagerSettingsService } from '../../../core/services/manager-settings.service';
import { TranslationService } from '../../../core/services/translation.service';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

interface Feedback {
  type: 'success' | 'error';
  message: string;
}

@Component({
  selector: 'app-manager-settings',
  imports: [ReactiveFormsModule, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './settings.html'
})
export class ManagerSettings implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly settingsService = inject(ManagerSettingsService);
  private readonly translation = inject(TranslationService);
  private readonly destroyRef = inject(DestroyRef);

  readonly settings = signal<ManagerSettingsModel | null>(null);
  readonly loading = signal(true);
  readonly loadError = signal(false);
  readonly saving = signal(false);
  readonly feedback = signal<Feedback | null>(null);

  readonly form = this.formBuilder.nonNullable.group({
    autoApproveOrders: [false],
    storefrontUrl: [
      'http://localhost:4200',
      [Validators.required, Validators.pattern(/^https?:\/\/.+/i)]
    ],
    currency: ['egp', [Validators.required, Validators.pattern(/^[a-zA-Z]{3}$/)]],
    stripeSecretKey: [''],
    stripeWebhookSecret: [''],
    clearStripeSecretKey: [false],
    clearStripeWebhookSecret: [false],
    smtpHost: [''],
    smtpPort: [587, [Validators.min(1), Validators.max(65535)]],
    smtpSecure: [false],
    smtpUser: [''],
    smtpPassword: [''],
    clearSmtpPassword: [false],
    smtpFromName: [''],
    smtpFromEmail: ['', [Validators.email, Validators.maxLength(120)]]
  });

  ngOnInit(): void {
    this.loadSettings();
  }

  loadSettings(): void {
    this.loading.set(true);
    this.loadError.set(false);
    this.feedback.set(null);

    this.settingsService
      .getSettings()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (settings) => {
          this.settings.set(settings);
          this.form.patchValue({
            autoApproveOrders: settings.autoApproveOrders,
            storefrontUrl: settings.storefrontUrl,
            currency: settings.currency,
            stripeSecretKey: '',
            stripeWebhookSecret: '',
            clearStripeSecretKey: false,
            clearStripeWebhookSecret: false,
            smtpHost: settings.smtpHost,
            smtpPort: settings.smtpPort,
            smtpSecure: settings.smtpSecure,
            smtpUser: settings.smtpUser,
            smtpPassword: '',
            clearSmtpPassword: false,
            smtpFromName: settings.smtpFromName,
            smtpFromEmail: settings.smtpFromEmail
          });
          this.loading.set(false);
        },
        error: () => {
          this.loadError.set(true);
          this.loading.set(false);
        }
      });
  }

  save(): void {
    this.form.markAllAsTouched();
    this.feedback.set(null);

    if (this.saving() || this.form.invalid) {
      return;
    }

    const value = this.form.getRawValue();
    const payload: UpdateManagerSettingsPayload = {
      autoApproveOrders: value.autoApproveOrders,
      storefrontUrl: value.storefrontUrl.trim(),
      currency: value.currency.trim().toLowerCase(),
      clearStripeSecretKey: value.clearStripeSecretKey,
      clearStripeWebhookSecret: value.clearStripeWebhookSecret,
      smtpHost: value.smtpHost.trim(),
      smtpPort: Number(value.smtpPort),
      smtpSecure: value.smtpSecure,
      smtpUser: value.smtpUser.trim(),
      clearSmtpPassword: value.clearSmtpPassword,
      smtpFromName: value.smtpFromName.trim(),
      smtpFromEmail: value.smtpFromEmail.trim()
    };

    const stripeSecretKey = value.stripeSecretKey.trim();
    const stripeWebhookSecret = value.stripeWebhookSecret.trim();
    const smtpPassword = value.smtpPassword.trim();

    if (stripeSecretKey) payload.stripeSecretKey = stripeSecretKey;
    if (stripeWebhookSecret) payload.stripeWebhookSecret = stripeWebhookSecret;
    if (smtpPassword) payload.smtpPassword = smtpPassword;

    this.saving.set(true);

    this.settingsService
      .updateSettings(payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (settings) => {
          this.settings.set(settings);
          this.form.patchValue({
            stripeSecretKey: '',
            stripeWebhookSecret: '',
            smtpPassword: '',
            clearStripeSecretKey: false,
            clearStripeWebhookSecret: false,
            clearSmtpPassword: false
          });
          this.feedback.set({
            type: 'success',
            message: this.translation.t('manager.settings.saved')
          });
          this.saving.set(false);
        },
        error: (error: HttpErrorResponse) => {
          const message = error.error?.message;
          this.feedback.set({
            type: 'error',
            message:
              typeof message === 'string'
                ? message
                : this.translation.t('manager.settings.saveError')
          });
          this.saving.set(false);
        }
      });
  }

  get storefrontUrlControl() {
    return this.form.controls.storefrontUrl;
  }

  get currencyControl() {
    return this.form.controls.currency;
  }

  get smtpPortControl() {
    return this.form.controls.smtpPort;
  }

  get smtpFromEmailControl() {
    return this.form.controls.smtpFromEmail;
  }

  get webhookPath(): string {
    return '/api/payment/webhook';
  }
}
