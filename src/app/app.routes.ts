import { Routes } from '@angular/router';
import { authGuard, adminGuard, acopiadorGuard, apicultorGuard } from './core/guards';

export const routes: Routes = [
    // Ruta por defecto
    {
        path: '',
        redirectTo: '/auth/login',
        pathMatch: 'full'
    },

    // Rutas de autenticación (públicas)
    {
        path: 'auth/login',
        loadComponent: () => import('./features/auth/login/login.component')
            .then(m => m.LoginComponent)
    },

    // Dashboards con layout y guards
    {
        path: 'dashboard',
        loadComponent: () => import('./shared/components/dashboard-layout/dashboard-layout.component')
            .then(m => m.DashboardLayoutComponent),
        canActivate: [authGuard],
        children: [
            // Dashboard Admin
            {
                path: 'admin',
                loadComponent: () => import('./features/dashboard/admin/admin-dashboard.component')
                    .then(m => m.AdminDashboardComponent),
                canActivate: [adminGuard]
            },

            // Dashboard Acopiador
            {
                path: 'acopiador',
                loadComponent: () => import('./features/dashboard/acopiador/acopiador-dashboard.component')
                    .then(m => m.AcopiadorDashboardComponent),
                canActivate: [acopiadorGuard]
            },

            // Dashboard Apicultor
            {
                path: 'apicultor',
                loadComponent: () => import('./features/dashboard/apicultor/apicultor-dashboard.component')
                    .then(m => m.ApicultorDashboardComponent),
                canActivate: [apicultorGuard]
            },

            // Redirección por defecto a login si no hay sub-ruta
            {
                path: '',
                redirectTo: '/auth/login',
                pathMatch: 'full'
            }
        ]
    },

    // 404 - Ruta no encontrada
    {
        path: '**',
        redirectTo: '/auth/login'
    }
];