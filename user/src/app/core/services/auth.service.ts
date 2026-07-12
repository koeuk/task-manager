import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { User, LoginCredentials, RegisterCredentials, AuthResponse } from '../models/user.model';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:8000/api/auth';
  private userKey = 'auth_user';
  private currentUserSubject = new BehaviorSubject<User | null>(this.readStoredUser());
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    // Revalidate the persisted session in the background on app start
    this.loadCurrentUser();
  }

  private loadCurrentUser(): void {
    const token = this.getToken();
    if (token) {
      this.getCurrentUser().subscribe({
        next: (user) => this.setUser(user),
        error: () => this.logout()
      });
    }
  }

  register(credentials: RegisterCredentials): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, credentials)
      .pipe(
        tap(response => {
          if (response.user.role === 'admin') {
            throw new Error('Admin users cannot register through this portal');
          }
          this.setToken(response.token);
          this.setUser(response.user);
        }),
        catchError(error => {
          console.error('Registration error:', error);
          return throwError(() => error);
        })
      );
  }

  login(credentials: LoginCredentials): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials)
      .pipe(
        tap(response => {
          if (response.user.role === 'admin') {
            throw new Error('Admin users must use the admin portal');
          }
          this.setToken(response.token);
          this.setUser(response.user);
        }),
        catchError(error => {
          console.error('Login error:', error);
          return throwError(() => error);
        })
      );
  }

  logout(): void {
    const token = this.getToken();
    if (token) {
      this.http.post(`${this.apiUrl}/logout`, {}).subscribe({
        complete: () => {
          this.clearToken();
          this.currentUserSubject.next(null);
          this.router.navigate(['/login']);
        },
        error: () => {
          this.clearToken();
          this.currentUserSubject.next(null);
          this.router.navigate(['/login']);
        }
      });
    } else {
      this.clearToken();
      this.currentUserSubject.next(null);
      this.router.navigate(['/login']);
    }
  }

  getCurrentUser(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/me`);
  }

  updateProfile(data: { name?: string; email?: string; phone?: string | null }): Observable<User> {
    return this.http.put<{ message: string; user: User }>(`${this.apiUrl}/profile`, data)
      .pipe(
        map(response => response.user),
        tap(user => this.setUser(user))
      );
  }

  changePassword(data: { current_password: string; password: string; password_confirmation: string }): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/change-password`, data);
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  private setToken(token: string): void {
    localStorage.setItem('auth_token', token);
  }

  private clearToken(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem(this.userKey);
  }

  private setUser(user: User): void {
    localStorage.setItem(this.userKey, JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  private readStoredUser(): User | null {
    const raw = localStorage.getItem(this.userKey);
    try {
      return raw ? (JSON.parse(raw) as User) : null;
    } catch {
      return null;
    }
  }

  get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }
}