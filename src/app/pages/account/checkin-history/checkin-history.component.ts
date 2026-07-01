import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormularioAvaliacaoComponent } from '../../../components/formulario-avaliacao/formulario-avaliacao.component';
import { Avaliacao } from '../../../core/models/avaliacao.model';
import { HistoricoCheckin } from '../../../core/models/historico-checkin.model';
import { Trilha } from '../../../core/models/trilha.model';

@Component({
  selector: 'app-checkin-history',
  imports: [DatePipe, FormularioAvaliacaoComponent],
  templateUrl: './checkin-history.component.html',
  styleUrls: ['./checkin-history.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckinHistoryComponent implements OnInit {
  @Input() historico: HistoricoCheckin[] = [];

  private _campingSelecionado: HistoricoCheckin | null = null;
  private _trilhaSelecionada: Trilha | undefined;

  @Input()
  set campingSelecionado(value: HistoricoCheckin | null) {
    this._campingSelecionado = value;
    this._trilhaSelecionada = value?.trilhaId
      ? {
          id: value.trilhaId,
          nome: value.trilhaNome ?? '',
          distanciaKm: 0,
          pontos: [],
          concluidaPeloUsuario: false,
          criadoEm: '',
        }
      : undefined;
  }
  get campingSelecionado(): HistoricoCheckin | null {
    return this._campingSelecionado;
  }

  @Input() checkinsAvaliados: Set<number> = new Set();
  @Output() selecionarCampingEvent = new EventEmitter<HistoricoCheckin>();
  @Output() fecharDetalhesEvent = new EventEmitter<void>();
  @Output() fecharHistoricoEvent = new EventEmitter<void>();
  @Output() avaliacaoSalvaEvent = new EventEmitter<Avaliacao>();

  mostrarDetalhes = false;

  ngOnInit() {
    this.historico.sort(
      (a, b) => new Date(b.dataCriacao).getTime() - new Date(a.dataCriacao).getTime(),
    );
  }

  isAvaliado(item: HistoricoCheckin): boolean {
    return this.checkinsAvaliados.has(item.id || 0);
  }

  get trilhaSelecionada(): Trilha | undefined {
    return this._trilhaSelecionada;
  }

  selecionarCamping(historico: HistoricoCheckin): void {
    if (!historico.camping && !historico.trilhaId) return;
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
