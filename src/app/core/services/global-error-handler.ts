import { ErrorHandler, Injectable, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ToastService } from './toast.service';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private toastService = inject(ToastService);

  handleError(error: unknown): void {
    if (error instanceof HttpErrorResponse) {
      this.handleHttpError(error);
    } else if (error instanceof Error) {
      console.error('[GlobalErrorHandler]', error.message, error.stack);
    } else {
      console.error('[GlobalErrorHandler] Erro desconhecido:', error);
    }
  }

  private handleHttpError(error: HttpErrorResponse): void {
    if (error.status === 0) {
      this.toastService.error('Sem conexão com o servidor. Verifique sua internet.');
    } else if (error.status >= 500) {
      this.toastService.error('Erro no servidor. Tente novamente mais tarde.');
    }
  }
}
