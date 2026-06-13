import {
  Component, OnInit, inject, signal, ChangeDetectionStrategy, DestroyRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { ProductService } from '../../../core/services/product.service';
import { CartService } from '../../../core/services/cart.service';
import { Product } from '../../../core/models/product.model';

@Component({
  selector: 'app-catalogue',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  templateUrl: './catalogue.component.html',
  styleUrl: './catalogue.component.scss',
  // OnPush: all state is in signals; Angular only re-renders when signals change
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CatalogueComponent implements OnInit {
  private productSvc = inject(ProductService);
  private cartSvc    = inject(CartService);
  private router     = inject(Router);
  private route      = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);

  products      = signal<Product[]>([]);
  total         = signal(0);
  loading       = signal(true);
  categories    = signal<{ slug: string; name: string }[]>([]);
  activeCategory = signal('all');
  currentPage   = signal(0);
  readonly pageSize = 12;

  searchCtrl = new FormControl('');
  skeletons  = Array(12).fill(0);

  ngOnInit(): void {
    this.observePerformance();

    // Restore filters from URL on load
    const params = this.route.snapshot.queryParamMap;
    const q   = params.get('q') ?? '';
    const cat = params.get('category') ?? 'all';
    const page = Number(params.get('page') ?? '0');

    this.searchCtrl.setValue(q, { emitEvent: false });
    this.activeCategory.set(cat);
    this.currentPage.set(page);

    this.loadCategories();
    this.loadProducts();

    this.searchCtrl.valueChanges.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => {
      this.currentPage.set(0);
      this.syncUrl();
      this.loadProducts();
    });
  }

  loadProducts(): void {
    this.loading.set(true);
    const skip   = this.currentPage() * this.pageSize;
    const search = this.searchCtrl.value ?? '';
    const cat    = this.activeCategory();

    this.productSvc.getAll(this.pageSize, skip, search, cat).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (res) => {
        this.products.set(res.products);
        this.total.set(res.total);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  loadCategories(): void {
    this.productSvc.getCategories().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe((cats) => this.categories.set(cats));
  }

  selectCategory(slug: string): void {
    this.activeCategory.set(slug);
    this.currentPage.set(0);
    this.searchCtrl.setValue('', { emitEvent: false });
    this.syncUrl();
    this.loadProducts();
  }

  prevPage(): void {
    if (this.currentPage() > 0) {
      this.currentPage.update((p) => p - 1);
      this.syncUrl();
      this.loadProducts();
    }
  }

  nextPage(): void {
    if ((this.currentPage() + 1) * this.pageSize < this.total()) {
      this.currentPage.update((p) => p + 1);
      this.syncUrl();
      this.loadProducts();
    }
  }

  addToCart(e: Event, product: Product): void {
    e.preventDefault();
    e.stopPropagation();
    this.cartSvc.add(product, 1);
  }

  private syncUrl(): void {
    const q    = this.searchCtrl.value ?? '';
    const cat  = this.activeCategory();
    const page = this.currentPage();
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        q: q || null,
        category: cat !== 'all' ? cat : null,
        page: page > 0 ? page : null,
      },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  private observePerformance(): void {
    if (!('PerformanceObserver' in window)) return;

    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        console.log(`[Perf] LCP: ${entry.startTime.toFixed(0)}ms`);
      }
    }).observe({ type: 'largest-contentful-paint', buffered: true });

    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const cls = entry as PerformanceEntry & { value: number };
        console.log(`[Perf] CLS: ${cls.value.toFixed(4)}`);
      }
    }).observe({ type: 'layout-shift', buffered: true });
  }

  get totalPages(): number { return Math.ceil(this.total() / this.pageSize); }
  get hasPrev(): boolean   { return this.currentPage() > 0; }
  get hasNext(): boolean   { return (this.currentPage() + 1) * this.pageSize < this.total(); }
}
