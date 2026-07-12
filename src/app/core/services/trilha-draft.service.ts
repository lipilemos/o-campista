import { Injectable } from '@angular/core';

import { TrilhaRascunho } from '../models/trilha.model';

@Injectable({
  providedIn: 'root',
})
export class TrilhaDraftService {
  private readonly STORAGE_KEY = 'ocampista-trilha-rascunho';

  obter(): TrilhaRascunho | null {
    const dadosSalvos = localStorage.getItem(this.STORAGE_KEY);

    if (!dadosSalvos) {
      return null;
    }

    return JSON.parse(dadosSalvos) as TrilhaRascunho;
  }

  salvar(rascunho: TrilhaRascunho): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(rascunho));
  }

  limpar(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }

  temRascunho(): boolean {
    return localStorage.getItem(this.STORAGE_KEY) !== null;
  }
}
