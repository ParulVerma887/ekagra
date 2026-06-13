import {
  Component, inject, signal, input, output,
  ChangeDetectionStrategy, effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DestroyRef } from '@angular/core';

import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextareaModule } from 'primeng/inputtextarea';

import { ProductService } from '../../../../core/services/product.service';
import { ProductStoreService } from '../../../../core/services/product-store.service';
import { Product } from '../../../../core/models/product.model';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DialogModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    DropdownModule,
    InputTextareaModule,
  ],
  templateUrl: './product-form.component.html',
  styleUrl: './product-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductFormComponent {
  private fb = inject(FormBuilder);
  private productSvc = inject(ProductService);
  private store = inject(ProductStoreService);
  private destroyRef = inject(DestroyRef);

  visible = input<boolean>(false);
  product = input<Product | null>(null);
  categories = input<{ label: string; value: string }[]>([]);

  closed = output<void>();
  saved = output<void>();

  saving = signal(false);

  form = this.fb.nonNullable.group({
    title:       ['', [Validators.required, Validators.minLength(3)]],
    price:       [0,  [Validators.required, Validators.min(0.01)]],
    stock:       [0,  [Validators.required, Validators.min(0)]],
    category:    ['', Validators.required],
    description: ['', Validators.required],
    brand:       [''],
  });

  get isEdit(): boolean { return !!this.product(); }
  get titleCtrl() { return this.form.controls.title; }
  get priceCtrl() { return this.form.controls.price; }
  get stockCtrl() { return this.form.controls.stock; }
  get categoryCtrl() { return this.form.controls.category; }
  get descriptionCtrl() { return this.form.controls.description; }

  constructor() {
    // Jab bhi visible true ho aur product change ho — form fill karo
    effect(() => {
      const p = this.product();
      const isVisible = this.visible();

      if (isVisible && p) {
        this.form.patchValue({
          title:       p.title,
          price:       p.price,
          stock:       p.stock,
          category:    p.category,
          description: p.description,
          brand:       p.brand ?? '',
        });
      } else if (isVisible && !p) {
        // Add mode — form reset karo
        this.form.reset({
          title: '', price: 0, stock: 0, category: '', description: '', brand: '',
        });
      }
    });
  }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    this.saving.set(true);
    const val = this.form.getRawValue();
    const p = this.product();

    const call$ = p
      ? this.productSvc.update(p.id, val)
      : this.productSvc.create(val);

    call$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        if (p) {
          this.store.updateProduct({ ...p, ...res });
        } else {
          this.store.addProduct(res);
        }
        this.saving.set(false);
        this.saved.emit();
        this.close();
      },
      error: () => this.saving.set(false),
    });
  }

  close(): void {
    this.form.reset();
    this.closed.emit();
  }
}
