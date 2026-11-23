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
import { RouterLink } from '@angular/router';
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
  selector: 'app-manager-orders',
  imports: [RouterLink, DecimalPipe, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './orders.html'
})
export class ManagerOrders implements OnInit {
  private readonly orderService = inject(OrderService);
  private readonly translation = inject(TranslationService);
  private readonly destroyRef = inject(DestroyRef);

  readonly orders = signal<Order[]>([]);
  readonly loading = signal(true);
  readonly loadError = signal(false);
  readonly updatingId = signal<string | null>(null);
  readonly feedback = signal<Feedback | null>(null);

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.loading.set(true);
    this.loadError.set(false);

    this.orderService
      .getManagerOrders()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (orders) => {
          this.orders.set(orders);
          this.loading.set(false);
        },
        error: () => {
          this.loadError.set(true);
          this.loading.set(false);
        }
      });
  }

  toggleStatus(order: Order): void {
    if (this.updatingId()) {
      return;
    }

    const status = this.nextStatus(order.status);

    this.updatingId.set(order._id);
    this.feedback.set(null);

    this.orderService
      .updateOrderStatus(order._id, status)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updated) => {
          this.replaceOrder(updated);
          this.feedback.set({
            type: 'success',
            message: this.translation.t('manager.orders.statusUpdated')
          });
          this.updatingId.set(null);
        },
        error: (error: HttpErrorResponse) => {
          const message = error.error?.message;
          this.feedback.set({
            type: 'error',
            message:
              typeof message === 'string'
                ? message
                : this.translation.t('manager.orders.statusError')
          });
          this.updatingId.set(null);
        }
      });
  }

  approveOrder(order: Order): void {
    if (this.updatingId()) {
      return;
    }

    this.updatingId.set(order._id);
    this.feedback.set(null);

    this.orderService
      .approveOrder(order._id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updated) => {
          this.replaceOrder(updated);
          this.feedback.set({
            type: 'success',
            message: this.translation.t('manager.orders.approved')
          });
          this.updatingId.set(null);
        },
        error: (error: HttpErrorResponse) => {
          const message = error.error?.message;
          this.feedback.set({
            type: 'error',
            message:
              typeof message === 'string'
                ? message
                : this.translation.t('manager.orders.approveError')
          });
          this.updatingId.set(null);
        }
      });
  }

  rejectOrder(order: Order): void {
    if (this.updatingId()) {
      return;
    }

    const confirmed = window.confirm(
      this.translation.t('manager.orders.confirmReject')
    );

    if (!confirmed) {
      return;
    }

    this.updatingId.set(order._id);
    this.feedback.set(null);

    this.orderService
      .rejectOrder(order._id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updated) => {
          this.replaceOrder(updated);
          this.feedback.set({
            type: 'success',
            message: this.translation.t('manager.orders.rejected')
          });
          this.updatingId.set(null);
        },
        error: (error: HttpErrorResponse) => {
          const message = error.error?.message;
          this.feedback.set({
            type: 'error',
            message:
              typeof message === 'string'
                ? message
                : this.translation.t('manager.orders.rejectError')
          });
          this.updatingId.set(null);
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

  itemCount(order: Order): number {
    return order.items.reduce((sum, item) => sum + item.quantity, 0);
  }

  formatDate(value: string): string {
    const locale = this.translation.language() === 'ar' ? 'ar-EG' : 'en-GB';

    return new Intl.DateTimeFormat(locale, {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(new Date(value));
  }

  private replaceOrder(updated: Order): void {
    this.orders.update((orders) =>
      orders.map((current) => (current._id === updated._id ? updated : current))
    );
  }
}
