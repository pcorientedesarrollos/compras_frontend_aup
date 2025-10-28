/**
 * ============================================================================
 * VERIFICADOR ROUTES - SISTEMA OAXACA MIEL
 * ============================================================================
 *
 * Rutas del módulo de Verificación (Llegadas de Chofer)
 * Protegidas con verificadorGuard (VERIFICADOR + ADMIN)
 * Ahora usa el DashboardLayoutComponent compartido con navbar y sidebar
 *
 * ============================================================================
 */

import { Routes } from '@angular/router';
import { verificadorGuard } from '../../core/guards/verificador.guard';

export const VERIFICADOR_ROUTES: Routes = [
  {
    path: '',
    canActivate: [verificadorGuard],
    loadComponent: () =>
      import('../../shared/components/dashboard-layout/dashboard-layout.component').then(
        (m) => m.DashboardLayoutComponent
      ),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/verificador-home.component').then(
            (m) => m.VerificadorHomeComponent
          )
      },
      {
        path: 'en-transito',
        loadComponent: () =>
          import('./pages/salidas-en-transito.component').then(
            (m) => m.SalidasEnTransitoComponent
          )
      },
      {
        path: 'verificadas',
        loadComponent: () =>
          import('./pages/verificaciones-completadas.component').then(
            (m) => m.VerificacionesCompletadasComponent
          )
      },
      {
        path: 'llegada/:choferId',
        loadComponent: () =>
          import('./pages/detalle-llegada.component').then(
            (m) => m.DetalleLlegadaComponent
          )
      },
      {
        path: 'detalle/:id',
        loadComponent: () =>
          import('./pages/detalle-verificacion.component').then(
            (m) => m.DetalleVerificacionComponent
          )
      },
      {
        path: 'migracion-aup',
        loadComponent: () =>
          import('../migracion/pages/migracion-aup.component').then(
            (m) => m.MigracionAupComponent
          )
      }
    ]
  }
];
