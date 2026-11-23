import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  inject,
  signal
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin } from 'rxjs';
import { Category } from '../../../core/models/category.model';
import { ManagerItem } from '../../../core/models/item.model';
import { CategoryService } from '../../../core/services/category.service';
import { ItemService } from '../../../core/services/item.service';
import { TranslationService } from '../../../core/services/translation.service';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

interface Feedback {
  type: 'success' | 'error';
  message: string;
}

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

@Component({
  selector: 'app-manager-items',
  imports: [ReactiveFormsModule, RouterLink, DecimalPipe, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './items.html'
})
export class ManagerItems implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly itemService = inject(ItemService);
  private readonly categoryService = inject(CategoryService);
  private readonly translation = inject(TranslationService);
  private readonly destroyRef = inject(DestroyRef);

  readonly items = signal<ManagerItem[]>([]);
  readonly categories = signal<Category[]>([]);
  readonly loading = signal(true);
  readonly loadError = signal(false);
  readonly formOpen = signal(false);
  readonly editingItem = signal<ManagerItem | null>(null);
  readonly saving = signal(false);
  readonly deletingId = signal<string | null>(null);
  readonly togglingId = signal<string | null>(null);
  readonly feedback = signal<Feedback | null>(null);
  readonly selectedCategoryIds = signal<string[]>([]);
  readonly categoryError = signal(false);
  readonly imageFile = signal<File | null>(null);
  readonly imagePreviewUrl = signal<string | null>(null);
  readonly imageError = signal<string | null>(null);

  private previewObjectUrl: string | null = null;

  readonly form = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(120)]],
    description: ['', [Validators.maxLength(2000)]],
    price: [0, [Validators.required, Validators.min(0)]],
    quantity: [0, [Validators.required, Validators.min(0), Validators.pattern(/^\d+$/)]],
    imageUrl: ['', [Validators.maxLength(2048)]],
    isHidden: [false]
  });

  get nameControl() {
    return this.form.controls.name;
  }

  get descriptionControl() {
    return this.form.controls.description;
  }

  get priceControl() {
    return this.form.controls.price;
  }

  get quantityControl() {
    return this.form.controls.quantity;
  }

  get imageUrlControl() {
    return this.form.controls.imageUrl;
  }

  constructor() {
    this.destroyRef.onDestroy(() => this.revokePreviewObjectUrl());
  }

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    this.loadError.set(false);

    forkJoin({
      items: this.itemService.getManagerItems(),
      categories: this.categoryService.getManagerCategories()
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ items, categories }) => {
          this.items.set(items);
          this.categories.set(categories);
          this.loading.set(false);
        },
        error: () => {
          this.loadError.set(true);
          this.loading.set(false);
        }
      });
  }

  loadItems(): void {
    this.loading.set(true);
    this.loadError.set(false);

    this.itemService
      .getManagerItems()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (items) => {
          this.items.set(items);
          this.loading.set(false);
        },
        error: () => {
          this.loadError.set(true);
          this.loading.set(false);
        }
      });
  }

  startCreate(): void {
    this.editingItem.set(null);
    this.form.reset({
      name: '',
      description: '',
      price: 0,
      quantity: 0,
      imageUrl: '',
      isHidden: false
    });
    this.selectedCategoryIds.set([]);
    this.categoryError.set(false);
    this.imageFile.set(null);
    this.imageError.set(null);
    this.setPreview(null);
    this.formOpen.set(true);
    this.feedback.set(null);
    this.scrollToForm();
  }

  startEdit(item: ManagerItem): void {
    this.editingItem.set(item);
    this.form.setValue({
      name: item.name,
      description: item.description ?? '',
      price: item.price,
      quantity: item.quantity,
      imageUrl: item.imageUrl ?? '',
      isHidden: item.isHidden
    });
    this.selectedCategoryIds.set(item.categories.map((category) => category._id));
    this.categoryError.set(false);
    this.imageFile.set(null);
    this.imageError.set(null);
    this.setPreview(item.imageUrl || null);
    this.formOpen.set(true);
    this.feedback.set(null);
    this.scrollToForm();
  }

  cancelForm(): void {
    this.formOpen.set(false);
    this.editingItem.set(null);
    this.selectedCategoryIds.set([]);
    this.categoryError.set(false);
    this.imageFile.set(null);
    this.imageError.set(null);
    this.setPreview(null);
    this.form.reset({
      name: '',
      description: '',
      price: 0,
      quantity: 0,
      imageUrl: '',
      isHidden: false
    });
  }

  isCategorySelected(categoryId: string): boolean {
    return this.selectedCategoryIds().includes(categoryId);
  }

  toggleCategory(categoryId: string): void {
    this.selectedCategoryIds.update((categoryIds) =>
      categoryIds.includes(categoryId)
        ? categoryIds.filter((current) => current !== categoryId)
        : [...categoryIds, categoryId]
    );
    this.categoryError.set(false);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;

    input.value = '';
    this.imageError.set(null);

    if (!file) {
      return;
    }

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      this.imageError.set(this.translation.t('manager.items.invalidImageType'));
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      this.imageError.set(this.translation.t('manager.items.imageTooLarge'));
      return;
    }

    this.imageFile.set(file);
    this.revokePreviewObjectUrl();

    if (typeof URL !== 'undefined') {
      const objectUrl = URL.createObjectURL(file);
      this.previewObjectUrl = objectUrl;
      this.imagePreviewUrl.set(objectUrl);
    }
  }

  removeSelectedFile(): void {
    this.imageFile.set(null);
    this.imageError.set(null);

    const editing = this.editingItem();
    this.setPreview(editing?.imageUrl || null);
  }

  save(): void {
    this.form.markAllAsTouched();

    if (this.form.invalid || this.saving()) {
      return;
    }

    if (this.selectedCategoryIds().length === 0) {
      this.categoryError.set(true);
      return;
    }

    const values = this.form.getRawValue();
    const name = values.name.trim();

    if (!name) {
      this.form.controls.name.setErrors({ required: true });
      return;
    }

    const formData = new FormData();
    formData.append('name', name);
    formData.append('description', values.description.trim());
    formData.append('price', String(values.price));
    formData.append('quantity', String(values.quantity));
    formData.append('categories', JSON.stringify(this.selectedCategoryIds()));
    formData.append('imageUrl', values.imageUrl.trim());
    formData.append('isHidden', String(values.isHidden));

    const file = this.imageFile();

    if (file) {
      formData.append('image', file);
    }

    const editing = this.editingItem();

    this.saving.set(true);
    this.feedback.set(null);

    const request = editing
      ? this.itemService.updateItem(editing._id, formData)
      : this.itemService.createItem(formData);

    request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.saving.set(false);
        this.feedback.set({
          type: 'success',
          message: this.translation.t(
            editing ? 'manager.items.updated' : 'manager.items.created'
          )
        });
        this.cancelForm();
        this.loadItems();
      },
      error: (error: HttpErrorResponse) => {
        const message = error.error?.message;
        this.feedback.set({
          type: 'error',
          message:
            typeof message === 'string'
              ? message
              : this.translation.t('manager.items.error')
        });
        this.saving.set(false);
      }
    });
  }

  toggleVisibility(item: ManagerItem): void {
    if (this.togglingId()) {
      return;
    }

    const formData = new FormData();
    formData.append('isHidden', String(!item.isHidden));

    this.togglingId.set(item._id);
    this.feedback.set(null);

    this.itemService
      .updateItem(item._id, formData)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updated) => {
          this.items.update((items) =>
            items.map((current) =>
              current._id === item._id
                ? { ...current, isHidden: updated.isHidden }
                : current
            )
          );
          this.feedback.set({
            type: 'success',
            message: this.translation.t('manager.items.updated')
          });
          this.togglingId.set(null);
        },
        error: (error: HttpErrorResponse) => {
          const message = error.error?.message;
          this.feedback.set({
            type: 'error',
            message:
              typeof message === 'string'
                ? message
                : this.translation.t('manager.items.error')
          });
          this.togglingId.set(null);
        }
      });
  }

  deleteItem(item: ManagerItem): void {
    if (typeof window !== 'undefined') {
      const confirmed = window.confirm(
        this.translation.t('manager.items.deleteConfirm')
      );

      if (!confirmed) {
        return;
      }
    }

    this.deletingId.set(item._id);
    this.feedback.set(null);

    this.itemService
      .deleteItem(item._id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.items.update((items) =>
            items.filter((current) => current._id !== item._id)
          );

          if (this.editingItem()?._id === item._id) {
            this.cancelForm();
          }

          this.feedback.set({
            type: 'success',
            message: this.translation.t('manager.items.deleted')
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
                : this.translation.t('manager.items.error')
          });
          this.deletingId.set(null);
        }
      });
  }

  private setPreview(url: string | null): void {
    this.revokePreviewObjectUrl();
    this.imagePreviewUrl.set(url);
  }

  private revokePreviewObjectUrl(): void {
    if (this.previewObjectUrl && typeof URL !== 'undefined') {
      URL.revokeObjectURL(this.previewObjectUrl);
    }

    this.previewObjectUrl = null;
  }

  private scrollToForm(): void {
    if (typeof document === 'undefined') {
      return;
    }

    setTimeout(() => {
      document.getElementById('item-form')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    });
  }
}
