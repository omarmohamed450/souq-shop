import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { Item } from '../../../core/models/item.model';
import { ItemService } from '../../../core/services/item.service';
import { OrderService } from '../../../core/services/order.service';
import { Checkout } from './checkout';

const cartItem: Item = {
  _id: 'item-1',
  name: 'Stainless Steel Cookware Set',
  description: 'Test item',
  price: 3200,
  imageUrl: '',
  categories: [],
  isAvailable: true
};

describe('Checkout', () => {
  beforeEach(async () => {
    localStorage.setItem(
      'shop_cart',
      JSON.stringify([{ itemId: cartItem._id, quantity: 1 }])
    );

    await TestBed.configureTestingModule({
      imports: [Checkout],
      providers: [
        provideRouter([]),
        {
          provide: ItemService,
          useValue: {
            getItemsByIds: () => of({ items: [cartItem], missingIds: [] })
          }
        },
        {
          provide: OrderService,
          useValue: {
            createOrder: () => of({})
          }
        }
      ]
    }).compileComponents();
  });

  afterEach(() => {
    localStorage.removeItem('shop_cart');
  });

  it('binds the customer fields to the nested customer form group', () => {
    const fixture = TestBed.createComponent(Checkout);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const nameInput = element.querySelector('#customer-name') as HTMLInputElement;
    const phoneInput = element.querySelector('#customer-phone') as HTMLInputElement;
    const addressInput = element.querySelector('#customer-address') as HTMLInputElement;
    const emailInput = element.querySelector('#customer-email') as HTMLInputElement;

    expect(nameInput).toBeTruthy();
    expect(phoneInput).toBeTruthy();
    expect(addressInput).toBeTruthy();
    expect(emailInput).toBeTruthy();

    nameInput.value = 'Omar';
    nameInput.dispatchEvent(new Event('input'));
    phoneInput.value = '01000000000';
    phoneInput.dispatchEvent(new Event('input'));
    addressInput.value = 'Cairo';
    addressInput.dispatchEvent(new Event('input'));
    emailInput.value = 'omar@example.com';
    emailInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(fixture.componentInstance.nameControl.value).toBe('Omar');
    expect(fixture.componentInstance.phoneControl.value).toBe('01000000000');
    expect(fixture.componentInstance.addressControl.value).toBe('Cairo');
    expect(fixture.componentInstance.emailControl.value).toBe('omar@example.com');
    expect(fixture.componentInstance.form.valid).toBe(true);
  });
});
