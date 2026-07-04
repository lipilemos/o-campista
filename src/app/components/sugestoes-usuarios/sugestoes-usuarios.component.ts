import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UsuarioBusca } from '../../core/models/perfil-publico.model';
import { SocialService } from '../../core/services/social.service';
import { ToastService } from '../../core/services/toast.service';
import { ImgFallbackDirective } from '../../core/directives/img-fallback.directive';
import { TranslatePipe } from '../../core/pipes/translate.pipe';

interface Sugestao extends UsuarioBusca {
  seguindo: boolean;
  salvando: boolean;
}

@Component({
  selector: 'app-sugestoes-usuarios',
  imports: [RouterLink, ImgFallbackDirective, TranslatePipe],
  templateUrl: './sugestoes-usuarios.component.html',
  styleUrl: './sugestoes-usuarios.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SugestoesUsuariosComponent {
  private socialService = inject(SocialService);
  private toast = inject(ToastService);

  sugestoes = signal<Sugestao[]>([]);
  carregando = signal(true);

  constructor() {
    this.socialService.getSugestoes().subscribe({
      next: (lista) => {
        this.sugestoes.set(lista.map((u) => ({ ...u, seguindo: false, salvando: false })));
        this.carregando.set(false);
      },
      error: () => this.carregando.set(false),
    });
  }

  toggleFollow(sugestao: Sugestao): void {
    if (sugestao.salvando) return;
    sugestao.salvando = true;
    this.sugestoes.update((prev) => [...prev]);

    const obs = sugestao.seguindo
      ? this.socialService.desseguir(sugestao.id)
      : this.socialService.seguir(sugestao.id);

    obs.subscribe({
      next: () => {
        this.sugestoes.update((prev) =>
          prev.map((s) =>
            s.id === sugestao.id ? { ...s, seguindo: !s.seguindo, salvando: false } : s,
          ),
        );
      },
      error: () => {
        this.sugestoes.update((prev) =>
          prev.map((s) => (s.id === sugestao.id ? { ...s, salvando: false } : s)),
        );
        this.toast.error('sugestoes.erro-follow');
      },
    });
  }

  dispensar(id: string): void {
    this.sugestoes.update((prev) => prev.filter((s) => s.id !== id));
  }
}
