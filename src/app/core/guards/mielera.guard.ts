import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Guard para verificar que el usuario tenga rol MIELERA
 * Permite acceso a administradores y mieleras (solo consulta)
 */
export const mieleraGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    // Verificar autenticación primero
    if (!authService.isAuthenticated()) {
        router.navigate(['/auth/login'], {
            queryParams: { returnUrl: state.url }
        });
        return false;
    }

    // Permitir acceso a admin y mielera
    if (authService.isAdmin() || authService.isMielera()) {
        return true;
    }

    // No tiene permisos, redirigir a su dashboard
    const user = authService.getCurrentUser();

    switch (user?.role) {
        case 'ACOPIADOR':
            router.navigate(['/dashboard/acopiador']);
            break;
        case 'APICULTOR':
            router.navigate(['/dashboard/apicultor']);
            break;
        default:
            router.navigate(['/']);
    }

    return false;
};