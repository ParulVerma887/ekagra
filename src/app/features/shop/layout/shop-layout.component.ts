import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { CartService } from '../../../core/services/cart.service';

@Component({
  selector: 'app-shop-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './shop-layout.component.html',
  styleUrl: './shop-layout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShopLayoutComponent {
  private auth = inject(AuthService);
  private cartSvc = inject(CartService);

  readonly user = this.auth.currentUser;
  readonly cartCount = this.cartSvc.count;

  logout(): void { this.auth.logout(); }
}
