import {
  Component, OnInit, inject, signal, ChangeDetectionStrategy, DestroyRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { CartService } from '../../../core/services/cart.service';
import { luhnValidator } from '../../../shared/validators/luhn.validator';
import { isFieldVisible } from '../../../shared/utils/form-visibility';

interface FormField {
  name: string;
  label: string;
  type: string;
  placeholder?: string;
  validators: string[];
  visibleWhen?: { field: string; value: unknown };
}

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckoutComponent implements OnInit {
  private fb = inject(FormBuilder);
  private cartSvc = inject(CartService);
  private http = inject(HttpClient);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  readonly items = this.cartSvc.items;
  readonly total = this.cartSvc.total;

  step = signal(1);
  submitting = signal(false);
  formFields = signal<FormField[]>([]);

  // Step 1 — Shipping
  shippingForm!: FormGroup;

  // Step 2 — Payment (dynamic from JSON)
  paymentForm!: FormGroup;

  ngOnInit(): void {
    this.shippingForm = this.fb.group({
      fullName:  ['', [Validators.required, Validators.minLength(3)]],
      email:     ['', [Validators.required, Validators.email]],
      phone:     ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      address:   ['', Validators.required],
      city:      ['', Validators.required],
      zip:       ['', [Validators.required, Validators.pattern(/^[0-9]{5,6}$/)]],
    });

    // Load dynamic form config
    this.http.get<FormField[]>('/assets/checkout-form.json').pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe((fields) => {
      this.formFields.set(fields);
      this.buildPaymentForm(fields);
    });
  }

  buildPaymentForm(fields: FormField[]): void {
    const group: Record<string, unknown> = {};
    fields.forEach((f) => {
      const validators = f.validators.map((v) => {
        if (v === 'required') return Validators.required;
        if (v === 'email') return Validators.email;
        if (v === 'luhn') return luhnValidator;
        if (v.startsWith('minlength:')) return Validators.minLength(+v.split(':')[1]);
        if (v.startsWith('pattern:')) return Validators.pattern(v.split(':').slice(1).join(':'));
        return Validators.nullValidator;
      });
      group[f.name] = [f.type === 'checkbox' ? false : '', validators];
    });
    this.paymentForm = this.fb.group(group);
  }

  isVisible(field: FormField): boolean {
    return isFieldVisible(field, this.paymentForm);
  }

  ctrl(form: FormGroup, name: string): AbstractControl {
    return form.get(name)!;
  }

  nextStep(): void {
    if (this.step() === 1) {
      this.shippingForm.markAllAsTouched();
      if (this.shippingForm.invalid) return;
    }
    if (this.step() === 2) {
      this.paymentForm.markAllAsTouched();
      if (this.paymentForm.invalid) return;
    }
    const next = this.step() + 1;
    sessionStorage.setItem('checkout_max_step', String(next));
    this.step.set(next);
  }

  prevStep(): void {
    this.step.update((s) => Math.max(1, s - 1));
  }

  placeOrder(): void {
    this.submitting.set(true);
    // POST to DummyJSON carts/add as order simulation
    const payload = {
      userId: 1,
      products: this.items().map((i) => ({ id: i.product.id, quantity: i.quantity })),
    };

    this.http.post<{ id: number }>('https://dummyjson.com/carts/add', payload).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (res) => {
        this.cartSvc.clear();
        this.router.navigate(['/shop/order-confirmation', res.id]);
      },
      error: () => {
        // Even on error, simulate success with random ID
        this.cartSvc.clear();
        this.router.navigate(['/shop/order-confirmation', Math.floor(Math.random() * 9000) + 1000]);
      },
    });
  }

  lastFour(cardNumber: string): string {
    return (cardNumber || '').replace(/\s/g, '').slice(-4);
  }
}
