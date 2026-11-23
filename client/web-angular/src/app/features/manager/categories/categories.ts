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
import { Category } from '../../../core/models/category.model';
import { CategoryService } from '../../../core/services/category.service';
import { TranslationService } from '../../../core/services/translation.service';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

interface Feedback {
  type: 'success' | 'error';
  message: string;
}

@Component({
  selector: 'app-manager-categories',
  imports: [ReactiveFormsModule, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './categories.html'
})
export class ManagerCategories implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly categoryService = inject(CategoryService);
  private readonly translation = inject(TranslationService);
  private readonly destroyRef = inject(DestroyRef);

  readonly categories = signal<Category[]>([]);
  readonly loading = signal(true);
  readonly loadError = signal(false);
  readonly formOpen = signal(false);
  readonly editingCategory = signal<Category | null>(null);
  readonly saving = signal(false);
  readonly deletingId = signal<string | null>(null);
  readonly feedback = signal<Feedback | null>(null);

  readonly form = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(80)]],
    description: ['', [Validators.maxLength(500)]]
  });

  get nameControl() {
    return this.form.controls.name;
  }

  get descriptionControl() {
    return this.form.controls.description;
  }

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.loading.set(true);
    this.loadError.set(false);

    this.categoryService
      .getManagerCategories()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (categories) => {
          this.categories.set(categories);
          this.loading.set(false);
        },
        error: () => {
          this.loadError.set(true);
          this.loading.set(false);
        }
      });
  }

  startCreate(): void {
    this.editingCategory.set(null);
    this.form.reset({ name: '', description: '' });
    this.formOpen.set(true);
    this.feedback.set(null);
    this.scrollToForm();
  }

  startEdit(category: Category): void {
    this.editingCategory.set(category);
    this.form.setValue({
      name: category.name,
      description: category.description ?? ''
    });
    this.formOpen.set(true);
    this.feedback.set(null);
    this.scrollToForm();
  }

  cancelForm(): void {
    this.formOpen.set(false);
    this.editingCategory.set(null);
    this.form.reset({ name: '', description: '' });
  }

  save(): void {
    this.form.markAllAsTouched();

    if (this.form.invalid || this.saving()) {
      return;
    }

    const values = this.form.getRawValue();
    const name = values.name.trim();

    if (!name) {
      this.form.controls.name.setErrors({ required: true });
      return;
    }

    const payload = {
      name,
      description: values.description.trim()
    };
    const editing = this.editingCategory();

    this.saving.set(true);
    this.feedback.set(null);

    const request = editing
      ? this.categoryService.updateCategory(editing._id, payload)
      : this.categoryService.createCategory(payload);

    request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (category) => {
        if (editing) {
          this.categories.update((categories) =>
            categories
              .map((current) => (current._id === category._id ? category : current))
              .sort((a, b) => a.name.localeCompare(b.name))
          );
          this.feedback.set({
            type: 'success',
            message: this.translation.t('manager.categories.updated')
          });
        } else {
          this.categories.update((categories) =>
            [...categories, category].sort((a, b) => a.name.localeCompare(b.name))
          );
          this.feedback.set({
            type: 'success',
            message: this.translation.t('manager.categories.created')
          });
        }

        this.saving.set(false);
        this.cancelForm();
      },
      error: (error: HttpErrorResponse) => {
        const message = error.error?.message;
        this.feedback.set({
          type: 'error',
          message:
            typeof message === 'string'
              ? message
              : this.translation.t('manager.categories.error')
        });
        this.saving.set(false);
      }
    });
  }

  deleteCategory(category: Category): void {
    if (typeof window !== 'undefined') {
      const confirmed = window.confirm(
        this.translation.t('manager.categories.deleteConfirm')
      );

      if (!confirmed) {
        return;
      }
    }

    this.deletingId.set(category._id);
    this.feedback.set(null);

    this.categoryService
      .deleteCategory(category._id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.categories.update((categories) =>
            categories.filter((current) => current._id !== category._id)
          );

          if (this.editingCategory()?._id === category._id) {
            this.cancelForm();
          }

          this.feedback.set({
            type: 'success',
            message: this.translation.t('manager.categories.deleted')
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
                : this.translation.t('manager.categories.error')
          });
          this.deletingId.set(null);
        }
      });
  }

  private scrollToForm(): void {
    if (typeof document === 'undefined') {
      return;
    }

    setTimeout(() => {
      document.getElementById('category-form')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    });
  }
}
