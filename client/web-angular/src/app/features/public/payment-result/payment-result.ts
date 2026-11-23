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
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { timer } from 'rxjs';
import { switchMap, takeWhile } from 'rxjs/operators';
import { PublicOrderStatus } from '../../../core/models/order.model';
import { CartService } from '../../../core/services/cart.service';
import { OrderService } from '../../../core/services/order.service';
import { TranslationService } from '../../../core/services/translation.service';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

type PaymentResultMode = 'success' | 'cancel';

@Component({
  selector: 'app-payment-result',
  imports: [RouterLink, DecimalPipe, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './payment-result.html'
})
export class PaymentResult implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly orderService = inject(OrderService);
  private readonly cart = inject(CartService);
  private readonly translation = inject(TranslationService);
  private readonly destroyRef = inject(DestroyRef);

  readonly mode = signal<PaymentResultMode>(
    (this.route.snapshot.data['mode'] as PaymentResultMode) || 'success'
  );
  readonly order = signal<PublicOrderStatus | null>(null);
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly checking = signal(false);

  readonly statusTitleKey = computed(() => {
    const paymentStatus = this.order()?.paymentStatus;

    if (paymentStatus === 'paid') return 'paymentResult.paid';
    if (paymentStatus === 'failed') return 'paymentResult.failed';
    return 'paymentResult.pending';
  });

  readonly statusClass = computed(() => {
    const paymentStatus = this.order()?.paymentStatus;

    if (paymentStatus === 'paid') {
      return 'border-emerald-200 bg-emerald-50 text-emerald-800';
    }

    if (paymentStatus === 'failed') {
      return 'border-rose-200 bg-rose-50 text-rose-800';
    }

    return 'border-amber-200 bg-amber-50 text-amber-800';
  });

  ngOnInit(): void {
    const orderId = this.route.snapshot.queryParamMap.get('order_id');

    if (this.mode() === 'success') {
      this.cart.clear();
    }

    if (!orderId) {
      this.loading.set(false);
      this.error.set(true);
      return;
    }

    if (this.mode() === 'cancel') {
      this.loadCancelOrder(orderId);
      return;
    }

    this.checking.set(true);
    timer(0, 2000)
      .pipe(
        switchMap(() => this.orderService.getPaymentStatus(orderId)),
        takeWhile((order) => order.paymentStatus === 'pending', true),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (order) => {
          this.order.set(order);
          this.loading.set(false);
          this.checking.set(order.paymentStatus === 'pending');
        },
        error: (error: HttpErrorResponse) => {
          this.loading.set(false);
          this.checking.set(false);
          this.error.set(error.status !== 404);
        }
      });
  }

  retry(): void {
    const orderId = this.route.snapshot.queryParamMap.get('order_id');

    if (!orderId) {
      this.error.set(true);
      return;
    }

    this.error.set(false);
    this.loadCancelOrder(orderId);
  }

  formatDate(value: string | null): string {
    if (!value) return '';

    const locale = this.translation.language() === 'ar' ? 'ar-EG' : 'en-GB';

    return new Intl.DateTimeFormat(locale, {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(new Date(value));
  }

  private loadCancelOrder(orderId: string): void {
    this.loading.set(true);
    this.error.set(false);

    this.orderService
      .getPaymentStatus(orderId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (order) => {
          this.order.set(order);
          this.loading.set(false);
        },
        error: (error: HttpErrorResponse) => {
          this.loading.set(false);
          this.error.set(error.status !== 404);
        }
      });
  }
}
