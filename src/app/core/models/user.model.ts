export type UserRole = 'ADMINISTRADOR' | 'ACOPIADOR' | 'APICULTOR' | 'MIELERA' | 'VERIFICADOR';

export interface User {
    id: string;  // UUID
    username: string;
    nombre: string;
    role: UserRole;
    proveedorId?: number | null;
    apicultorId?: string | null;  // UUID
    verificadorId?: string | null;  // UUID para verificadores
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
    activo: boolean;
    createdAt: string;
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