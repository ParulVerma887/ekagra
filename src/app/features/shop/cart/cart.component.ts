import { Component, inject, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CartService } from '../../../core/services/cart.service';
import { CartSummaryPipe } from '../../../shared/pipes/cart-summary.pipe';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterLink, CartSummaryPipe],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CartComponent {
  private cartSvc = inject(CartService);
  private pipe    = new CartSummaryPipe();

  readonly items   = this.cartSvc.items;
  readonly count   = this.cartSvc.count;
  readonly summary = computed(() => this.pipe.transform(this.items()));

  updateQty(productId: number, qty: number): void {
    this.cartSvc.updateQty(productId, qty);
  }

  remove(productId: number): void {
    this.cartSvc.remove(productId);
  }

  clear(): void {
    this.cartSvc.clear();
  }
}
