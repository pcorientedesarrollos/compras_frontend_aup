import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Guard para verificar que el usuario tenga rol ACOPIADOR
 * Permite acceso a administradores y acopiadores
 */
export const acopiadorGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    // Verificar autenticación primero
    if (!authService.isAuthenticated()) {
        router.navigate(['/auth/login'], {
            queryParams: { returnUrl: state.url }
        });
        return false;
    }

    // Permitir acceso a admin y acopiador
    if (authService.isAdmin() || authService.isAcopiador()) {
        return true;
    }

    // No tiene permisos, redirigir a su dashboard
    const user = authService.getCurrentUser();

    switch (user?.role) {
        case 'APICULTOR':
            router.navigate(['/dashboard/apicultor']);
            break;
        case 'MIELERA':
            router.navigate(['/dashboard/mielera']);
            break;
        default:
            router.navigate(['/']);
    }

    return false;
};