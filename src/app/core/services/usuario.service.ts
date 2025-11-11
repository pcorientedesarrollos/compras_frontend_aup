/**
 * ============================================================================
 * =e USUARIO SERVICE - SISTEMA OAXACA MIEL
 * ============================================================================
 * Servicio para gestión de usuarios (Solo ADMINISTRADOR)
 * ============================================================================
 */

import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { HttpService } from './http.service';
import {
    User,
    UserFilterParams,
    CreateUserRequest,
    UpdateUserRequest,
    AdminResetPasswordRequest,
    ToggleUserStatusRequest,
    UsersPaginatedResponse,
    ApiResponse
} from '../models/user.model';

@Injectable({
    providedIn: 'root'
})
export class UsuarioService {
    private httpService = inject(HttpService);
    private readonly BASE_PATH = 'usuarios';

    // ============================================================================
    // CRUD OPERATIONS
    // ============================================================================

    /**
     * Listar usuarios con filtros y paginación (Solo Admin)
     * GET /api/usuarios
     */
    getUsuarios(params: UserFilterParams = {}): Observable<UsersPaginatedResponse> {
        const queryParams: Record<string, string> = {};

        if (params.page) queryParams['page'] = params.page.toString();
        if (params.limit) queryParams['limit'] = params.limit.toString();
        if (params.role) queryParams['role'] = params.role;
        if (params.activo !== undefined) queryParams['activo'] = params.activo.toString();
        if (params.search) queryParams['search'] = params.search;
        if (params.proveedorId) queryParams['proveedorId'] = params.proveedorId.toString();
        if (params.sortBy) queryParams['sortBy'] = params.sortBy;
        if (params.sortOrder) queryParams['sortOrder'] = params.sortOrder;

        const queryString = new URLSearchParams(queryParams).toString();
        const url = queryString ? `${this.BASE_PATH}?${queryString}` : this.BASE_PATH;

        return this.httpService.get<UsersPaginatedResponse>(url);
    }

    /**
     * Obtener todos los usuarios sin paginación
     */
    getAllUsuarios(): Observable<User[]> {
        return this.getUsuarios({ page: 1, limit: 9999 }).pipe(
            map(response => response.data)
        );
    }

    /**
     * Obtener usuario por ID (Solo Admin)
     * GET /api/usuarios/:id
     */
    getUsuarioById(id: string): Observable<User> {
        return this.httpService
            .get<ApiResponse<User>>(`${this.BASE_PATH}/${id}`)
            .pipe(map(response => response.data));
    }

    /**
     * Crear nuevo usuario (Solo Admin)
     * POST /api/usuarios
     */
    createUsuario(data: CreateUserRequest): Observable<User> {
        return this.httpService
            .post<ApiResponse<User>>(this.BASE_PATH, data)
            .pipe(map(response => response.data));
    }

    /**
     * Actualizar usuario (Solo Admin)
     * PATCH /api/usuarios/:id
     */
    updateUsuario(id: string, data: UpdateUserRequest): Observable<User> {
        return this.httpService
            .patch<ApiResponse<User>>(`${this.BASE_PATH}/${id}`, data)
            .pipe(map(response => response.data));
    }

    /**
     * Activar/Desactivar usuario (Solo Admin)
     * PATCH /api/usuarios/:id/toggle-status
     */
    toggleUserStatus(id: string, activo: boolean): Observable<User> {
        const data: ToggleUserStatusRequest = { activo };
        return this.httpService
            .patch<ApiResponse<User>>(`${this.BASE_PATH}/${id}/toggle-status`, data)
            .pipe(map(response => response.data));
    }

    /**
     * Restablecer contraseña de usuario (Solo Admin)
     * PATCH /api/usuarios/:id/reset-password
     */
    resetPassword(id: string, newPassword: string): Observable<{ message: string }> {
        const data: AdminResetPasswordRequest = { newPassword };
        return this.httpService
            .patch<ApiResponse<{ message: string }>>(`${this.BASE_PATH}/${id}/reset-password`, data)
            .pipe(map(response => response.data));
    }

    // ============================================================================
    // HELPER METHODS
    // ============================================================================

    /**
     * Validar si un username está disponible
     */
    isUsernameAvailable(username: string, excludeUserId?: string): Observable<boolean> {
        // Este endpoint debe existir en el backend para validación
        // return this.httpService.get<boolean>(`${this.BASE_PATH}/check-username/${username}`);

        // Mientras tanto, simular con búsqueda
        return this.getAllUsuarios().pipe(
            map(users => {
                const exists = users.some(u =>
                    u.username.toLowerCase() === username.toLowerCase() &&
                    u.id !== excludeUserId
                );
                return !exists;
            })
        );
    }

    /**
     * Validar si un email está disponible
     */
    isEmailAvailable(email: string, excludeUserId?: string): Observable<boolean> {
        return this.getAllUsuarios().pipe(
            map(users => {
                const exists = users.some(u =>
                    u.email?.toLowerCase() === email.toLowerCase() &&
                    u.id !== excludeUserId
                );
                return !exists;
            })
        );
    }
}
