/**
 * ============================================================================
 * 🔒 VERIFICADOR GUARD - SISTEMA OAXACA MIEL
 * ============================================================================
 *
 * Guard para proteger rutas del módulo de Verificación
 *
 * Roles permitidos: VERIFICADOR y ADMINISTRADOR
 *
 * ============================================================================
 */

import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const verificadorGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Verificar autenticación
  if (!authService.isAuthenticated()) {
    router.navigate(['/auth/login']);
    return false;
  }

  const user = authService.getCurrentUser();

  // Verificar rol: VERIFICADOR o ADMINISTRADOR
  if (user?.role === 'VERIFICADOR' || user?.role === 'ADMINISTRADOR') {
    return true;
  }

  // Si no tiene permiso, redirigir al dashboard correspondiente
  console.warn('Acceso denegado: Se requiere rol VERIFICADOR o ADMINISTRADOR');
  router.navigate(['/dashboard']);
  return false;
};
