import { Routes } from '@angular/router';
import { authGuard } from './core/guards';

export const routes: Routes = [
    // Ruta pública - Login
    {
        path: 'auth/login',
        loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
    },

    // Ruta por defecto - Redirigir al login
    {
        path: '',
        redirectTo: '/auth/login',
        pathMatch: 'full'
    },

    // Ruta 404 - Página no encontrada (temporal)
    {
        path: '**',
        redirectTo: '/auth/login'
    }
];