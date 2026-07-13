import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, tap } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { AuthResponse, LoginCredentials, User } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl;
  private currentUserSubject = new BehaviorSubject<User | null>(this.readStoredUser());
  public currentUser$ = this.currentUserSubject.asObservable();
  private tokenKey = 'auth_token';
  private userKey = 'auth_user';

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    // Revalidate the token/profile in the background on app start
    this.loadUserFromToken();
  }

  login(credentials: LoginCredentials): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/login`, credentials)
      .pipe(
        tap(response => {
          if (response.user.role !== 'admin') {
            throw new Error('Access denied. Admin role required.');
          }
          localStorage.setItem(this.tokenKey, response.token);
          this.setUser(response.user);
        })
      );
  }

  logout(): void {
    const token = this.getToken();
    if (token) {
      this.http.post(`${this.apiUrl}/auth/logout`, {}).subscribe();
    }
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  getCurrentUser(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/auth/me`).pipe(
      tap(user => {
        if (user.role !== 'admin') {
          throw new Error('Access denied. Admin role required.');
        }
        this.setUser(user);
      })
    );
  }

  /**
   * Resolves whether the current session is a valid admin.
   * Used by the route guard so navigation waits for the profile
   * to load instead of failing while it is still in flight.
   */
  ensureAdmin(): Observable<boolean> {
    if (!this.isAuthenticated()) {
      return of(false);
    }
    // Already have an admin user hydrated from storage
    if (this.isAdmin()) {
      return of(true);
    }
    // Token present but no user yet — fetch the profile before deciding
    return this.getCurrentUser().pipe(
      map(user => user.role === 'admin'),
      catchError(() => of(false))
    );
  }

  updateProfile(data: { name?: string; email?: string; phone?: string; avatar?: string }): Observable<{ message: string; user: User }> {
    return this.http.put<{ message: string; user: User }>(`${this.apiUrl}/auth/profile`, data).pipe(
      tap(res => this.setUser(res.user))
    );
  }

  changePassword(data: { current_password?: string; password: string; password_confirmation: string }): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/auth/change-password`, data);
  }

  uploadAvatar(file: File): Observable<{ message: string; user: User; avatar: string }> {
    const form = new FormData();
    form.append('avatar', file);
    return this.http.post<{ message: string; user: User; avatar: string }>(`${this.apiUrl}/auth/avatar`, form).pipe(
      tap(res => this.setUser(res.user))
    );
  }

  forgotPassword(email: string): Observable<{ message: string; email?: string; token?: string }> {
    return this.http.post<{ message: string; email?: string; token?: string }>(`${this.apiUrl}/auth/forgot-password`, { email });
  }

  resetPassword(data: { email: string; token: string; password: string; password_confirmation: string }): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/auth/reset-password`, data);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  isAdmin(): boolean {
    const user = this.currentUserSubject.value;
    return user?.role === 'admin';
  }

  get currentUserValue(): User | null {
    return this.currentUserSubject.value;
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

  private loadUserFromToken(): void {
    if (this.isAuthenticated()) {
      this.getCurrentUser().subscribe({
        error: () => this.logout()
      });
    }
  }
}