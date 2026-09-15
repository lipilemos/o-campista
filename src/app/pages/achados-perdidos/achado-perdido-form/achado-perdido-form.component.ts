import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TipoAchado } from '../../../core/models/achado-perdido.model';
import { AchadosPerdidosService } from '../../../core/services/achados-perdidos.service';
import { ImageCompressorService } from '../../../core/services/image-compressor.service';
import { ToastService } from '../../../core/services/toast.service';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';

@Component({
  selector: 'app-achado-perdido-form',
  imports: [ReactiveFormsModule, TranslatePipe],
  templateUrl: './achado-perdido-form.component.html',
  styleUrl: './achado-perdido-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AchadoPerdidoFormComponent {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private service = inject(AchadosPerdidosService);
  private imageCompressor = inject(ImageCompressorService);
  private toast = inject(ToastService);

  private fileInput = viewChild<ElementRef<HTMLInputElement>>('fileInput');

  readonly campingId = Number(this.route.snapshot.paramMap.get('campingId'));

  tipo = signal<TipoAchado>('achado');
  fotoPreview = signal<string | null>(null);
  publicando = signal(false);

  private fotoFile: File | null = null;

  /** A foto é o que permite o dono reconhecer o item, então é exigida em "achado". */
  fotoObrigatoria = computed(() => this.tipo() === 'achado');

  form = this.fb.nonNullable.group({
    titulo: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(120)]],
    descricao: ['', [Validators.maxLength(500)]],
    localGuarda: ['', [Validators.maxLength(120)]],
  });

  podeEnviar = computed(
    () => !this.publicando() && !(this.fotoObrigatoria() && !this.fotoPreview()),
  );

  selecionarTipo(tipo: TipoAchado): void {
    this.tipo.set(tipo);
  }

  abrirSeletorFoto(): void {
    this.fileInput()?.nativeElement.click();
  }

  async onFotoSelecionada(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.fotoFile = await this.imageCompressor.compress(file, 1200, 0.85);
    const reader = new FileReader();
    reader.onload = (e) => this.fotoPreview.set(e.target?.result as string);
    reader.readAsDataURL(this.fotoFile);
  }

  removerFoto(): void {
    this.fotoFile = null;
    this.fotoPreview.set(null);
    const input = this.fileInput()?.nativeElement;
    if (input) input.value = '';
  }

  publicar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if (this.fotoObrigatoria() && !this.fotoFile) {
      this.toast.error('lost.form.photo-required');
      return;
    }

    if (this.publicando()) return;
    this.publicando.set(true);

    const { titulo, descricao, localGuarda } = this.form.getRawValue();

    this.service
      .criar(this.campingId, {
        tipo: this.tipo(),
        titulo: titulo.trim(),
        descricao: descricao.trim() || undefined,
        localGuarda: localGuarda.trim() || undefined,
        foto: this.fotoFile,
      })
      .subscribe({
        next: () => {
          this.publicando.set(false);
          this.toast.success('lost.form.published');
          this.voltar();
        },
        error: () => {
          this.publicando.set(false);
          this.toast.error('lost.form.error');
        },
      });
  }

  voltar(): void {
    this.router.navigate(['/achados-perdidos', this.campingId]);
  }
}
