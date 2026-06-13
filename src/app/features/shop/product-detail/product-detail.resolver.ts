import { inject } from '@angular/core';
import { ResolveFn, Router } from '@angular/router';
import { catchError, EMPTY } from 'rxjs';
import { ProductService } from '../../../core/services/product.service';
import { Product } from '../../../core/models/product.model';

export const productDetailResolver: ResolveFn<Product> = (route) => {
  const productSvc = inject(ProductService);
  const router = inject(Router);
  const id = Number(route.paramMap.get('id'));

  if (!id) {
    router.navigate(['/shop/catalogue']);
    return EMPTY;
  }

  return productSvc.getById(id).pipe(
    catchError(() => {
      router.navigate(['/shop/catalogue']);
      return EMPTY;
    })
  );
};
