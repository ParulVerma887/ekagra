import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './analytics.component.html',
  styleUrl: './analytics.component.scss',
})
export class AnalyticsComponent implements OnInit {
  private http = inject(HttpClient);
  private cdr  = inject(ChangeDetectorRef);

  stats = { totalOrders: 0, totalRevenue: 0, totalProducts: 0, totalUsers: 0 };
  topProducts: any[] = [];
  loading = true;

  ngOnInit() {
    this.http.get<any>('https://dummyjson.com/carts?limit=100').subscribe({
      next: (res) => {
        this.stats.totalOrders  = res.total;
        this.stats.totalRevenue = res.carts.reduce((sum: number, c: any) => sum + c.discountedTotal, 0);

        const productMap: Record<number, any> = {};
        res.carts.forEach((c: any) => {
          c.products.forEach((p: any) => {
            if (!productMap[p.id]) productMap[p.id] = { ...p, soldQty: 0 };
            productMap[p.id].soldQty += p.quantity;
          });
        });
        this.topProducts = Object.values(productMap)
          .sort((a, b) => b.soldQty - a.soldQty)
          .slice(0, 5);

        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.loading = false; this.cdr.detectChanges(); }
    });

    this.http.get<any>('https://dummyjson.com/products?limit=0').subscribe(r => {
      this.stats.totalProducts = r.total;
      this.cdr.detectChanges();
    });

    this.http.get<any>('https://dummyjson.com/users?limit=0').subscribe(r => {
      this.stats.totalUsers = r.total;
      this.cdr.detectChanges();
    });
  }
}
