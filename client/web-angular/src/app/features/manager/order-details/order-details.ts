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
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Order, OrderStatus } from '../../../core/models/order.model';
import { OrderService } from '../../../core/services/order.service';
import { TranslationService } from '../../../core/services/translation.service';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

interface Feedback {
  type: 'success' | 'error';
  message: string;
}

@Component({
  selector: 'app-manager-order-details',
  imports: [RouterLink, DecimalPipe, ReactiveFormsModule, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './order-details.html'
})
export class ManagerOrderDetails implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly orderService = inject(OrderService);
  private readonly translation = inject(TranslationService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly formBuilder = inject(FormBuilder);

  readonly order = signal<Order | null>(null);
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly notFound = signal(false);
  readonly updating = signal(false);
  readonly savingNote = signal(false);
  readonly noteError = signal<string | null>(null);
  readonly feedback = signal<Feedback | null>(null);

  readonly noteForm = this.formBuilder.nonNullable.group({
    text: ['', [Validators.required, Validators.maxLength(1000)]]
  });

  readonly managerNotes = computed(() =>
    [...(this.order()?.managerNotes ?? [])].sort(
      (first, second) =>
        new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime()
    )
  );

  private currentOrderId: string | null = null;
  private requestId = 0;

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const orderId = params.get('id');

      if (!orderId) {
        this.notFound.set(true);
        this.loading.set(false);
        return;
      }

      this.currentOrderId = orderId;
      this.loadOrder(orderId);
    });
  }

  loadOrder(orderId: string): void {
    const requestId = ++this.requestId;

    this.loading.set(true);
    this.error.set(false);
    this.notFound.set(false);
    this.feedback.set(null);
    this.noteError.set(null);
    this.noteForm.reset({ text: '' });

    this.orderService
      .getManagerOrder(orderId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (order) => {
          if (requestId !== this.requestId) return;

          this.order.set(order);
          this.loading.set(false);
        },
        error: (error: HttpErrorResponse) => {
          if (requestId !== this.requestId) return;

          this.notFound.set(error.status === 404);
          this.error.set(error.status !== 404);
          this.loading.set(false);
        }
      });
  }

  retry(): void {
    if (this.currentOrderId) {
      this.loadOrder(this.currentOrderId);
    }
  }

  toggleStatus(): void {
    const order = this.order();

    if (!order || this.updating()) {
      return;
    }

    const status = this.nextStatus(order.status);

    this.updateStatus(status);
  }

  approveOrder(): void {
    const order = this.order();

    if (!order || this.updating()) {
      return;
    }

    this.updating.set(true);
    this.feedback.set(null);

    this.orderService
      .approveOrder(order._id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updated) => {
          this.order.set(updated);
          this.feedback.set({
            type: 'success',
            message: this.translation.t('manager.orderDetails.approved')
          });
          this.updating.set(false);
        },
        error: (error: HttpErrorResponse) => {
          const message = error.error?.message;
          this.feedback.set({
            type: 'error',
            message:
              typeof message === 'string'
                ? message
                : this.translation.t('manager.orderDetails.approveError')
          });
          this.updating.set(false);
        }
      });
  }

  rejectOrder(): void {
    const order = this.order();

    if (!order || this.updating()) {
      return;
    }

    const confirmed = window.confirm(
      this.translation.t('manager.orderDetails.confirmReject')
    );

    if (!confirmed) {
      return;
    }

    this.updating.set(true);
    this.feedback.set(null);

    this.orderService
      .rejectOrder(order._id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updated) => {
          this.order.set(updated);
          this.feedback.set({
            type: 'success',
            message: this.translation.t('manager.orderDetails.rejected')
          });
          this.updating.set(false);
        },
        error: (error: HttpErrorResponse) => {
          const message = error.error?.message;
          this.feedback.set({
            type: 'error',
            message:
              typeof message === 'string'
                ? message
                : this.translation.t('manager.orderDetails.rejectError')
          });
          this.updating.set(false);
        }
      });
  }

  nextStatus(status: OrderStatus): OrderStatus {
    if (status === 'opened') return 'in-transit';
    if (status === 'in-transit') return 'closed';
    return 'opened';
  }

  statusLabelKey(status: OrderStatus): string {
    if (status === 'opened') return 'manager.orders.opened';
    if (status === 'in-transit') return 'manager.orders.inTransit';
    return 'manager.orders.closed';
  }

  statusActionKey(status: OrderStatus): string {
    if (status === 'opened') return 'manager.orders.markInTransit';
    if (status === 'in-transit') return 'manager.orders.closeOrder';
    return 'manager.orders.openOrder';
  }

  paymentLabelKey(order: Order): string {
    return `manager.payment.${order.paymentStatus}`;
  }

  approvalLabelKey(order: Order): string {
    return `manager.approval.${order.approvalStatus}`;
  }

  canApprove(order: Order): boolean {
    return (
      order.approvalStatus === 'pending' &&
      order.paymentStatus === 'paid' &&
      !order.stockDeducted
    );
  }

  private updateStatus(status: OrderStatus): void {
    const order = this.order();

    if (!order) {
      return;
    }

    this.updating.set(true);
    this.feedback.set(null);

    this.orderService
      .updateOrderStatus(order._id, status)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updated) => {
          this.order.set(updated);
          this.feedback.set({
            type: 'success',
            message: this.translation.t('manager.orderDetails.statusUpdated')
          });
          this.updating.set(false);
        },
        error: (error: HttpErrorResponse) => {
          const message = error.error?.message;
          this.feedback.set({
            type: 'error',
            message:
              typeof message === 'string'
                ? message
                : this.translation.t('manager.orderDetails.statusError')
          });
          this.updating.set(false);
        }
      });
  }

  itemCount(order: Order): number {
    return order.items.reduce((sum, item) => sum + item.quantity, 0);
  }

  get noteControl() {
    return this.noteForm.controls.text;
  }

  addNote(): void {
    const order = this.order();

    this.noteForm.markAllAsTouched();
    this.noteError.set(null);

    if (!order || this.savingNote() || this.noteForm.invalid) {
      return;
    }

    const text = this.noteControl.value.trim();

    if (!text) {
      this.noteControl.setErrors({ required: true });
      return;
    }

    this.savingNote.set(true);
    this.feedback.set(null);

    this.orderService
      .addManagerNote(order._id, text)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updated) => {
          this.order.set(updated);
          this.noteForm.reset({ text: '' });
          this.feedback.set({
            type: 'success',
            message: this.translation.t('manager.orderDetails.noteAdded')
          });
          this.savingNote.set(false);
        },
        error: (error: HttpErrorResponse) => {
          const message = error.error?.message;

          this.noteError.set(
            typeof message === 'string'
              ? message
              : this.translation.t('manager.orderDetails.noteError')
          );
          this.savingNote.set(false);
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
}
