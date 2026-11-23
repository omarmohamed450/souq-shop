import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CartLine } from '../../../core/models/cart.model';
import { Item } from '../../../core/models/item.model';
import { CartService } from '../../../core/services/cart.service';
import { ItemService } from '../../../core/services/item.service';
import { OrderService } from '../../../core/services/order.service';
import { TranslationService } from '../../../core/services/translation.service';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

interface CheckoutRow {
  line: CartLine;
  item: Item;
}

@Component({
  selector: 'app-checkout',
  imports: [ReactiveFormsModule, RouterLink, DecimalPipe, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './checkout.html'
})
export class Checkout implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly itemService = inject(ItemService);
  private readonly orderService = inject(OrderService);
  private readonly translation = inject(TranslationService);
  private readonly destroyRef = inject(DestroyRef);

  readonly cart = inject(CartService);

  readonly form = this.formBuilder.nonNullable.group({
    customer: this.formBuilder.nonNullable.group({
      name: ['', [Validators.required, Validators.maxLength(120)]],
      phone: ['', [Validators.required, Validators.maxLength(30)]],
      address: ['', [Validators.required, Validators.maxLength(500)]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(120)]]
    }),
    notes: ['', [Validators.maxLength(1000)]]
  });

  readonly items = signal<Item[]>([]);
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly submitting = signal(false);
  readonly submitError = signal<string | null>(null);

  readonly rows = computed<CheckoutRow[]>(() => {
    const itemsById = new Map(this.items().map((item) => [item._id, item]));

    return this.cart.lines().flatMap((line) => {
      const item = itemsById.get(line.itemId);
      return item ? [{ line, item }] : [];
    });
  });

  readonly total = computed(() =>
    this.rows().reduce((sum, row) => sum + row.item.price * row.line.quantity, 0)
  );

  readonly hasUnavailable = computed(() =>
    this.rows().some((row) => !row.item.isAvailable)
  );

  readonly canSubmit = computed(
    () => this.rows().length > 0 && !this.hasUnavailable() && !this.submitting()
  );

  get nameControl() {
    return this.form.controls.customer.controls.name;
  }

  get phoneControl() {
    return this.form.controls.customer.controls.phone;
  }

  get addressControl() {
    return this.form.controls.customer.controls.address;
  }

  get emailControl() {
    return this.form.controls.customer.controls.email;
  }

  get notesControl() {
    return this.form.controls.notes;
  }

  ngOnInit(): void {
    this.loadCart();
  }

  loadCart(): void {
    const itemIds = this.cart.lines().map((line) => line.itemId);

    this.error.set(false);

    if (itemIds.length === 0) {
      this.items.set([]);
      this.loading.set(false);
      return;
    }

    this.loading.set(true);

    this.itemService
      .getItemsByIds(itemIds)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ items, missingIds }) => {
          this.items.set(items);
          missingIds.forEach((itemId) => this.cart.remove(itemId));
          this.loading.set(false);
        },
        error: () => {
          this.error.set(true);
          this.loading.set(false);
        }
      });
  }

  submit(): void {
    this.form.markAllAsTouched();

    if (this.form.invalid || !this.canSubmit()) {
      return;
    }

    const values = this.form.getRawValue();

    this.submitting.set(true);
    this.submitError.set(null);

    this.orderService
      .createOrder({
        customer: values.customer,
        notes: values.notes.trim() || undefined,
        items: this.cart.lines().map((line) => ({
          itemId: line.itemId,
          quantity: line.quantity
        }))
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ checkoutUrl }) => {
          this.cart.clear();
          this.items.set([]);
          this.submitting.set(false);
          window.location.assign(checkoutUrl);
        },
        error: (error: HttpErrorResponse) => {
          const message = error.error?.message;
          this.submitError.set(
            typeof message === 'string'
              ? message
              : this.translation.t('checkout.error')
          );
          this.submitting.set(false);
        }
      });
  }
}
