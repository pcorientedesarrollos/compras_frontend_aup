import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Guard para verificar que el usuario tenga rol ADMINISTRADOR
 * Si no es admin, redirige al dashboard correspondiente según su rol
 */
export const adminGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    // Verificar autenticación primero
    if (!authService.isAuthenticated()) {
        router.navigate(['/auth/login'], {
            queryParams: { returnUrl: state.url }
        });
        return false;
    }

    // Verificar si es administrador
    if (authService.isAdmin()) {
        return true;
    }

    // No es admin, redirigir a su dashboard correspondiente
    const user = authService.getCurrentUser();

    switch (user?.role) {
        case 'ACOPIADOR':
            router.navigate(['/dashboard/acopiador']);
            break;
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