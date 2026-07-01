import { Injectable } from '@angular/core';

import { Checklist } from '../models/checklist.model';

@Injectable({
  providedIn: 'root',
})
export class ChecklistService {
  private readonly STORAGE_KEY = 'ocampista-checklists';

  listar(): Checklist[] {
    const dadosSalvos = localStorage.getItem(this.STORAGE_KEY);

    if (dadosSalvos) {
      return JSON.parse(dadosSalvos) as Checklist[];
    }

    const checklists = this.obterChecklistPadrao();

    this.salvar(checklists);

    return checklists;
  }

  salvar(checklists: Checklist[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(checklists));
  }

  limpar(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }

  restaurarPadrao(): Checklist[] {
    const checklists = this.obterChecklistPadrao();

    this.salvar(checklists);

    return checklists;
  }

  private obterChecklistPadrao(): Checklist[] {
    return [
      {
        id: 1,
        nome: 'Checklist Completo',
        progresso: 0,
        categorias: [
          {
            nome: '🏕️ Abrigo',
            itens: [
              { id: 1, descricao: 'Barraca', concluido: false },
              { id: 2, descricao: 'Sobreteto', concluido: false },
              { id: 3, descricao: 'Estacas', concluido: false },
              { id: 4, descricao: 'Cordas de ancoragem', concluido: false },
              { id: 5, descricao: 'Lona para o chão', concluido: false },
              { id: 6, descricao: 'Martelo para estacas', concluido: false },
            ],
          },
          {
            nome: '🛏️ Dormir',
            itens: [
              { id: 7, descricao: 'Saco de dormir', concluido: false },
              { id: 8, descricao: 'Colchonete', concluido: false },
              { id: 9, descricao: 'Travesseiro', concluido: false },
              { id: 10, descricao: 'Cobertor extra', concluido: false },
            ],
          },
          {
            nome: '🍳 Cozinha',
            itens: [
              { id: 11, descricao: 'Fogareiro', concluido: false },
              { id: 12, descricao: 'Gás reserva', concluido: false },
              { id: 13, descricao: 'Panela', concluido: false },
              { id: 14, descricao: 'Frigideira', concluido: false },
              { id: 15, descricao: 'Talheres', concluido: false },
              { id: 16, descricao: 'Pratos', concluido: false },
              { id: 17, descricao: 'Caneca', concluido: false },
              { id: 18, descricao: 'Abridor de latas', concluido: false },
              { id: 19, descricao: 'Isqueiro', concluido: false },
              { id: 20, descricao: 'Fósforos', concluido: false },
            ],
          },
          {
            nome: '🥪 Alimentação',
            itens: [
              { id: 21, descricao: 'Água potável', concluido: false },
              { id: 22, descricao: 'Lanches rápidos', concluido: false },
              { id: 23, descricao: 'Café', concluido: false },
              { id: 24, descricao: 'Almoço planejado', concluido: false },
              { id: 25, descricao: 'Jantar planejado', concluido: false },
              { id: 26, descricao: 'Sacos de lixo', concluido: false },
            ],
          },
          {
            nome: '🧼 Higiene',
            itens: [
              { id: 27, descricao: 'Escova de dentes', concluido: false },
              { id: 28, descricao: 'Pasta de dentes', concluido: false },
              { id: 29, descricao: 'Sabonete', concluido: false },
              { id: 30, descricao: 'Papel higiênico', concluido: false },
              { id: 31, descricao: 'Toalha', concluido: false },
              { id: 32, descricao: 'Álcool em gel', concluido: false },
            ],
          },
          {
            nome: '🩹 Segurança',
            itens: [
              { id: 33, descricao: 'Kit primeiros socorros', concluido: false },
              { id: 34, descricao: 'Lanterna', concluido: false },
              { id: 35, descricao: 'Pilhas extras', concluido: false },
              { id: 36, descricao: 'Canivete', concluido: false },
              { id: 37, descricao: 'Apito', concluido: false },
              { id: 38, descricao: 'Protetor solar', concluido: false },
              { id: 39, descricao: 'Repelente', concluido: false },
            ],
          },
          {
            nome: '👕 Vestuário',
            itens: [
              { id: 40, descricao: 'Roupas leves', concluido: false },
              { id: 41, descricao: 'Agasalho', concluido: false },
              { id: 42, descricao: 'Capa de chuva', concluido: false },
              { id: 43, descricao: 'Boné ou chapéu', concluido: false },
              { id: 44, descricao: 'Meias extras', concluido: false },
              { id: 45, descricao: 'Bota de trilha', concluido: false },
            ],
          },
          {
            nome: '🔋 Eletrônicos',
            itens: [
              { id: 46, descricao: 'Celular', concluido: false },
              { id: 47, descricao: 'Carregador', concluido: false },
              { id: 48, descricao: 'Power Bank', concluido: false },
              { id: 49, descricao: 'GPS Offline', concluido: false },
            ],
          },
          {
            nome: '🎒 Extras',
            itens: [
              { id: 50, descricao: 'Cadeira de camping', concluido: false },
              { id: 51, descricao: 'Mesa dobrável', concluido: false },
              { id: 52, descricao: 'Rede', concluido: false },
              { id: 53, descricao: 'Binóculos', concluido: false },
              { id: 54, descricao: 'Câmera fotográfica', concluido: false },
              { id: 55, descricao: 'Livro ou baralho', concluido: false },
            ],
          },
        ],
      },
    ];
  }
}
