import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ImageCompressorService } from '../../core/services/image-compressor.service';
import { SocialService } from '../../core/services/social.service';
import { ToastService } from '../../core/services/toast.service';
import { TranslatePipe } from '../../core/pipes/translate.pipe';
import { FeedItem } from '../../core/models/feed-item.model';

@Component({
  selector: 'app-post-create',
  imports: [FormsModule, TranslatePipe],
  templateUrl: './post-create.component.html',
  styleUrl: './post-create.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PostCreateComponent {
  publicado = output<FeedItem>();
  cancelado = output<void>();

  private socialService = inject(SocialService);
  private imageCompressor = inject(ImageCompressorService);
  private toast = inject(ToastService);

  private fileInput = viewChild<ElementRef<HTMLInputElement>>('fileInput');

  texto = signal('');
  fotoPreview = signal<string | null>(null);
  publicando = signal(false);

  private fotoFile: File | null = null;

  readonly MAX_CHARS = 1000;

  get charsRestantes(): number {
    return this.MAX_CHARS - this.texto().length;
  }

  selecionarFoto(): void {
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

  async publicar(): Promise<void> {
    const texto = this.texto().trim();
    if (!texto || this.publicando()) return;

    this.publicando.set(true);
    const formData = new FormData();
    formData.append('texto', texto);
    if (this.fotoFile) formData.append('foto', this.fotoFile, this.fotoFile.name);

    this.socialService.criarPost(formData).subscribe({
      next: (post) => {
        this.publicando.set(false);
        this.toast.success('post.created');
        this.publicado.emit(post);
      },
      error: () => {
        this.publicando.set(false);
        this.toast.error('feed.error');
      },
    });
  }

  cancelar(): void {
    this.cancelado.emit();
  }
}
