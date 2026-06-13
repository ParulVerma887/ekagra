import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, FormsModule, TableModule, TagModule, ButtonModule, DropdownModule, ToastModule],
  providers: [MessageService],
  templateUrl: './orders.component.html',
  styleUrl: './orders.component.scss',
})
export class OrdersComponent implements OnInit {
  private http  = inject(HttpClient);
  private msg   = inject(MessageService);
  private cdr   = inject(ChangeDetectorRef);

  loading = true;
  orders: any[] = [];
  filtered: any[] = [];
  search = '';
  statusFilter = 'all';
  selected: any = null;

  statusOptions = [
    { label: 'All', value: 'all' },
    { label: 'Pending', value: 'pending' },
    { label: 'Processing', value: 'processing' },
    { label: 'Shipped', value: 'shipped' },
    { label: 'Delivered', value: 'delivered' },
    { label: 'Cancelled', value: 'cancelled' },
  ];

  statusUpdateOptions = [
    { label: 'Pending', value: 'pending' },
    { label: 'Processing', value: 'processing' },
    { label: 'Shipped', value: 'shipped' },
    { label: 'Delivered', value: 'delivered' },
    { label: 'Cancelled', value: 'cancelled' },
  ];

  private mockNames = [
    'Emily Johnson', 'Michael Williams', 'Sophia Brown', 'Alexander Jones',
    'Olivia Davis', 'James Miller', 'Ava Wilson', 'William Moore',
  ];

  private mockStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

  ngOnInit() {
    this.http.get<any>('https://dummyjson.com/carts?limit=20').subscribe({
      next: (res) => {
        this.orders = res.carts.map((c: any) => ({
          id: c.id,
          name: this.mockNames[(c.userId - 1) % this.mockNames.length],
          email: `user${c.userId}@example.com`,
          total: c.discountedTotal,
          items: c.totalQuantity,
          products: c.products,
          status: this.mockStatuses[c.id % this.mockStatuses.length],
          date: this.getDate(c.id),
        }));
        this.filtered = [...this.orders];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  private getDate(id: number): string {
    const d = new Date();
    d.setDate(d.getDate() - (id % 30));
    return d.toLocaleDateString('en-IN');
  }

  filter() {
    const q = this.search.toLowerCase();
    this.filtered = this.orders.filter(o => {
      const matchStatus = this.statusFilter === 'all' || o.status === this.statusFilter;
      const matchSearch = !q || o.name.toLowerCase().includes(q) || String(o.id).includes(q);
      return matchStatus && matchSearch;
    });
  }

  changeStatus(order: any, status: string) {
    order.status = status;
    this.filter();
    this.msg.add({ severity: 'success', summary: 'Status updated', detail: `Order #${order.id} marked as ${status}`, life: 2000 });
  }

  badgeType(status: string): any {
    const map: any = { pending: 'warning', processing: 'info', shipped: 'secondary', delivered: 'success', cancelled: 'danger' };
    return map[status] ?? 'info';
  }
}
