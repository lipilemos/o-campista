import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class LocationService {
  getCurrentPosition(): Observable<{ latitude: number; longitude: number }> {
    return new Observable((observer) => {
      const fallback = { latitude: -22.0174, longitude: -47.8903 };

      if (!navigator.geolocation) {
        observer.next(fallback);
        observer.complete();
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          observer.next({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          observer.complete();
        },
        () => {
          observer.next(fallback);
          observer.complete();
        },
        {
          enableHighAccuracy: true,
          timeout: 8000,
          maximumAge: 300000,
        },
      );
    });
  }

  watchLocation(): Observable<GeolocationPosition> {
    return new Observable((observer) => {
      const watchId = navigator.geolocation.watchPosition(
        (position) => observer.next(position),

        (error) => observer.error(error),

        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        },
      );

      return () => {
        navigator.geolocation.clearWatch(watchId);
      };
    });
  }
}
