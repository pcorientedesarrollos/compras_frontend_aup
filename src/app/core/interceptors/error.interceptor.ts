import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { StorageService } from '../services/storage.service';

/**
 * Interceptor HTTP para manejar errores globalmente
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
    const router = inject(Router);
    const storageService = inject(StorageService);

    return next(req).pipe(
        catchError((error: HttpErrorResponse) => {
            let errorMessage = 'Ha ocurrido un error inesperado';

            if (error.error instanceof ErrorEvent) {
                // Error del lado del cliente
                errorMessage = `Error: ${error.error.message}`;
                console.error('Error del cliente:', error.error.message);
            } else {
                // Error del lado del servidor
                console.error(
                    `Código de error ${error.status}, ` +
                    `mensaje: ${error.message}`
                );

                // Manejar diferentes códigos de error
                switch (error.status) {
                    case 400:
                        // Validación fallida
                        if (error.error?.message) {
                            errorMessage = error.error.message;
                        } else if (error.error?.error?.details) {
                            errorMessage = error.error.error.details;
                        } else {
                            errorMessage = 'Datos inválidos. Verifica la información enviada.';
                        }
                        break;

                    case 401:
                        // No autenticado - Token inválido o expirado
                        errorMessage = 'Sesión expirada. Por favor, inicia sesión nuevamente.';
                        // Limpiar sesión y redirigir al login
                        storageService.removeItem('auth_token');
                        storageService.removeItem('current_user');
                        router.navigate(['/auth/login']);
                        break;

                    case 403:
                        // Sin permisos
                        errorMessage = 'No tienes permisos para realizar esta acción.';
                        break;

                    case 404:
                        // Recurso no encontrado
                        // 🎯 Para ciertos endpoints, el 404 es esperado (ej: no hay llegadas en tránsito)
                        // No mostramos mensaje genérico para estos casos
                        if (req.url.includes('/verificador/llegadas')) {
                            // Dejar que el componente maneje el 404 sin mensaje genérico
                            errorMessage = '';
                        } else if (error.error?.error?.details) {
                            errorMessage = error.error.error.details;
                        } else {
                            errorMessage = 'Recurso no encontrado.';
                        }
                        break;

                    case 409:
                        // Conflicto (ej: CURP duplicado)
                        if (error.error?.error?.details) {
                            errorMessage = error.error.error.details;
                        } else {
                            errorMessage = 'Ya existe un registro con estos datos.';
                        }
                        break;

                    case 500:
                        // Error interno del servidor
                        errorMessage = 'Error del servidor. Intenta nuevamente más tarde.';
                        break;

                    case 0:
                        // Sin conexión
                        errorMessage = 'No se pudo conectar con el servidor. Verifica tu conexión a internet.';
                        break;

                    default:
                        if (error.error?.error?.details) {
                            errorMessage = error.error.error.details;
                        } else if (error.error?.message) {
                            errorMessage = error.error.message;
                        }
                }
            }

            // Mostrar mensaje de error en consola
            console.error('Error HTTP:', {
                status: error.status,
                message: errorMessage,
                url: req.url,
                error: error.error
            });

            // Retornar el error con el mensaje procesado
            return throwError(() => ({
                status: error.status,
                message: errorMessage,
                originalError: error
            }));
        })
    );
};