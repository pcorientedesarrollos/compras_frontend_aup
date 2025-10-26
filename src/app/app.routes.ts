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
            },
            {
                path: 'apiarios',
                loadComponent: () => import('./features/admin/apiarios/apiarios-list/apiarios-list.component')
                    .then(m => m.ApiariosListComponent)
            },

            // Apiarios - Crear
            {
                path: 'apiarios/nuevo',
                loadComponent: () => import('./features/admin/apiarios/apiario-detail/apiario-detail.component')
                    .then(m => m.ApiarioDetailComponent)
            },

            // Apiarios - Editar
            {
                path: 'apiarios/:id/edit',
                loadComponent: () => import('./features/admin/apiarios/apiario-detail/apiario-detail.component')
                    .then(m => m.ApiarioDetailComponent)
            }

            // TODO: Agregar más rutas de admin aquí
            // { path: 'usuarios', loadComponent: ... },
            // { path: 'reportes', loadComponent: ... },
        ]
    },
    // ============================================================================
    // RUTAS DE ACOPIADOR
    // ============================================================================
    {
        path: 'acopiador',
        loadComponent: () => import('./shared/components/dashboard-layout/dashboard-layout.component')
            .then(m => m.DashboardLayoutComponent),
        canActivate: [authGuard, acopiadorGuard],
        children: [
            // Mis Apicultores
            {
                path: 'mis-apicultores',
                loadComponent: () => import('./features/acopiador/mis-apicultores/mis-apicultores.component')
                    .then(m => m.MisApicultoresComponent)
            },
            {
                path: 'apiarios',
                loadComponent: () => import('./features/admin/apiarios/apiarios-list/apiarios-list.component')
                    .then(m => m.ApiariosListComponent)
            },

            // Apiarios - Crear
            {
                path: 'apiarios/nuevo',
                loadComponent: () => import('./features/admin/apiarios/apiario-detail/apiario-detail.component')
                    .then(m => m.ApiarioDetailComponent)
            },

            // Apiarios - Editar
            {
                path: 'apiarios/:id/edit',
                loadComponent: () => import('./features/admin/apiarios/apiario-detail/apiario-detail.component')
                    .then(m => m.ApiarioDetailComponent)
            },
            // Entradas de Miel - Listado
            {
                path: 'entradas-miel',
                loadComponent: () => import('./features/acopiador/entradas-miel/entradas-miel-list/entradas-miel-list.component')
                    .then(m => m.EntradasMielListComponent)
            },

            // Entradas de Miel - Nueva
            {
                path: 'entradas-miel/nueva',
                loadComponent: () => import('./features/acopiador/entradas-miel/entradas-miel-create/entradas-miel-create.component')
                    .then(m => m.EntradasMielCreateComponent)
            },
            // Salidas de Miel - Listado
            {
                path: 'salidas-miel',
                loadComponent: () => import('./features/acopiador/salidas-miel/salidas-miel-list.component')
                    .then(m => m.SalidasMielListComponent)
            },

            // Salidas de Miel - Nueva
            {
                path: 'salidas-miel/nueva',
                loadComponent: () => import('./features/acopiador/salidas-miel/salidas-miel-create.component')
                    .then(m => m.SalidasMielCreateComponent)
            },

            // Salidas de Miel - Editar (mismo componente que crear)
            {
                path: 'salidas-miel/:id',
                loadComponent: () => import('./features/acopiador/salidas-miel/salidas-miel-create.component')
                    .then(m => m.SalidasMielCreateComponent)
            },

            // Asignación de Tambores
            {
                path: 'asignacion-tambores',
                loadComponent: () => import('./features/acopiador/asignacion-tambores/asignacion-tambores-list/asignacion-tambores-list.component')
                    .then(m => m.AsignacionTamboresListComponent)
            },

            // Redirección por defecto
            {
                path: '',
                redirectTo: 'mis-apicultores',
                pathMatch: 'full'
            }

            // TODO: Agregar más rutas aquí
            // { path: 'vincular', ... },
            // { path: 'apiarios', ... },
            // { path: 'compras', ... },
        ]
    },

    // 404 - Ruta no encontrada
    {
        path: '**',
        redirectTo: '/auth/login'
    }
];