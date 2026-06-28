import { Injectable, signal } from '@angular/core';
import { Subject } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class GoogleAuthService {
  private credentialSubject = new Subject<string>();
  private ready: Promise<void> | null = null;

  credential$ = this.credentialSubject.asObservable();
  available = signal(true);

  initialize(): void {
    if (!this.ready) {
      this.ready = this.waitForGsi().then(() => {
        google.accounts.id.initialize({
          client_id: environment.googleClientId,
          callback: (response) => this.credentialSubject.next(response.credential),
        });
      });
    }
  }

  async renderButton(
    element: HTMLElement,
    text: 'continue_with' | 'signup_with' = 'continue_with',
  ): Promise<void> {
    try {
      await this.ready;
      google.accounts.id.renderButton(element, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        shape: 'pill',
        text,
      });
    } catch {
      this.available.set(false);
    }
  }

  private waitForGsi(): Promise<void> {
    if (typeof google !== 'undefined' && google.accounts) {
      return Promise.resolve();
    }
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Google Sign-In indisponível')), 5000);
      const interval = setInterval(() => {
        if (typeof google !== 'undefined' && google.accounts) {
          clearTimeout(timeout);
          clearInterval(interval);
          resolve();
        }
      }, 100);
    });
  }
}
