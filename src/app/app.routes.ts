import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [

    {
        path: '',
        loadComponent: () =>
            import('./pages/login/login.component')
                .then(m => m.LoginComponent)
    },
    {
        path: 'forgot-password',
        loadComponent: () =>
            import('./pages/forgot-password/forgot-password.component')
                .then(m => m.ForgotPasswordComponent)
    },
    {
        path: 'register',
        loadComponent: () =>
            import('./pages/register/register.component')
                .then(m => m.RegisterComponent)
    },
    {
        path: 'home',
        canActivate: [authGuard],
        loadComponent: () =>
            import('./pages/home/home.component')
                .then(m => m.HomeComponent)
    },
    {
        path: 'account',
        canActivate: [authGuard],
        loadComponent: () =>
            import('./pages/account/account.component')
                .then(m => m.AccountComponent)
    },
    {
        path: 'mapa',
        canActivate: [authGuard],
        loadComponent: () =>
            import('./pages/map/map.component')
                .then(m => m.MapComponent)
    },
    {
        path: 'checklist',
        canActivate: [authGuard],
        loadComponent: () =>
            import('./pages/checklist/checklist.component')
                .then(m => m.ChecklistComponent)
    },
    {
        path: 'gift',
        canActivate: [authGuard],
        loadComponent: () =>
            import('./pages/gift/gift.component')
                .then(m => m.GiftComponent)
    },
    {
        path: '**',
        redirectTo: ''
    }
];
