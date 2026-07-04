import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { Router } from '@angular/router';
import { forkJoin, Observable, of } from 'rxjs';
import { Avaliacao } from '../../core/models/avaliacao.model';
import { Camping } from '../../core/models/camping.model';
import { HistoricoCheckin } from '../../core/models/historico-checkin.model';
import { ConfiguracaoPrivacidade, UsuarioBusca } from '../../core/models/perfil-publico.model';
import { Presente } from '../../core/models/presente.model';
import { UsuarioLogado } from '../../core/models/user.model';
import { AuthService } from '../../core/services/auth.service';
import { CampingService } from '../../core/services/camping.service';
import { TrilhaService } from '../../core/services/trilha.service';
import { CheckinService } from '../../core/services/checkin.service';
import { ConfirmDialogService } from '../../core/services/confirm-dialog.service';
import { SocialService } from '../../core/services/social.service';
import { ToastService } from '../../core/services/toast.service';
import { UsuarioService } from '../../core/services/usuario.service';
import { ImgFallbackDirective } from '../../core/directives/img-fallback.directive';
import { CheckinHistoryComponent } from './checkin-history/checkin-history.component';
import { ProfileDetailComponent } from './profile-detail/profile-detail.component';
import { TranslatePipe } from '../../core/pipes/translate.pipe';

