import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { CampingPainel, CampingParceiro } from '../../../core/models/camping-parceiro.model';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { CampingParceiroService } from '../../../core/services/camping-parceiro.service';

interface Barra {
  data: string;
  quantidade: number;
  /** 0–100, relativo ao maior dia do período. */
  altura: number;
}

@Component({
  selector: 'app-meu-camping',
  imports: [DecimalPipe, RouterLink, TranslatePipe],
  templateUrl: './meu-camping.component.html',
  styleUrl: './meu-camping.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MeuCampingComponent {
  private service = inject(CampingParceiroService);

  campings = signal<CampingParceiro[]>([]);
  selecionado = signal<CampingParceiro | null>(null);
  painel = signal<CampingPainel | null>(null);
  carregando = signal(true);
  erro = signal(false);

  barras = computed<Barra[]>(() => {
    const dias = this.painel()?.checkinsPorDia ?? [];
    const maximo = Math.max(1, ...dias.map((d) => d.quantidade));
    return dias.map((d) => ({
      data: d.data,
      quantidade: d.quantidade,
      altura: Math.round((d.quantidade / maximo) * 100),
    }));
  });

  constructor() {
    this.service
      .listarMeus()
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: (lista) => {
          this.campings.set(lista);
          this.carregando.set(false);
          if (lista.length > 0) this.selecionar(lista[0].id);
        },
        error: () => {
          this.carregando.set(false);
          this.erro.set(true);
        },
      });
  }

  selecionar(id: number): void {
    const camping = this.campings().find((c) => c.id === id) ?? null;
    this.selecionado.set(camping);
    this.painel.set(null);
    this.erro.set(false);
    if (!camping) return;

    this.service.obterPainel(id).subscribe({
      next: (p) => this.painel.set(p),
      error: () => this.erro.set(true),
    });
  }

  recarregar(): void {
    const atual = this.selecionado();
    if (atual) this.selecionar(atual.id);
  }

  diaCurto(data: string): string {
    return data.slice(8, 10);
  }
}
