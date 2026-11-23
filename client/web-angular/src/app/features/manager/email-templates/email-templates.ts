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
  EmailTemplate,
  EmailTemplatePayload
} from '../../../core/models/email-template.model';
import { EmailTemplateService } from '../../../core/services/email-template.service';
import { TranslationService } from '../../../core/services/translation.service';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

interface Feedback {
  type: 'success' | 'error';
  message: string;
}

@Component({
  selector: 'app-manager-email-templates',
  imports: [ReactiveFormsModule, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './email-templates.html'
})
export class ManagerEmailTemplates implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly templateService = inject(EmailTemplateService);
  private readonly translation = inject(TranslationService);
  private readonly destroyRef = inject(DestroyRef);

  readonly templates = signal<EmailTemplate[]>([]);
  readonly placeholders = signal<string[]>([]);
  readonly loading = signal(true);
  readonly loadError = signal(false);
  readonly saving = signal(false);
  readonly deletingId = signal<string | null>(null);
  readonly feedback = signal<Feedback | null>(null);
  readonly formOpen = signal(false);
  readonly editingId = signal<string | null>(null);

  readonly form = this.formBuilder.nonNullable.group({
    key: ['', [Validators.required, Validators.pattern(/^[a-z0-9_]+$/), Validators.maxLength(80)]],
    name: ['', [Validators.required, Validators.maxLength(120)]],
    subject: ['', [Validators.required, Validators.maxLength(200)]],
    body: ['', [Validators.required, Validators.maxLength(20000)]],
    description: ['', [Validators.maxLength(500)]]
  });

  ngOnInit(): void {
    this.loadTemplates();
  }

  loadTemplates(): void {
    this.loading.set(true);
    this.loadError.set(false);

    this.templateService
      .getTemplates()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ templates, placeholders }) => {
          this.templates.set(templates);
          this.placeholders.set(placeholders);
          this.loading.set(false);
        },
        error: () => {
          this.loadError.set(true);
          this.loading.set(false);
        }
      });
  }

  startCreate(): void {
    this.editingId.set(null);
    this.form.reset({
      key: '',
      name: '',
      subject: '',
      body: '',
      description: ''
    });
    this.formOpen.set(true);
    this.feedback.set(null);
  }

  startEdit(template: EmailTemplate): void {
    this.editingId.set(template._id);
    this.form.reset({
      key: template.key,
      name: template.name,
      subject: template.subject,
      body: template.body,
      description: template.description
    });
    this.formOpen.set(true);
    this.feedback.set(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cancelForm(): void {
    this.formOpen.set(false);
    this.editingId.set(null);
    this.form.reset({
      key: '',
      name: '',
      subject: '',
      body: '',
      description: ''
    });
  }

  submit(): void {
    this.form.markAllAsTouched();
    this.feedback.set(null);

    if (this.saving() || this.form.invalid) {
      return;
    }

    const value = this.form.getRawValue();
    const payload: EmailTemplatePayload = {
      key: value.key.trim().toLowerCase(),
      name: value.name.trim(),
      subject: value.subject.trim(),
      body: value.body.trim(),
      description: value.description.trim()
    };
    const templateId = this.editingId();

    this.saving.set(true);

    const request = templateId
      ? this.templateService.updateTemplate(templateId, payload)
      : this.templateService.createTemplate(payload);

    request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.feedback.set({
          type: 'success',
          message: this.translation.t(
            templateId
              ? 'manager.emailTemplates.updated'
              : 'manager.emailTemplates.created'
          )
        });
        this.saving.set(false);
        this.cancelForm();
        this.loadTemplates();
      },
      error: (error: HttpErrorResponse) => {
        const message = error.error?.message;
        this.feedback.set({
          type: 'error',
          message:
            typeof message === 'string'
              ? message
              : this.translation.t('manager.emailTemplates.saveError')
        });
        this.saving.set(false);
      }
    });
  }

  deleteTemplate(template: EmailTemplate): void {
    if (this.deletingId()) {
      return;
    }

    const confirmed = window.confirm(
      this.translation.t('manager.emailTemplates.confirmDelete', {
        name: template.name
      })
    );

    if (!confirmed) {
      return;
    }

    this.deletingId.set(template._id);
    this.feedback.set(null);

    this.templateService
      .deleteTemplate(template._id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.templates.update((templates) =>
            templates.filter((current) => current._id !== template._id)
          );
          if (this.editingId() === template._id) {
            this.cancelForm();
          }
          this.feedback.set({
            type: 'success',
            message: this.translation.t('manager.emailTemplates.deleted')
          });
          this.deletingId.set(null);
        },
        error: (error: HttpErrorResponse) => {
          const message = error.error?.message;
          this.feedback.set({
            type: 'error',
            message:
              typeof message === 'string'
                ? message
                : this.translation.t('manager.emailTemplates.deleteError')
          });
          this.deletingId.set(null);
        }
      });
  }

  formatDate(value: string): string {
    const locale = this.translation.language() === 'ar' ? 'ar-EG' : 'en-GB';

    return new Intl.DateTimeFormat(locale, {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(new Date(value));
  }

  placeholderText(placeholder: string): string {
    return `{{${placeholder}}}`;
  }

  get keyControl() {
    return this.form.controls.key;
  }

  get nameControl() {
    return this.form.controls.name;
  }

  get subjectControl() {
    return this.form.controls.subject;
  }

  get bodyControl() {
    return this.form.controls.body;
  }
}
