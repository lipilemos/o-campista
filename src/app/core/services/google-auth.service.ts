import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class GoogleAuthService {
  private credentialSubject = new Subject<string>();

  credential$ = this.credentialSubject.asObservable();

  initialize(): void {
    google.accounts.id.initialize({
      client_id: environment.googleClientId,
      callback: (response) => this.credentialSubject.next(response.credential),
    });
  }

  renderButton(
    element: HTMLElement,
    text: 'continue_with' | 'signup_with' = 'continue_with',
  ): void {
    google.accounts.id.renderButton(element, {
      type: 'standard',
      theme: 'outline',
      size: 'large',
      shape: 'pill',
      text,
    });
  }
}
