import {
  Component,
  OnInit,
  inject
} from '@angular/core';

import {
  CommonModule
} from '@angular/common';

import {
  FormsModule
} from '@angular/forms';

import {
  Checklist
} from '../../core/models/checklist.model';

import {
  ChecklistService
} from '../../core/services/checklist.service';

@Component({
  selector: 'app-checklist',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './checklist.component.html',
  styleUrls: ['./checklist.component.scss']
})
export class ChecklistComponent
  implements OnInit {

  private checklistService =
    inject(ChecklistService);

  checklists: Checklist[] = [];

  totalItens = 0;

  totalConcluidos = 0;

  progressoGeral = 0;

  totalCategorias = 0;

  ngOnInit(): void {

    this.checklists =
      this.checklistService.listar();

    this.calcularProgresso();
  }

  toggleItem(): void {

    this.calcularProgresso();

    if (this.checklistService.salvar) {

      this.checklistService.salvar(
        this.checklists
      );
    }
  }

  private calcularProgresso(): void {

    this.totalItens = 0;
    this.totalConcluidos = 0;
    this.totalCategorias = 0;

    this.checklists.forEach(checklist => {

      this.totalCategorias +=
        checklist.categorias.length;

      const itens =
        checklist.categorias
          .flatMap(categoria => categoria.itens);

      const concluidos =
        itens.filter(
          item => item.concluido
        ).length;

      checklist.progresso =
        itens.length > 0
          ? Math.round(
            (concluidos * 100) /
            itens.length
          )
          : 0;

      this.totalItens +=
        itens.length;

      this.totalConcluidos +=
        concluidos;
    });

    this.progressoGeral =
      this.totalItens > 0
        ? Math.round(
          (this.totalConcluidos * 100) /
          this.totalItens
        )
        : 0;
  }

  obterQuantidadeItens(
    checklist: Checklist
  ): number {

    return checklist.categorias
      .flatMap(categoria => categoria.itens)
      .length;
  }

  obterQuantidadeConcluidos(
    checklist: Checklist
  ): number {

    return checklist.categorias
      .flatMap(categoria => categoria.itens)
      .filter(item => item.concluido)
      .length;
  }

  obterQuantidadeCategorias(
    checklist: Checklist
  ): number {

    return checklist.categorias.length;
  }

  checklistConcluido(
    checklist: Checklist
  ): boolean {

    return checklist.progresso === 100;
  }

  obterTextoProgresso(): string {

    return `${this.totalConcluidos}/${this.totalItens}`;
  }
  resetarChecklist(): void {

    this.checklists =
      this.checklistService
        .restaurarPadrao();

    this.calcularProgresso();
  }
  confirmarRestauracao(): void {

    const confirmar =
      confirm(
        'Deseja realmente restaurar todo o checklist?'
      );

    if (!confirmar)
      return;

    this.restaurarChecklist();
  }

  restaurarChecklist(): void {

    this.checklists.forEach(checklist => {

      checklist.categorias.forEach(categoria => {

        categoria.itens.forEach(item => {

          item.concluido = false;

        });

      });

    });

    this.calcularProgresso();

    this.checklistService.salvar(
      this.checklists
    );
  }
}
