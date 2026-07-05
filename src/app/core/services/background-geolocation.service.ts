import { Injectable } from '@angular/core';
import { registerPlugin } from '@capacitor/core';
import type {
  BackgroundGeolocationPlugin,
  CallbackError,
  Location,
} from '@capacitor-community/background-geolocation';
import { Observable } from 'rxjs';

const BackgroundGeolocation = registerPlugin<BackgroundGeolocationPlugin>('BackgroundGeolocation');

@Injectable({ providedIn: 'root' })
export class BackgroundGeolocationService {
  /**
   * Emite posições GPS contínuas. Em plataformas nativas (Android/iOS),
   * continua gravando com tela bloqueada via foreground service.
   * Na web, o plugin não tem implementação — usa watchPosition nativo do browser como fallback.
   */
  watch(): Observable<GeolocationPosition> {
    return new Observable((observer) => {
      let watcherId: string | undefined;
      let browserWatchId: number | undefined;
      let stopped = false;

      BackgroundGeolocation.addWatcher(
        {
          backgroundMessage: 'O Campista está registrando sua trilha.',
          backgroundTitle: 'Gravando trilha',
          requestPermissions: true,
          stale: false,
          distanceFilter: 0,
        },
        (location?: Location, error?: CallbackError) => {
          if (error) {
            // Plugin não disponível na web — cair no fallback do browser
            if (!browserWatchId && !stopped) {
              browserWatchId = navigator.geolocation.watchPosition(
                (pos) => observer.next(pos),
                (err) => observer.error(err),
                { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
              );
            }
            return;
          }
          if (location) {
            observer.next({
              coords: {
                latitude: location.latitude,
                longitude: location.longitude,
                accuracy: location.accuracy ?? 0,
                altitude: location.altitude ?? null,
                altitudeAccuracy: location.altitudeAccuracy ?? null,
                heading: location.bearing ?? null,
                speed: location.speed ?? null,
              },
              timestamp: location.time ?? Date.now(),
            } as GeolocationPosition);
          }
        },
      ).then((id: string) => {
        watcherId = id;
      });

      return () => {
        stopped = true;
        if (watcherId) {
          BackgroundGeolocation.removeWatcher({ id: watcherId });
        }
        if (browserWatchId !== undefined) {
          navigator.geolocation.clearWatch(browserWatchId);
        }
      };
    });
  }
}
