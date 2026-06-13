import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isAuthenticated() && auth.role() === 'admin') {
    return true;
  }

  // Authenticated but wrong role → send to shop
  if (auth.isAuthenticated()) {
    return router.createUrlTree(['/shop']);
  }

  return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};
