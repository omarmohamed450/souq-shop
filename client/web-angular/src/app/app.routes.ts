import { Routes } from '@angular/router';
import { managerAuthGuard } from './core/guards/manager-auth.guard';
import { ManagerLayout } from './shared/layouts/manager-layout/manager-layout';
import { PublicLayout } from './shared/layouts/public-layout/public-layout';

export const routes: Routes = [
  {
    path: '',
    component: PublicLayout,
    children: [
      {
        path: '',
        loadComponent: () => import('./features/public/home/home').then((module) => module.Home)
      },
      {
        path: 'items/:id',
        loadComponent: () =>
          import('./features/public/item-details/item-details').then(
            (module) => module.ItemDetails
          )
      },
      {
        path: 'favorites',
        loadComponent: () =>
          import('./features/public/favorites/favorites').then((module) => module.Favorites)
      },
      {
        path: 'cart',
        loadComponent: () => import('./features/public/cart/cart').then((module) => module.Cart)
      },
      {
        path: 'checkout/success',
        data: { mode: 'success' },
        loadComponent: () =>
          import('./features/public/payment-result/payment-result').then(
            (module) => module.PaymentResult
          )
      },
      {
        path: 'checkout/cancel',
        data: { mode: 'cancel' },
        loadComponent: () =>
          import('./features/public/payment-result/payment-result').then(
            (module) => module.PaymentResult
          )
      },
      {
        path: 'checkout',
        loadComponent: () =>
          import('./features/public/checkout/checkout').then((module) => module.Checkout)
      }
    ]
  },
  {
    path: 'manager/login',
    loadComponent: () =>
      import('./features/manager/login/login').then((module) => module.ManagerLogin)
  },
  {
    path: 'manager',
    component: ManagerLayout,
    canActivate: [managerAuthGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'orders' },
      {
        path: 'categories',
        loadComponent: () =>
          import('./features/manager/categories/categories').then(
            (module) => module.ManagerCategories
          )
      },
      {
        path: 'items',
        loadComponent: () =>
          import('./features/manager/items/items').then((module) => module.ManagerItems)
      },
      {
        path: 'orders',
        loadComponent: () =>
          import('./features/manager/orders/orders').then((module) => module.ManagerOrders)
      },
      {
        path: 'orders/:id',
        loadComponent: () =>
          import('./features/manager/order-details/order-details').then(
            (module) => module.ManagerOrderDetails
          )
      },
      {
        path: 'email-templates',
        loadComponent: () =>
          import('./features/manager/email-templates/email-templates').then(
            (module) => module.ManagerEmailTemplates
          )
      },
      {
        path: 'emails',
        loadComponent: () =>
          import('./features/manager/email-dispatcher/email-dispatcher').then(
            (module) => module.ManagerEmailDispatcher
          )
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./features/manager/settings/settings').then(
            (module) => module.ManagerSettings
          )
      },
      {
        path: 'change-password',
        loadComponent: () =>
          import('./features/manager/change-password/change-password').then(
            (module) => module.ManagerChangePassword
          )
      }
    ]
  },
  { path: '**', redirectTo: '' }
];
