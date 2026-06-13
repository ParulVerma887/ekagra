import { Pipe, PipeTransform } from '@angular/core';
import { CartItem } from '../../core/services/cart.service';

export interface CartSummary {
  subtotal: number;
  tax: number;
  total: number;
}

const TAX_RATE = 0.1; // 10% — configurable via token if needed

@Pipe({ name: 'cartSummary', pure: true, standalone: true })
export class CartSummaryPipe implements PipeTransform {
  transform(items: CartItem[]): CartSummary {
    const subtotal = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
    const tax = subtotal * TAX_RATE;
    return { subtotal, tax, total: subtotal + tax };
  }
}
