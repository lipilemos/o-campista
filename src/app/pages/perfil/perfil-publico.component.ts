import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { PerfilPublico, UsuarioBusca } from '../../core/models/perfil-publico.model';
import { ImgFallbackDirective } from '../../core/directives/img-fallback.directive';
import { AuthService } from '../../core/services/auth.service';
import { SocialService } from '../../core/services/social.service';
import { ToastService } from '../../core/services/toast.service';
import { ChatRoomService } from '../../core/services/chat-room.service';
import { SugestoesUsuariosComponent } from '../../components/sugestoes-usuarios/sugestoes-usuarios.component';
import { TranslatePipe } from '../../core/pipes/translate.pipe';

@Component({
  selector: 'app-perfil-publico',
  imports: [DatePipe, ImgFallbackDirective, TranslatePipe, RouterLink, SugestoesUsuariosComponent],
  templateUrl: './perfil-publico.component.html',
  styleUrl: './perfil-publico.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PerfilPublicoComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private socialService = inject(SocialService);
  private authService = inject(AuthService);
  private toast = inject(ToastService);
  private chatRoomService = inject(ChatRoomService);

  perfil = signal<PerfilPublico | null>(null);
  carregando = signal(true);
  erro = signal(false);
  salvandoFollow = signal(false);
  abrindoDm = signal(false);
  modalLista = signal<'seguidores' | 'seguindo' | null>(null);
  listaModal = signal<UsuarioBusca[]>([]);
  carregandoLista = signal(false);
  fotoErro = signal(false);

  private meuId = this.authService.getUser()?.id;
  ehProprioUsuario = computed(() => this.perfil()?.id === this.meuId);

  constructor() {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id) this.carregarPerfil(id);
    });
  }

  carregarPerfil(id: string): void {
    this.carregando.set(true);
    this.erro.set(false);
    this.fotoErro.set(false);
    this.perfil.set(null);
    this.socialService.getPerfil(id).subscribe({
      next: (perfil) => {
        this.perfil.set(perfil);
        this.carregando.set(false);
      },
      error: () => {
        this.erro.set(true);
        this.carregando.set(false);
      },
    });
  }

  toggleFollow(): void {
    const p = this.perfil();
    if (!p || this.salvandoFollow()) return;
    this.salvandoFollow.set(true);
    const obs = p.estouSeguindo
      ? this.socialService.desseguir(p.id)
      : this.socialService.seguir(p.id);
    obs.subscribe({
      next: () => {
        this.perfil.update((prev) =>
          prev
            ? {
                ...prev,
                estouSeguindo: !prev.estouSeguindo,
                totalSeguidores: prev.estouSeguindo
                  ? prev.totalSeguidores - 1
                  : prev.totalSeguidores + 1,
              }
            : prev,
        );
        this.salvandoFollow.set(false);
      },
      error: () => {
        this.toast.error('Não foi possível atualizar o follow. Tente novamente.');
        this.salvandoFollow.set(false);
      },
    });
  }

  abrirSeguidores(): void {
    const p = this.perfil();
    if (!p) return;
    this.modalLista.set('seguidores');
    this.carregandoLista.set(true);
    this.listaModal.set([]);
    this.socialService.getSeguidores(p.id).subscribe({
      next: (lista) => {
        this.listaModal.set(lista);
        this.carregandoLista.set(false);
      },
      error: () => this.carregandoLista.set(false),
    });
  }

  abrirSeguindo(): void {
    const p = this.perfil();
    if (!p) return;
    this.modalLista.set('seguindo');
    this.carregandoLista.set(true);
    this.listaModal.set([]);
    this.socialService.getSeguindo(p.id).subscribe({
      next: (lista) => {
        this.listaModal.set(lista);
        this.carregandoLista.set(false);
      },
      error: () => this.carregandoLista.set(false),
    });
  }

  enviarMensagem(): void {
    const p = this.perfil();
    if (!p || this.abrindoDm()) return;
    this.abrindoDm.set(true);
    this.chatRoomService.abrirDm(p.id).subscribe({
      next: (sala) => {
        this.abrindoDm.set(false);
        this.router.navigate(['/chat', sala.id]);
      },
      error: () => {
        this.toast.error('Não foi possível abrir a conversa. Tente novamente.');
        this.abrindoDm.set(false);
      },
    });
  }

  fecharModal(): void {
    this.modalLista.set(null);
    this.listaModal.set([]);
  }
}
