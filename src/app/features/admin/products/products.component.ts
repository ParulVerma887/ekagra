import {
  Component, OnInit, inject, signal, ChangeDetectionStrategy, DestroyRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';

import { ProductStoreService } from '../../../core/services/product-store.service';
import { ProductService } from '../../../core/services/product.service';
import { Product } from '../../../core/models/product.model';
import { ProductFormComponent } from './product-form/product-form.component';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TableModule,
    InputTextModule,
    DropdownModule,
    ButtonModule,
    TagModule,
    ToastModule,
    IconFieldModule,
    InputIconModule,
    TooltipModule,
    ConfirmDialogModule,
    ProductFormComponent,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './products.component.html',
  styleUrl: './products.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductsComponent implements OnInit {
  private store = inject(ProductStoreService);
  private productSvc = inject(ProductService);
  private destroyRef = inject(DestroyRef);
  private msgSvc = inject(MessageService);
  private confirmSvc = inject(ConfirmationService);

  readonly PAGE_SIZE = 10;

  searchCtrl = new FormControl('');
  categoryCtrl = new FormControl<{ label: string; value: string } | null>(null);

  categoryOptions = signal<{ label: string; value: string }[]>([]);
  currentPage = signal(0);
  rowsPerPage = signal(10);

  // Modal state
  formVisible = signal(false);
  selectedProduct = signal<Product | null>(null);

  readonly products = this.store.products;
  readonly total = this.store.total;
  readonly loading = this.store.loading;
  readonly rowsOptions = [5, 10, 25, 50];

  ngOnInit(): void {
    this.loadCategories();
    this.loadPage();

    this.searchCtrl.valueChanges.pipe(
      debounceTime(400), distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => { this.currentPage.set(0); this.loadPage(); });

    this.categoryCtrl.valueChanges.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => { this.currentPage.set(0); this.loadPage(); });
  }

  loadPage(): void {
    const skip = this.currentPage() * this.rowsPerPage();
    const search = this.searchCtrl.value ?? '';
    const category = this.categoryCtrl.value?.value ?? 'all';
    this.store.load(this.rowsPerPage(), skip, search, category);
  }

  loadCategories(): void {
    this.productSvc.getCategories().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe((cats) => {
      this.categoryOptions.set([
        { label: 'All Categories', value: 'all' },
        ...cats.map((c) => ({ label: c.name, value: c.slug })),
      ]);
    });
  }

  onLazyLoad(event: { first: number; rows: number }): void {
    this.currentPage.set(event.first / event.rows);
    this.rowsPerPage.set(event.rows);
    this.loadPage();
  }

  clearFilters(): void {
    this.searchCtrl.setValue('');
    this.categoryCtrl.setValue(null);
  }

  openAdd(): void {
    this.selectedProduct.set(null);
    this.formVisible.set(true);
  }

  openEdit(product: Product): void {
    this.selectedProduct.set(product);
    this.formVisible.set(true);
  }

  onFormSaved(): void {
    this.msgSvc.add({
      severity: 'success',
      summary: this.selectedProduct() ? 'Updated' : 'Added',
      detail: 'Product saved successfully',
      life: 3000,
    });
    this.loadPage();
  }

  confirmDelete(product: Product, index: number): void {
    this.confirmSvc.confirm({
      message: `Delete "${product.title}"?`,
      header: 'Confirm Delete',
      icon: 'pi pi-trash',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.deleteProduct(product, index),
    });
  }

  deleteProduct(product: Product, index: number): void {
    // Optimistic delete — pehle UI se hatao
    this.store.removeProduct(product.id);
    this.msgSvc.add({ severity: 'success', summary: 'Deleted', detail: `"${product.title}" removed`, life: 3000 });

    // API call — DummyJSON DELETE /products/:id
    console.log(`[Delete] Calling DELETE https://dummyjson.com/products/${product.id}`);

    this.productSvc.delete(product.id).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (res) => {
        console.log('[Delete] API success:', res);
      },
      error: (err) => {
        console.error('[Delete] API failed, rolling back:', err);
        this.store.rollbackRemove(product, index);
        this.msgSvc.add({ severity: 'error', summary: 'Failed', detail: `Could not delete. Restored.`, life: 4000 });
      },
    });
  }

  stockSeverity(stock: number): 'success' | 'warning' | 'danger' {
    if (stock === 0) return 'danger';
    if (stock < 10) return 'warning';
    return 'success';
  }
}
