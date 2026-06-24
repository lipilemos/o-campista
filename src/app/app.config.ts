import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { loadingInterceptor } from './core/interceptors/loading.interceptor';

export const appConfig: ApplicationConfig = {
    providers: [

        provideBrowserGlobalErrorListeners(),

        provideZoneChangeDetection({
            eventCoalescing: true
        }),

        provideRouter(routes),

        provideHttpClient(
            withInterceptors([loadingInterceptor])
        )
    ]
};
