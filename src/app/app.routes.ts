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

    // ============================================================================
    // RUTAS DE ADMINISTRADOR
    // ============================================================================
    {
        path: 'admin',
        loadComponent: () => import('./shared/components/dashboard-layout/dashboard-layout.component')
            .then(m => m.DashboardLayoutComponent),
        canActivate: [authGuard, adminGuard],
        children: [
            // Proveedores (Acopiadores/Mieleras)
            {
                path: 'proveedores',
                loadComponent: () => import('./features/admin/proveedores/proveedores-list.component')
                    .then(m => m.ProveedoresListComponent)
            },

            // Apicultores - Lista
            {
                path: 'apicultores',
                loadComponent: () => import('./features/admin/apicultores/apicultores-list/apicultores-list.component')
                    .then(m => m.ApicultoresListComponent)
            },

            // Apicultores - Crear
            {
                path: 'apicultores/nuevo',
                loadComponent: () => import('./features/admin/apicultores/apicultor-detail/apicultor-detail.component')
                    .then(m => m.ApicultorDetailComponent)
            },

            // Apicultores - Editar
            {
                path: 'apicultores/:id/edit',
                loadComponent: () => import('./features/admin/apicultores/apicultor-detail/apicultor-detail.component')
                    .then(m => m.ApicultorDetailComponent)
            }

            // TODO: Agregar más rutas de admin aquí
            // { path: 'usuarios', loadComponent: ... },
            // { path: 'apiarios', loadComponent: ... },
            // { path: 'reportes', loadComponent: ... },
        ]
    },

    // 404 - Ruta no encontrada
    {
        path: '**',
        redirectTo: '/auth/login'
    }
];