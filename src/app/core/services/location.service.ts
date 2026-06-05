
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class LocationService {

    watchLocation(): Observable<GeolocationPosition> {

        return new Observable(observer => {

            const watchId =
                navigator.geolocation.watchPosition(

                    position => observer.next(position),

                    error => observer.error(error),

                    {
                        enableHighAccuracy: true,
                        timeout: 10000,
                        maximumAge: 0
                    }
                );

            return () => {
                navigator.geolocation.clearWatch(watchId);
            };
        });
    }
}
