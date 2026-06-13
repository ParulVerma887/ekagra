import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { delay, switchMap, tap } from 'rxjs/operators';
import { Observable, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User, Role } from '../models/user.model';

interface LoginResponse {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  token: string;
}

interface MockUser {
  username: string;
  password: string;
  role: Role;
}

const SESSION_KEY = 'pc_session';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private _currentUser = signal<User | null>(this.loadFromSession());

  readonly currentUser = this._currentUser.asReadonly();
  readonly isAuthenticated = computed(() => this._currentUser() !== null);
  readonly role = computed<Role | null>(() => this._currentUser()?.role ?? null);

  login(username: string, password: string): Observable<LoginResponse> {
    // Load mock user list to resolve role, then hit DummyJSON for a real token
    return this.http.get<MockUser[]>('/assets/users.json').pipe(
      switchMap((users) => {
        const match = users.find(
          (u) => u.username === username && u.password === password
        );
        if (!match) {
          // Let DummyJSON return a 400 by sending wrong creds — we surface it as error
          return this.http.post<LoginResponse>(`${environment.apiUrl}/auth/login`, {
            username: '__invalid__',
            password: '__invalid__',
            expiresInMins: 60,
          });
        }
        return this.http
          .post<LoginResponse>(`${environment.apiUrl}/auth/login`, {
            username,
            password,
            expiresInMins: 60,
          })
          .pipe(
            delay(600),
            tap((res) => {
              const user: User = {
                id: res.id,
                username: res.username,
                email: res.email,
                firstName: res.firstName,
                lastName: res.lastName,
                role: match.role,
                token: res.token,
              };
              this._currentUser.set(user);
              sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
            })
          );
      })
    );
  }

  logout(): void {
    this._currentUser.set(null);
    sessionStorage.removeItem(SESSION_KEY);
    this.router.navigate(['/login']);
  }

  private loadFromSession(): User | null {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      return raw ? (JSON.parse(raw) as User) : null;
    } catch {
      return null;
    }
  }
}
