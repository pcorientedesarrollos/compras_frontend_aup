import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { StorageService } from '../services/storage.service';

/**
 * Interceptor HTTP para añadir automáticamente el token JWT a las peticiones
 */
export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
    const storageService = inject(StorageService);
    const token = storageService.getItem<string>('auth_token');

    // Lista de endpoints que NO requieren autenticación
    const publicEndpoints = [
        '/auth/login',
        '/auth/register',
        '/auth/forgot-password',
        '/auth/reset-password'
    ];

    // Verificar si la petición es a un endpoint público
    const isPublicEndpoint = publicEndpoints.some(endpoint =>
        req.url.includes(endpoint)
    );

    // Si hay token y no es un endpoint público, añadirlo
    if (token && !isPublicEndpoint) {
        req = req.clone({
            setHeaders: {
                Authorization: `Bearer ${token}`
            }
        });
    }

    return next(req);
};