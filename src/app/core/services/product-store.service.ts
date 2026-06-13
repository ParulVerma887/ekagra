import { Injectable, signal, computed, inject } from '@angular/core';
import { Product } from '../models/product.model';
import { ProductService } from './product.service';
import { Subject, interval } from 'rxjs';

export interface StockUpdate {
  productId: number;
  stock: number;
}

@Injectable({ providedIn: 'root' })
export class ProductStoreService {
  private productSvc = inject(ProductService);

  private _products = signal<Product[]>([]);
  private _total = signal(0);
  private _loading = signal(false);

  readonly products = this._products.asReadonly();
  readonly total = this._total.asReadonly();
  readonly loading = this._loading.asReadonly();

  // Simulated WebSocket stream for stock updates
  readonly stockUpdates$ = new Subject<StockUpdate>();

  constructor() {
    // Randomly push stock updates every 3 seconds for visible products
    interval(3000).subscribe(() => {
      const list = this._products();
      if (!list.length) return;
      const idx = Math.floor(Math.random() * list.length);
      const newStock = Math.max(0, list[idx].stock + Math.floor(Math.random() * 11) - 5);
      this.stockUpdates$.next({ productId: list[idx].id, stock: newStock });

      // Update signal in place
      this._products.update((prev) =>
        prev.map((p) => (p.id === list[idx].id ? { ...p, stock: newStock } : p))
      );
    });
  }

  load(limit: number, skip: number, search?: string, category?: string): void {
    this._loading.set(true);
    this.productSvc.getAll(limit, skip, search, category).subscribe({
      next: (res) => {
        this._products.set(res.products);
        this._total.set(res.total);
        this._loading.set(false);
      },
      error: () => this._loading.set(false),
    });
  }

  addProduct(product: Product): void {
    this._products.update((prev) => [product, ...prev]);
    this._total.update((t) => t + 1);
  }

  updateProduct(updated: Product): void {
    this._products.update((prev) =>
      prev.map((p) => (p.id === updated.id ? updated : p))
    );
  }

  removeProduct(id: number): void {
    this._products.update((prev) => prev.filter((p) => p.id !== id));
    this._total.update((t) => t - 1);
  }

  rollbackRemove(product: Product, index: number): void {
    this._products.update((prev) => {
      const copy = [...prev];
      copy.splice(index, 0, product);
      return copy;
    });
    this._total.update((t) => t + 1);
  }
}
