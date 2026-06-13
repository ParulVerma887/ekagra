import { Component, inject, signal, ChangeDetectionStrategy, DestroyRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CartService } from '../../../core/services/cart.service';
import { ProductService } from '../../../core/services/product.service';
import { Product } from '../../../core/models/product.model';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductDetailComponent implements OnInit {
  private route      = inject(ActivatedRoute);
  private cartSvc    = inject(CartService);
  private productSvc = inject(ProductService);
  private destroyRef = inject(DestroyRef);

  // Data comes from resolver — navigation only completes once product is ready
  readonly product: Product = this.route.snapshot.data['product'];

  selectedImage  = signal(this.product.thumbnail);
  quantity       = signal(1);
  added          = signal(false);
  related        = signal<Product[]>([]);

  ngOnInit(): void {
    this.productSvc.getAll(4, 0, '', this.product.category).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe((res) => {
      this.related.set(res.products.filter((p) => p.id !== this.product.id).slice(0, 4));
    });
  }

  selectImage(img: string): void { this.selectedImage.set(img); }

  changeQty(delta: number): void {
    const max = this.product.stock ?? 1;
    this.quantity.update((q) => Math.min(max, Math.max(1, q + delta)));
  }

  addToCart(): void {
    this.cartSvc.add(this.product, this.quantity());
    this.added.set(true);
    setTimeout(() => this.added.set(false), 2000);
  }

  stockLabel(stock: number): string {
    if (stock === 0) return 'Out of stock';
    if (stock < 10) return `Only ${stock} left`;
    return 'In stock';
  }

  stockClass(stock: number): string {
    if (stock === 0) return 'danger';
    if (stock < 10) return 'warning';
    return 'success';
  }
}
