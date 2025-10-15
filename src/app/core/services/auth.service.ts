import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, BehaviorSubject, tap, map } from 'rxjs';
import { HttpService } from './http.service';
import { StorageService } from './storage.service';
import { User, LoginRequest, LoginResponse, RegisterRequest, ApiResponse, UserProfile } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private httpService = inject(HttpService);
  private storageService = inject(StorageService);
  private router = inject(Router);

  // Constantes para localStorage
  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_KEY = 'current_user';

  // Estado de autenticación con signals (Angular 19)
  private currentUserSubject = new BehaviorSubject<User | null>(this.getUserFromStorage());
  public currentUser$ = this.currentUserSubject.asObservable();

  // Signal para estado de carga
  public isLoading = signal(false);

  constructor() {
    // Verificar token al inicializar
    this.checkTokenValidity();
  }

  /**
   * Login del usuario
   */
  login(credentials: LoginRequest): Observable<LoginResponse> {
    this.isLoading.set(true);

    return this.httpService.post<ApiResponse<LoginResponse>>('auth/login', credentials)
      .pipe(
        map(response => response.data),
        tap(data => {
          this.setSession(data);
          this.isLoading.set(false);
        })
      );
  }

  /**
   * Registro de nuevo usuario (solo ADMINISTRADOR)
   */
  register(data: RegisterRequest): Observable<User> {
    this.isLoading.set(true);

    return this.httpService.post<ApiResponse<User>>('auth/register', data)
      .pipe(
        map(response => response.data),
        tap(() => this.isLoading.set(false))
      );
  }

  /**
   * Obtener perfil del usuario autenticado
   */
  getProfile(): Observable<UserProfile> {
    return this.httpService.get<ApiResponse<UserProfile>>('auth/profile')
      .pipe(
        map(response => response.data),
        tap(user => {
          // Actualizar usuario en storage con info completa
          this.storageService.setItem(this.USER_KEY, user);
          this.currentUserSubject.next(user);
        })
      );
  }

  /**
   * Actualizar perfil propio
   */
  updateProfile(data: { nombre: string }): Observable<User> {
    return this.httpService.patch<ApiResponse<User>>('auth/profile', data)
      .pipe(
        map(response => response.data),
        tap(user => {
          this.storageService.setItem(this.USER_KEY, user);
          this.currentUserSubject.next(user);
        })
      );
  }

  /**
   * Cambiar contraseña
   */
  changePassword(currentPassword: string, newPassword: string): Observable<void> {
    return this.httpService.patch<ApiResponse<void>>('auth/change-password', {
      currentPassword,
      newPassword
    }).pipe(map(response => response.data));
  }

  /**
   * Logout del usuario
   */
  logout(): void {
    this.clearSession();
    this.router.navigate(['/auth/login']);
  }

  /**
   * Verificar si el usuario está autenticado
   */
  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;

    return !this.isTokenExpired(token);
  }

  /**
   * Obtener el token actual
   */
  getToken(): string | null {
    return this.storageService.getItem<string>(this.TOKEN_KEY);
  }

  /**
   * Obtener el usuario actual
   */
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  /**
   * Verificar si el usuario tiene un rol específico
   */
  hasRole(role: string): boolean {
    const user = this.getCurrentUser();
    return user?.role === role;
  }

  /**
   * Verificar si el usuario es administrador
   */
  isAdmin(): boolean {
    return this.hasRole('ADMINISTRADOR');
  }

  /**
   * Verificar si el usuario es acopiador
   */
  isAcopiador(): boolean {
    return this.hasRole('ACOPIADOR');
  }

  /**
   * Verificar si el usuario es apicultor
   */
  isApicultor(): boolean {
    return this.hasRole('APICULTOR');
  }

  /**
   * Verificar si el usuario es mielera
   */
  isMielera(): boolean {
    return this.hasRole('MIELERA');
  }

  /**
   * Establecer sesión después del login
   */
  private setSession(authResult: LoginResponse): void {
    this.storageService.setItem(this.TOKEN_KEY, authResult.token);
    this.storageService.setItem(this.USER_KEY, authResult.user);
    this.currentUserSubject.next(authResult.user);
  }

  /**
   * Limpiar sesión
   */
  private clearSession(): void {
    this.storageService.removeItem(this.TOKEN_KEY);
    this.storageService.removeItem(this.USER_KEY);
    this.currentUserSubject.next(null);
  }

  /**
   * Obtener usuario del storage
   */
  private getUserFromStorage(): User | null {
    return this.storageService.getItem<User>(this.USER_KEY);
  }

  /**
   * Verificar si el token ha expirado
   */
  private isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expirationDate = new Date(payload.exp * 1000);
      return expirationDate < new Date();
    } catch (error) {
      return true;
    }
  }

  /**
   * Verificar validez del token al iniciar
   */
  private checkTokenValidity(): void {
    if (!this.isAuthenticated()) {
      this.clearSession();
    }
  }
}