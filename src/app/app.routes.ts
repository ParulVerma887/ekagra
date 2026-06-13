import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';
import { loginGuard } from './core/guards/login.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    canActivate: [loginGuard],
    loadComponent: () =>
      import('./features/auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'admin',
    canActivate: [adminGuard],
    loadChildren: () =>
      import('./features/admin/admin.routes').then((m) => m.adminRoutes),
  },
  {
    path: 'shop',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./features/shop/shop.routes').then((m) => m.shopRoutes),
    // @defer equivalent at route level: entire shop bundle loads on demand
    data: { preload: false },
  },
  {
    path: '**',
    redirectTo: 'login',
  },
];
