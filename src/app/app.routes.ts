import { Routes } from '@angular/router';

export const routes: Routes = [

    {
        path: '',
        loadComponent: () =>
            import('./pages/login/login.component')
                .then(m => m.LoginComponent)
    },

    {
        path: 'home',
        loadComponent: () =>
            import('./pages/home/home.component')
                .then(m => m.HomeComponent)
    },
    {
        path: 'mapa',
        loadComponent: () =>
            import('./pages/map/map.component')
                .then(m => m.MapComponent)
    },
    {
        path: '**',
        redirectTo: ''
    }
];
