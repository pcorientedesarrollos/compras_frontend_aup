/**
 * ============================================================================
 * 👤 USER MODEL - SISTEMA OAXACA MIEL
 * ============================================================================
 */

export type UserRole = 'ADMINISTRADOR' | 'ACOPIADOR' | 'APICULTOR' | 'MIELERA' | 'VERIFICADOR';

export interface User {
    id: string;  // CUID
    username: string;
    email: string | null;  // ✅ NUEVO: Email opcional
    nombre: string;
    role: UserRole;
    proveedorId?: number | null;
    apicultorId?: string | null;
    verificadorId?: string | null;
    activo: boolean;  // ✅ NUEVO: Estado activo/inactivo
    createdAt: string;  // ✅ NUEVO: Fecha de creación
    updatedAt: string;  // ✅ NUEVO: Fecha de actualización
}

export interface LoginRequest {
    username: string;
    password: string;
}

export interface ApiResponse<T> {
    success: boolean;
    data: T;
    message: string;
}

export interface LoginResponse {
    token: string;
    user: User;
}

export interface RegisterRequest {
    username: string;
    password: string;
    nombre: string;
    role: UserRole;
    proveedorId?: number;
    apicultorId?: string;
}

export interface UserProfile extends User {
    proveedor?: {
        id: number;
        nombre: string;
        tipoDeMiel: string;
    };
    apicultor?: {
        id: string;
        nombre: string;
        curp: string;
    };
}

/**
 * ============================================================================
 * ✅ NUEVOS MODELOS PARA GESTIÓN DE USUARIOS
 * ============================================================================
 */

/**
 * Request para crear un nuevo usuario (Admin)
 * POST /api/usuarios
 */
export interface CreateUserRequest {
    username: string;
    email?: string;
    password: string;
    nombre: string;
    role: UserRole;
    proveedorId?: number;
    apicultorId?: string;
    verificadorId?: string;
}

/**
 * Request para actualizar usuario (Admin)
 * PATCH /api/usuarios/:id
 */
export interface UpdateUserRequest {
    email?: string;
    nombre?: string;
    role?: UserRole;
    proveedorId?: number | null;
    apicultorId?: string | null;
    verificadorId?: string | null;
}

/**
 * Request para actualizar perfil propio
 * PATCH /api/auth/profile
 */
export interface UpdateProfileRequest {
    email?: string;
    nombre?: string;
}

/**
 * Request para cambiar contraseña
 * PATCH /api/auth/change-password
 */
export interface ChangePasswordRequest {
    oldPassword: string;
    newPassword: string;
}

/**
 * Request para restablecer contraseña (Admin)
 * PATCH /api/usuarios/:id/reset-password
 */
export interface AdminResetPasswordRequest {
    newPassword: string;
}

/**
 * Request para activar/desactivar usuario
 * PATCH /api/usuarios/:id/toggle-status
 */
export interface ToggleUserStatusRequest {
    activo: boolean;
}

/**
 * Parámetros de filtro para lista de usuarios
 * GET /api/usuarios
 */
export interface UserFilterParams {
    page?: number;
    limit?: number;
    role?: UserRole;
    activo?: boolean;
    search?: string;
    proveedorId?: number;
    sortBy?: 'username' | 'nombre' | 'createdAt' | 'role';
    sortOrder?: 'asc' | 'desc';
}

/**
 * Respuesta paginada de usuarios
 */
export interface UsersPaginatedResponse {
    success: boolean;
    data: User[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

/**
 * Opciones de roles para formularios
 */
export interface RoleOption {
    value: UserRole;
    label: string;
    description: string;
}

/**
 * Constantes y helpers
 */
export const ROLE_LABELS: Record<UserRole, string> = {
    'ADMINISTRADOR': 'Administrador',
    'ACOPIADOR': 'Acopiador',
    'APICULTOR': 'Apicultor',
    'MIELERA': 'Mielera',
    'VERIFICADOR': 'Verificador'
};

export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
    'ADMINISTRADOR': 'Control total del sistema',
    'ACOPIADOR': 'Gestiona apicultores vinculados',
    'APICULTOR': 'Gestiona sus propios apiarios',
    'MIELERA': 'Solo consulta información',
    'VERIFICADOR': 'Verifica calidad de miel'
};

export const ROLE_OPTIONS: RoleOption[] = [
    { value: 'ADMINISTRADOR', label: 'Administrador', description: 'Control total del sistema' },
    { value: 'ACOPIADOR', label: 'Acopiador', description: 'Gestiona apicultores vinculados' },
    { value: 'APICULTOR', label: 'Apicultor', description: 'Gestiona sus propios apiarios' },
    { value: 'MIELERA', label: 'Mielera', description: 'Solo consulta información' },
    { value: 'VERIFICADOR', label: 'Verificador', description: 'Verifica calidad de miel' }
];

/**
 * Requisitos de contraseña
 */
export const PASSWORD_REQUIREMENTS = {
    minLength: 8,
    maxLength: 100,
    requireUppercase: true,
    requireLowercase: true,
    requireNumber: true,
    requireSpecialChar: false
};

/**
 * Validar fortaleza de contraseña
 */
export function validatePasswordStrength(password: string): {
    valid: boolean;
    errors: string[];
} {
    const errors: string[] = [];

    if (password.length < PASSWORD_REQUIREMENTS.minLength) {
        errors.push(`Mínimo ${PASSWORD_REQUIREMENTS.minLength} caracteres`);
    }

    if (password.length > PASSWORD_REQUIREMENTS.maxLength) {
        errors.push(`Máximo ${PASSWORD_REQUIREMENTS.maxLength} caracteres`);
    }

    if (PASSWORD_REQUIREMENTS.requireUppercase && !/[A-Z]/.test(password)) {
        errors.push('Al menos 1 letra mayúscula');
    }

    if (PASSWORD_REQUIREMENTS.requireLowercase && !/[a-z]/.test(password)) {
        errors.push('Al menos 1 letra minúscula');
    }

    if (PASSWORD_REQUIREMENTS.requireNumber && !/[0-9]/.test(password)) {
        errors.push('Al menos 1 número');
    }

    return {
        valid: errors.length === 0,
        errors
    };
}