import { Injectable, signal } from '@angular/core';
import { Subject } from 'rxjs';

export interface ConfirmDialogData {
  titulo: string;
  mensagem: string;
  textoBotaoConfirmar?: string;
  textoBotaoCancelar?: string;
}

@Injectable({
  providedIn: 'root',
})
export class ConfirmDialogService {
  readonly visivel = signal(false);
  readonly dados = signal<ConfirmDialogData | null>(null);

  private resultado$ = new Subject<boolean>();

  confirmar(data: ConfirmDialogData): Subject<boolean> {
    this.dados.set(data);
    this.visivel.set(true);
    this.resultado$ = new Subject<boolean>();
    return this.resultado$;
  }

  responder(confirmado: boolean): void {
    this.resultado$.next(confirmado);
    this.resultado$.complete();
    this.visivel.set(false);
    this.dados.set(null);
  }
}
