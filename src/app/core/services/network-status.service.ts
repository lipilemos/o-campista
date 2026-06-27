import { DestroyRef, inject, Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class NetworkStatusService {
  private destroyRef = inject(DestroyRef);

  isOnline = signal(navigator.onLine);

  constructor() {
    const onOnline = () => this.isOnline.set(true);
    const onOffline = () => this.isOnline.set(false);

    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);

    this.destroyRef.onDestroy(() => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    });
  }
}
