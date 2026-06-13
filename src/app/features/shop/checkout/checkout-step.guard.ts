import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { CartService } from '../../../core/services/cart.service';

// Prevents deep-linking to step 2 or 3 without going through step 1
// Step 1 is always accessible; steps 2 and 3 require cart to have items
// and the checkout to have been started from step 1
export const checkoutStepGuard: CanActivateFn = (route) => {
  const cart = inject(CartService);
  const router = inject(Router);

  const step = Number(route.paramMap.get('n'));

  // Empty cart — redirect to shop
  if (cart.count() === 0) {
    return router.createUrlTree(['/shop/catalogue']);
  }

  // Step 1 always allowed if cart has items
  if (step <= 1) return true;

  // Steps 2 and 3 require prior step completion tracked in sessionStorage
  const reached = Number(sessionStorage.getItem('checkout_max_step') ?? '1');
  if (step <= reached + 1) return true;

  return router.createUrlTree(['/shop/checkout/step/1']);
};
