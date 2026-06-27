import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormularioAvaliacaoComponent } from '../../../components/formulario-avaliacao/formulario-avaliacao.component';
import { Avaliacao } from '../../../core/models/avaliacao.model';
import { HistoricoCheckin } from '../../../core/models/historico-checkin.model';

@Component({
  selector: 'app-checkin-history',
  imports: [CommonModule, FormularioAvaliacaoComponent],
  templateUrl: './checkin-history.component.html',
  styleUrls: ['./checkin-history.component.scss'],
})
export class CheckinHistoryComponent implements OnInit {
  @Input() historico: HistoricoCheckin[] = [];
  @Input() campingSelecionado: HistoricoCheckin | null = null;
  @Input() checkinsAvaliados: Set<number> = new Set();
  @Output() selecionarCampingEvent = new EventEmitter<HistoricoCheckin>();
  @Output() fecharDetalhesEvent = new EventEmitter<void>();
  @Output() fecharHistoricoEvent = new EventEmitter<void>();
  @Output() avaliacaoSalvaEvent = new EventEmitter<Avaliacao>();

  mostrarDetalhes = false;

  ngOnInit() {
    this.historico.sort(
      (a, b) => new Date(b.dataCriacao).getTime() - new Date(a.dataCriacao).getTime()
    );
  }

  isAvaliado(item: HistoricoCheckin): boolean {
    return this.checkinsAvaliados.has(item.id || 0);
  }

  selecionarCamping(historico: HistoricoCheckin): void {
    this.mostrarDetalhes = true;
    this.selecionarCampingEvent.emit(historico);
  }

  fecharDetalhes(): void {
    this.mostrarDetalhes = false;
    this.fecharDetalhesEvent.emit();
  }

  fecharHistorico(): void {
    this.fecharHistoricoEvent.emit();
  }

  onAvaliacaoSalva(avaliacao: Avaliacao): void {
    this.avaliacaoSalvaEvent.emit(avaliacao);
  }
}
