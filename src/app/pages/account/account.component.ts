import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { forkJoin, Observable } from 'rxjs';
import { Avaliacao } from '../../core/models/avaliacao.model';
import { HistoricoCheckin } from '../../core/models/historico-checkin.model';
import { Presente } from '../../core/models/presente.model';
import { UsuarioLogado } from '../../core/models/user.model';
import { AuthService } from '../../core/services/auth.service';
import { CampingService } from '../../core/services/camping.service';
import { CheckinService } from '../../core/services/checkin.service';
import { ConfirmDialogService } from '../../core/services/confirm-dialog.service';
import { ToastService } from '../../core/services/toast.service';
import { UsuarioService } from '../../core/services/usuario.service';
import { ImgFallbackDirective } from '../../core/directives/img-fallback.directive';
import { CheckinHistoryComponent } from './checkin-history/checkin-history.component';
import { ProfileDetailComponent } from './profile-detail/profile-detail.component';

@Component({
  selector: 'app-account',
  imports: [CommonModule, CheckinHistoryComponent, ProfileDetailComponent, ImgFallbackDirective],
  templateUrl: './account.component.html',
  styleUrls: ['./account.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
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
  mostrarPerfilDetalhe = false;
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
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
        this.cdr.markForCheck();
        this.carregarHistoricoCheckins();
      });
  }

  private carregarHistoricoCheckins(): void {
    const usuarioId = this.authService.getUser()?.id;
    if (usuarioId) {
      this.checkinService.obterHistorico(usuarioId).subscribe(
        historico => {
          this.historicoCheckins = historico;
          this.cdr.markForCheck();
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
        this.cdr.markForCheck();
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

    this.usuarioService.obterPerfil(this.authService.getUser()?.id.toString()!)
      .subscribe(usuario => {
        this.usuario = usuario;
        this.cdr.markForCheck();
      });
  }

  abrirPerfilDetalhe(): void {
    this.mostrarPerfilDetalhe = true;
    document.body.style.overflow = 'hidden';
  }

  fecharPerfilDetalhe(): void {
    this.mostrarPerfilDetalhe = false;
    document.body.style.overflow = '';
  }

  onPerfilAtualizado(usuario: UsuarioLogado): void {
    this.usuario = usuario;
    this.authService.atualizarUsuarioLocal(usuario);
  }

  abrirPresente(presente: Presente) {
    this.presenteSelecionado = presente;
  }


  fecharPresente() {
    this.presenteSelecionado = null;
  }
  private toast = inject(ToastService);
  private confirmDialog = inject(ConfirmDialogService);

  copiarCodigo(codigo: string): void {
    navigator.clipboard.writeText(codigo);
    this.toast.success('Código copiado com sucesso!');
  }

  excluirConta(): void {
    this.confirmDialog
      .confirmar({
        titulo: 'Excluir conta',
        mensagem:
          'Tem certeza que deseja excluir sua conta? Esta ação não pode ser desfeita e todos os seus dados serão removidos.',
        textoBotaoConfirmar: 'Excluir',
        textoBotaoCancelar: 'Cancelar',
      })
      .subscribe((confirmado) => {
        if (!confirmado) return;
        this.usuarioService.deletarConta(this.usuario.id).subscribe({
          next: () => {
            this.toast.success('Conta excluída com sucesso.');
            this.authService.logout();
          },
          error: () => {
            this.toast.error('Não foi possível excluir a conta. Tente novamente.');
          },
        });
      });
  }
}