@Component({
  selector: 'app-account',
  imports: [
    CommonModule,
    CheckinHistoryComponent,
    ProfileDetailComponent,
    ImgFallbackDirective,
    TranslatePipe,
    RouterLink,
  ],
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

  favoritos = signal<Camping[]>([]);
  carregandoFavoritos = signal(false);
  totalSeguidores = signal(0);
  totalSeguindo = signal(0);
  privacidade = signal<ConfiguracaoPrivacidade | null>(null);
  modalSocial = signal<'seguidores' | 'seguindo' | null>(null);
  listaModal = signal<UsuarioBusca[]>([]);
  carregandoLista = signal(false);
  salvandoPrivacidade = signal(false);

  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private socialService = inject(SocialService);

  constructor(
    private authService: AuthService,
    private usuarioService: UsuarioService,
    private checkinService: CheckinService,
    private campingService: CampingService,
  ) {}

  ngOnInit(): void {
    this.usuarioService
      .obterPerfil(this.authService.getUser()?.id.toString()!)
      .subscribe((usuario) => {
        this.usuario = usuario;
        this.cdr.markForCheck();
        this.carregarHistoricoCheckins();
        this.carregarDadosSociais(usuario.id);
        this.carregarPrivacidade(usuario.id);
        this.carregarFavoritos(usuario.id);
      });
  }

  private carregarFavoritos(id: string): void {
    this.carregandoFavoritos.set(true);
    this.campingService.getFavoritos(id).subscribe({
      next: (lista) => {
        this.favoritos.set(lista);
        this.carregandoFavoritos.set(false);
      },
      error: () => this.carregandoFavoritos.set(false),
    });
  }

  private carregarDadosSociais(id: string): void {
    this.socialService.getPerfil(id).subscribe({
      next: (perfil) => {
        this.totalSeguidores.set(perfil.totalSeguidores);
        this.totalSeguindo.set(perfil.totalSeguindo);
      },
    });
  }

  private carregarPrivacidade(id: string): void {
    this.socialService.getPrivacidade(id).subscribe({
      next: (config) => this.privacidade.set(config),
    });
  }

  abrirModalSeguidores(): void {
    const id = this.usuario?.id;
    if (!id) return;
    this.modalSocial.set('seguidores');
    this.carregandoLista.set(true);
    this.listaModal.set([]);
    this.socialService.getSeguidores(id).subscribe({
      next: (lista) => {
        this.listaModal.set(lista);
        this.carregandoLista.set(false);
      },
      error: () => this.carregandoLista.set(false),
    });
  }

  abrirModalSeguindo(): void {
    const id = this.usuario?.id;
    if (!id) return;
    this.modalSocial.set('seguindo');
    this.carregandoLista.set(true);
    this.listaModal.set([]);
    this.socialService.getSeguindo(id).subscribe({
      next: (lista) => {
        this.listaModal.set(lista);
        this.carregandoLista.set(false);
      },
      error: () => this.carregandoLista.set(false),
    });
  }

  fecharModalSocial(): void {
    this.modalSocial.set(null);
    this.listaModal.set([]);
  }

  togglePrivacidade(campo: keyof ConfiguracaoPrivacidade): void {
    const atual = this.privacidade();
    if (!atual) return;
    const nova = { ...atual, [campo]: !atual[campo] };
    this.privacidade.set(nova);
    this.salvandoPrivacidade.set(true);
    this.socialService.salvarPrivacidade(this.usuario.id, nova).subscribe({
      next: () => this.salvandoPrivacidade.set(false),
      error: () => {
        this.privacidade.set(atual);
        this.salvandoPrivacidade.set(false);
        this.toast.error('Não foi possível salvar as preferências de privacidade.');
      },
    });
  }

  private carregarHistoricoCheckins(): void {
    const usuarioId = this.authService.getUser()?.id;
    if (usuarioId) {
      this.checkinService.obterHistorico(usuarioId).subscribe(
        (historico) => {
          this.historicoCheckins = historico;
          this.cdr.markForCheck();
          this.carregarStatusAvaliacoes();
        },
        (error) => console.error('Erro ao carregar histórico de check-ins:', error),
      );
    }
  }

  private carregarStatusAvaliacoes(): void {
    const usuarioId = this.authService.getUser()?.id;
    if (!usuarioId || this.historicoCheckins.length === 0) return;

    const campingIdsUnicos = [
      ...new Set(this.historicoCheckins.filter((h) => h.camping !== null).map((h) => h.campingId)),
    ];
    const trilhaIdsUnicos = [
      ...new Set(this.historicoCheckins.filter((h) => h.trilhaId).map((h) => h.trilhaId!)),
    ];

    const campingReqs: Record<string, Observable<Avaliacao[] | []>> = {};
    campingIdsUnicos.forEach((id) => {
      campingReqs[id.toString()] = this.campingService.obterAvaliacaoUsuario(id, usuarioId);
    });

    const trilhaReqs: Record<string, Observable<Avaliacao[] | []>> = {};
    trilhaIdsUnicos.forEach((id) => {
      trilhaReqs[id.toString()] = this.trilhaService.obterAvaliacoes(id);
    });

    const campingObs =
      campingIdsUnicos.length > 0 ? forkJoin(campingReqs) : of({} as Record<string, Avaliacao[]>);
    const trilhaObs =
      trilhaIdsUnicos.length > 0 ? forkJoin(trilhaReqs) : of({} as Record<string, Avaliacao[]>);

    forkJoin({ campings: campingObs, trilhas: trilhaObs }).subscribe({
      next: ({ campings, trilhas }) => {
        const avaliados = new Set<number>();
        Object.values(campings).forEach((avaliacoes) => {
          avaliacoes.forEach((av) => {
            if (av.checkinId) avaliados.add(av.checkinId);
          });
        });
        Object.values(trilhas).forEach((avaliacoes) => {
          avaliacoes
            .filter((av) => av.usuarioId === usuarioId)
            .forEach((av) => {
              if (av.checkinId) avaliados.add(av.checkinId);
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

    return (this.usuario.xp / this.usuario.xpProximoNivel) * 100;
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

    this.usuarioService
      .obterPerfil(this.authService.getUser()?.id.toString()!)
      .subscribe((usuario) => {
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
  private trilhaService = inject(TrilhaService);
  private toast = inject(ToastService);
  private confirmDialog = inject(ConfirmDialogService);

  desfavoritarCamping(campingId: number): void {
    const usuarioId = this.usuario?.id;
    if (!usuarioId) return;
    this.campingService.desfavoritar(usuarioId, campingId).subscribe({
      next: () => this.favoritos.update((lista) => lista.filter((c) => c.id !== campingId)),
      error: () => {
        this.campingService.reverterFavorito(campingId, true);
        this.toast.error('account.favorito-erro');
      },
    });
  }

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
