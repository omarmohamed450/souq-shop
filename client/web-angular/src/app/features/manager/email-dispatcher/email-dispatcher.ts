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
import { forkJoin } from 'rxjs';
import {
  EmailTemplate,
  SendManagerEmailPayload
} from '../../../core/models/email-template.model';
import { PastCustomer } from '../../../core/models/order.model';
import { EmailTemplateService } from '../../../core/services/email-template.service';
import { ManagerEmailService } from '../../../core/services/manager-email.service';
import { OrderService } from '../../../core/services/order.service';
import { TranslationService } from '../../../core/services/translation.service';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

interface Feedback {
  type: 'success' | 'error';
  message: string;
}

@Component({
  selector: 'app-manager-email-dispatcher',
  imports: [ReactiveFormsModule, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './email-dispatcher.html'
})
export class ManagerEmailDispatcher implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly templateService = inject(EmailTemplateService);
  private readonly orderService = inject(OrderService);
  private readonly emailService = inject(ManagerEmailService);
  private readonly translation = inject(TranslationService);
  private readonly destroyRef = inject(DestroyRef);

  readonly templates = signal<EmailTemplate[]>([]);
  readonly customers = signal<PastCustomer[]>([]);
  readonly placeholders = signal<string[]>([]);
  readonly selectedCustomer = signal<PastCustomer | null>(null);
  readonly loading = signal(true);
  readonly loadError = signal(false);
  readonly sending = signal(false);
  readonly feedback = signal<Feedback | null>(null);

  readonly form = this.formBuilder.nonNullable.group({
    to: ['', [Validators.required, Validators.email, Validators.maxLength(120)]],
    templateId: [''],
    orderId: [''],
    subject: ['', [Validators.required, Validators.maxLength(200)]],
    body: ['', [Validators.required, Validators.maxLength(20000)]]
  });

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    this.loadError.set(false);
    this.feedback.set(null);

    forkJoin({
      templates: this.templateService.getTemplates(),
      customers: this.orderService.getCustomers()
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ templates, customers }) => {
          this.templates.set(templates.templates);
          this.placeholders.set(templates.placeholders);
          this.customers.set(customers);
          this.loading.set(false);
        },
        error: () => {
          this.loadError.set(true);
          this.loading.set(false);
        }
      });
  }

  selectCustomer(event: Event): void {
    const email = (event.target as HTMLSelectElement).value;
    const customer = this.customers().find((current) => current.email === email) || null;

    this.selectedCustomer.set(customer);

    if (customer) {
      this.form.patchValue({
        to: customer.email,
        orderId: customer.orderId
      });
    }
  }

  clearCustomer(): void {
    this.selectedCustomer.set(null);
    this.form.patchValue({ orderId: '' });
  }

  onTemplateChange(): void {
    const templateId = this.form.controls.templateId.value;
    const template = this.templates().find((current) => current._id === templateId);

    if (!template) {
      return;
    }

    this.form.patchValue({
      subject: template.subject,
      body: template.body
    });
  }

  send(): void {
    this.form.markAllAsTouched();
    this.feedback.set(null);

    if (this.sending() || this.form.invalid) {
      return;
    }

    const value = this.form.getRawValue();
    const payload: SendManagerEmailPayload = {
      to: value.to.trim(),
      subject: value.subject.trim(),
      body: value.body.trim()
    };

    if (value.templateId) payload.templateId = value.templateId;
    if (value.orderId) payload.orderId = value.orderId;

    this.sending.set(true);

    this.emailService
      .sendEmail(payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ delivery }) => {
          const devMode = delivery.mode === 'development';
          this.feedback.set({
            type: 'success',
            message: this.translation.t(
              devMode
                ? 'manager.emailDispatcher.sentDevelopment'
                : 'manager.emailDispatcher.sent'
            )
          });
          this.sending.set(false);
        },
        error: (error: HttpErrorResponse) => {
          const message = error.error?.message;
          this.feedback.set({
            type: 'error',
            message:
              typeof message === 'string'
                ? message
                : this.translation.t('manager.emailDispatcher.sendError')
          });
          this.sending.set(false);
        }
      });
  }

  get toControl() {
    return this.form.controls.to;
  }

  get subjectControl() {
    return this.form.controls.subject;
  }

  get bodyControl() {
    return this.form.controls.body;
  }

  placeholderText(placeholder: string): string {
    return `{{${placeholder}}}`;
  }
}
