import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ApiResponse } from '../models/api.model';
import {
  CreateOrderPayload,
  CreateOrderResult,
  Order,
  OrderStatus,
  PastCustomer,
  PublicOrderStatus
} from '../models/order.model';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly http = inject(HttpClient);

  createOrder(payload: CreateOrderPayload): Observable<CreateOrderResult> {
    return this.http
      .post<ApiResponse<CreateOrderResult>>('/api/orders', payload)
      .pipe(map((response) => response.data));
  }

  getPaymentStatus(orderId: string): Observable<PublicOrderStatus> {
    return this.http
      .get<ApiResponse<{ order: PublicOrderStatus }>>(
        `/api/orders/${orderId}/payment-status`
      )
      .pipe(map((response) => response.data.order));
  }

  getManagerOrders(): Observable<Order[]> {
    return this.http
      .get<ApiResponse<{ orders: Order[] }>>('/api/manager/orders')
      .pipe(map((response) => response.data.orders));
  }

  getManagerOrder(orderId: string): Observable<Order> {
    return this.http
      .get<ApiResponse<{ order: Order }>>(`/api/manager/orders/${orderId}`)
      .pipe(map((response) => response.data.order));
  }

  getCustomers(): Observable<PastCustomer[]> {
    return this.http
      .get<ApiResponse<{ customers: PastCustomer[] }>>('/api/manager/customers')
      .pipe(map((response) => response.data.customers));
  }

  updateOrderStatus(orderId: string, status: OrderStatus): Observable<Order> {
    return this.http
      .patch<ApiResponse<{ order: Order }>>(`/api/manager/orders/${orderId}/status`, {
        status
      })
      .pipe(map((response) => response.data.order));
  }

  approveOrder(orderId: string): Observable<Order> {
    return this.http
      .post<ApiResponse<{ order: Order }>>(
        `/api/manager/orders/${orderId}/approve`,
        {}
      )
      .pipe(map((response) => response.data.order));
  }

  rejectOrder(orderId: string): Observable<Order> {
    return this.http
      .post<ApiResponse<{ order: Order }>>(
        `/api/manager/orders/${orderId}/reject`,
        {}
      )
      .pipe(map((response) => response.data.order));
  }

  addManagerNote(orderId: string, text: string): Observable<Order> {
    return this.http
      .post<ApiResponse<{ order: Order }>>(`/api/manager/orders/${orderId}/notes`, {
        text
      })
      .pipe(map((response) => response.data.order));
  }
}
