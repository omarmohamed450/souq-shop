import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { Order } from '../../../core/models/order.model';
import { OrderService } from '../../../core/services/order.service';
import { ManagerOrderDetails } from './order-details';

const baseOrder: Order = {
  _id: 'order-1',
  referenceNumber: '#1001-20261101',
  customer: {
    name: 'Test Customer',
    phone: '01000000000',
    address: 'Test Address',
    email: 'customer@example.com'
  },
  notes: 'Customer note',
  managerNotes: [],
  items: [
    {
      item: 'item-1',
      name: 'Test item',
      price: 100,
      quantity: 1
    }
  ],
  totalPrice: 100,
  status: 'opened',
  paymentStatus: 'paid',
  approvalStatus: 'pending',
  stockDeducted: false,
  stripeSessionId: 'cs_test_1',
  stripePaymentIntentId: 'pi_test_1',
  paymentFailureReason: '',
  approvalError: '',
  confirmationEmailError: '',
  createdAt: '2026-11-01T08:00:00.000Z',
  updatedAt: '2026-11-01T08:00:00.000Z'
};

describe('ManagerOrderDetails', () => {
  let addNoteCalls: Array<{ orderId: string; text: string }>;

  beforeEach(async () => {
    addNoteCalls = [];

    const updatedOrder: Order = {
      ...baseOrder,
      managerNotes: [
        {
          _id: 'note-1',
          text: 'New note',
          createdAt: '2026-11-01T10:00:00.000Z'
        }
      ]
    };

    await TestBed.configureTestingModule({
      imports: [ManagerOrderDetails],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of(convertToParamMap({ id: baseOrder._id }))
          }
        },
        {
          provide: OrderService,
          useValue: {
            getManagerOrder: () => of(baseOrder),
            addManagerNote: (orderId: string, text: string) => {
              addNoteCalls.push({ orderId, text });
              return of(updatedOrder);
            },
            updateOrderStatus: () => of(baseOrder)
          }
        }
      ]
    }).compileComponents();
  });

  it('adds a dated manager note from the order details form', () => {
    const fixture = TestBed.createComponent(ManagerOrderDetails);
    fixture.detectChanges();
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const textarea = element.querySelector('#manager-note') as HTMLTextAreaElement;

    expect(textarea).toBeTruthy();

    textarea.value = 'New note';
    textarea.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const form = element.querySelector('form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    fixture.detectChanges();

    expect(addNoteCalls).toEqual([{ orderId: baseOrder._id, text: 'New note' }]);
    expect(fixture.componentInstance.managerNotes().length).toBe(1);
    expect(fixture.componentInstance.managerNotes()[0].text).toBe('New note');
    expect(element.textContent).toContain('New note');
  });
});
