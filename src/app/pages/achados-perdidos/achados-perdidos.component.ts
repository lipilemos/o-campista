import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AcessoAchados, AchadoPerdido, TipoAchado } from '../../core/models/achado-perdido.model';
import { AchadosPerdidosService } from '../../core/services/achados-perdidos.service';
import { ConfirmDialogService } from '../../core/services/confirm-dialog.service';
import { I18nService } from '../../core/services/i18n.service';
import { ToastService } from '../../core/services/toast.service';
import { TranslatePipe } from '../../core/pipes/translate.pipe';
import { AchadoPerdidoCardComponent } from './achado-perdido-card/achado-perdido-card.component';

type Aba = 'todos' | TipoAchado;

@Component({
  selector: 'app-achados-perdidos',
  imports: [AchadoPerdidoCardComponent, TranslatePipe],
  templateUrl: './achados-perdidos.component.html',
  styleUrl: './achados-perdidos.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AchadosPerdidosComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private service = inject(AchadosPerdidosService);
  private confirmDialog = inject(ConfirmDialogService);
  private toast = inject(ToastService);
  private i18n = inject(I18nService);

  readonly campingId = Number(this.route.snapshot.paramMap.get('campingId'));

  abaAtiva = signal<Aba>('todos');
  itens = signal<AchadoPerdido[]>([]);
  acesso = signal<AcessoAchados | null>(null);
  carregando = signal(false);
  carregandoAcesso = signal(true);
  erro = signal(false);
  semMais = signal(false);
  reivindicandoId = signal<number | null>(null);

  private pagina = 1;
  private readonly LIMITE = 20;

  constructor() {
    this.carregarAcesso();
  }

  private carregarAcesso(): void {
    this.service.acesso(this.campingId).subscribe({
      next: (acesso) => {
        this.acesso.set(acesso);
        this.carregandoAcesso.set(false);
        if (acesso.podeVer) this.carregar();
      },
      error: () => {
        this.acesso.set({ podeVer: false, podePublicar: false });
        this.carregandoAcesso.set(false);
      },
    });
  }

  trocarAba(aba: Aba): void {
    if (this.abaAtiva() === aba) return;
    this.abaAtiva.set(aba);
    this.pagina = 1;
    this.itens.set([]);
    this.semMais.set(false);
    this.carregar();
  }

  carregar(): void {
    if (this.carregando()) return;
    this.carregando.set(true);
    this.erro.set(false);

    const aba = this.abaAtiva();
    const tipo = aba === 'todos' ? null : aba;

    this.service.listar(this.campingId, tipo, true, this.pagina, this.LIMITE).subscribe({
      next: (novos) => {
        const lista = Array.isArray(novos) ? novos : [];
        this.itens.update((prev) => (this.pagina === 1 ? lista : [...prev, ...lista]));
        this.semMais.set(lista.length < this.LIMITE);
        this.pagina++;
        this.carregando.set(false);
      },
      error: () => {
        this.erro.set(true);
        this.carregando.set(false);
      },
    });
  }

  publicar(): void {
    this.router.navigate(['/achados-perdidos', this.campingId, 'novo']);
  }

  voltarAoMapa(): void {
    this.router.navigate(['/mapa']);
  }

  onReivindicar(item: AchadoPerdido): void {
    if (this.reivindicandoId() !== null) return;
    this.reivindicandoId.set(item.id);

    this.service.reivindicar(item.id).subscribe({
      next: (sala) => {
        this.reivindicandoId.set(null);
        this.router.navigate(['/chat', sala.id]);
      },
      error: () => {
        this.reivindicandoId.set(null);
        this.toast.error('lost.board.claim-error');
      },
    });
  }

  onResolver(item: AchadoPerdido): void {
    this.service.resolver(item.id).subscribe({
      next: () => {
        // Resolvidos são esmaecidos e vão para o fim da lista — mesma ordem do backend.
        this.itens.update((prev) =>
          [...prev.map((i) => (i.id === item.id ? { ...i, resolvido: true } : i))].sort(
            (a, b) => Number(a.resolvido) - Number(b.resolvido),
          ),
        );
        this.toast.success('lost.board.resolved');
      },
      error: () => this.toast.error('lost.board.error'),
    });
  }

  onDeletar(item: AchadoPerdido): void {
    this.confirmDialog
      .confirmar({
        titulo: this.i18n.t('lost.board.delete-title'),
        mensagem: this.i18n.t('lost.board.delete-message'),
        textoBotaoConfirmar: this.i18n.t('lost.board.delete-confirm'),
        textoBotaoCancelar: this.i18n.t('lost.board.delete-cancel'),
      })
      .subscribe((confirmado) => {
        if (!confirmado) return;
        this.service.deletar(item.id).subscribe({
          next: () => {
            this.itens.update((prev) => prev.filter((i) => i.id !== item.id));
            this.toast.success('lost.board.deleted');
          },
          error: () => this.toast.error('lost.board.error'),
        });
      });
  }
}
