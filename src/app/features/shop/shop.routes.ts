import { Routes } from '@angular/router';
import { productDetailResolver } from './product-detail/product-detail.resolver';
import { checkoutStepGuard } from './checkout/checkout-step.guard';

export const shopRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./layout/shop-layout.component').then((m) => m.ShopLayoutComponent),
    children: [
      { path: '', redirectTo: 'catalogue', pathMatch: 'full' },
      {
        path: 'catalogue',
        loadComponent: () =>
          import('./catalogue/catalogue.component').then((m) => m.CatalogueComponent),
      },
      {
        path: 'products/:id',
        resolve: { product: productDetailResolver },
        loadComponent: () =>
          import('./product-detail/product-detail.component').then((m) => m.ProductDetailComponent),
      },
      {
        path: 'cart',
        loadComponent: () =>
          import('./cart/cart.component').then((m) => m.CartComponent),
      },
      {
        path: 'checkout/step/:n',
        canActivate: [checkoutStepGuard],
        loadComponent: () =>
          import('./checkout/checkout.component').then((m) => m.CheckoutComponent),
      },
      {
        path: 'order-confirmation/:id',
        loadComponent: () =>
          import('./order-confirmation/order-confirmation.component').then(
            (m) => m.OrderConfirmationComponent
          ),
      },
    ],
  },
];
