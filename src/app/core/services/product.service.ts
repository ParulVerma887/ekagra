import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Product, ProductsResponse } from '../models/product.model';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/products`;

  getAll(limit: number, skip: number, search?: string, category?: string): Observable<ProductsResponse> {
    if (category && category !== 'all') {
      let params = new HttpParams().set('limit', limit).set('skip', skip);
      if (search) params = params.set('q', search);
      return this.http.get<ProductsResponse>(`${this.base}/category/${category}`, { params });
    }
    let params = new HttpParams().set('limit', limit).set('skip', skip);
    if (search) {
      return this.http.get<ProductsResponse>(`${this.base}/search`, {
        params: params.set('q', search),
      });
    }
    return this.http.get<ProductsResponse>(this.base, { params });
  }

  getById(id: number): Observable<Product> {
    return this.http.get<Product>(`${this.base}/${id}`);
  }

  getCategories(): Observable<{ slug: string; name: string; url: string }[]> {
    return this.http.get<{ slug: string; name: string; url: string }[]>(`${this.base}/categories`);
  }

  create(product: Partial<Product>): Observable<Product> {
    return this.http.post<Product>(`${this.base}/add`, product);
  }

  update(id: number, product: Partial<Product>): Observable<Product> {
    return this.http.put<Product>(`${this.base}/${id}`, product);
  }

  delete(id: number): Observable<Product> {
    return this.http.delete<Product>(`${this.base}/${id}`);
  }
}
