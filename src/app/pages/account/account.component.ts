import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { forkJoin, Observable } from 'rxjs';
import { Avaliacao } from '../../core/models/avaliacao.model';
import { HistoricoCheckin } from '../../core/models/historico-checkin.model';
import { Presente } from '../../core/models/presente.model';
import { UsuarioLogado } from '../../core/models/user.model';
import { AuthService } from '../../core/services/auth.service';
import { CampingService } from '../../core/services/camping.service';
import { CheckinService } from '../../core/services/checkin.service';
import { UsuarioService } from '../../core/services/usuario.service';
import { CheckinHistoryComponent } from './checkin-history/checkin-history.component';

@Component({
  selector: 'app-account',
  standalone: true,
  imports: [CommonModule, CheckinHistoryComponent],
  templateUrl: './account.component.html',
  styleUrls: ['./account.component.scss']
})
export class AccountComponent implements OnInit {
  onSelecionarCamping(historico: HistoricoCheckin) {
    this.campingSelecionado = historico;
  }
  onFecharDetalhes() {
    this.campingSelecionado = null;
  }
  onAvaliacaoSalva() {
    this.campingSelecionado = null;
    this.carregarHistoricoCheckins();
  }

  campingSelecionado: HistoricoCheckin | null = null;
  checkinsAvaliados: Set<number> = new Set();

  usuario!: UsuarioLogado;
  presenteSelecionado: Presente | null = null;
  historicoCheckins: HistoricoCheckin[] = [];
  mostrarHistorico = false;
  private router = inject(Router);
  constructor(
    private authService: AuthService,
    private usuarioService: UsuarioService,
    private checkinService: CheckinService,
    private campingService: CampingService,
  ) { }

  ngOnInit(): void {
    this.usuarioService.obterPerfil(this.authService.getUser()?.id.toString()!)
      .subscribe(usuario => {
        this.usuario = usuario;
        this.carregarHistoricoCheckins();
      });
  }

  private carregarHistoricoCheckins(): void {
    const usuarioId = this.authService.getUser()?.id;
    if (usuarioId) {
      this.checkinService.obterHistorico(usuarioId).subscribe(
        historico => {
          this.historicoCheckins = historico;
          this.carregarStatusAvaliacoes();
        },
        error => console.error('Erro ao carregar histórico de check-ins:', error)
      );
    }
  }

  private carregarStatusAvaliacoes(): void {
    const usuarioId = this.authService.getUser()?.id;
    if (!usuarioId || this.historicoCheckins.length === 0) return;

    const campingIdsUnicos = [...new Set(this.historicoCheckins.map(h => h.campingId))];

    const requisicoes: Record<string, Observable<Avaliacao[] | []>> = {};
    campingIdsUnicos.forEach(campingId => {
      requisicoes[campingId.toString()] = this.campingService.obterAvaliacaoUsuario(campingId, usuarioId);
    });

    forkJoin(requisicoes).subscribe({
      next: (resultados) => {
        const avaliados = new Set<number>();
        Object.values(resultados).forEach(avaliacoes => {
          avaliacoes.forEach(avaliacao => {
            if (avaliacao.checkinId) {
              avaliados.add(avaliacao.checkinId);
            }
          });
        });
        this.checkinsAvaliados = avaliados;
      },
      error: (error) => console.error('Erro ao carregar status das avaliações:', error),
    });
  }

  get percentualXp(): number {

    if (!this.usuario) {
      return 0;
    }

    return (
      this.usuario.xp /
      this.usuario.xpProximoNivel
    ) * 100;
  }
  openGiftForm() {
    this.router.navigate(['/gift']);

  }

  abrirHistoricoCheckins(): void {
    this.mostrarHistorico = true;
    document.body.style.overflow = 'hidden';
    this.campingSelecionado = null;
  }

  fecharHistoricoCheckins(): void {
    this.mostrarHistorico = false;
    document.body.style.overflow = '';
    this.campingSelecionado = null;
  }

  abrirPresente(presente: Presente) {
    this.presenteSelecionado = presente;
  }


  fecharPresente() {
    this.presenteSelecionado = null;
  }
  copiarCodigo(codigo: string): void {
    navigator.clipboard.writeText(codigo);

    alert('Código copiado com sucesso!');
  }
}

