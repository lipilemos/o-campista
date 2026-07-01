import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { ImgFallbackDirective } from '../../../core/directives/img-fallback.directive';
import { UsuarioLogado } from '../../../core/models/user.model';
import { ImageCompressorService } from '../../../core/services/image-compressor.service';
import { UsuarioService } from '../../../core/services/usuario.service';
import { AuthService } from '../../../core/services/auth.service';

const MAX_FILE_SIZE = 5 * 1024 * 1024;

@Component({
  selector: 'app-profile-detail',
  imports: [ImgFallbackDirective],
  templateUrl: './profile-detail.component.html',
  styleUrl: './profile-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'dialog',
    'aria-modal': 'true',
    'aria-label': 'Detalhes do perfil',
  },
})
export class ProfileDetailComponent {
  usuario = input.required<UsuarioLogado>();
  fechar = output<void>();
  perfilAtualizado = output<UsuarioLogado>();

  private usuarioService = inject(UsuarioService);
  private authService = inject(AuthService);
  private imageCompressor = inject(ImageCompressorService);

  imagePreview = signal<string | null>(null);
  selectedFile = signal<File | null>(null);
  uploading = signal(false);
  mensagem = signal('');
  erro = signal(false);

  fotoExibida = computed(() => {
    return this.imagePreview() || this.usuario().fotoPerfil || null;
  });

  inicialNome = computed(() => {
    return this.usuario().nome.charAt(0).toUpperCase();
  });

  async onPhotoSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const rawFile = input.files?.[0];
    if (!rawFile) return;

    if (rawFile.size > MAX_FILE_SIZE) {
      this.erro.set(true);
      this.mensagem.set('A foto deve ter no maximo 5MB.');
      return;
    }

    const file = await this.imageCompressor.compress(rawFile);
    this.selectedFile.set(file);
    this.mensagem.set('');
    this.erro.set(false);

    const reader = new FileReader();
    reader.onload = () => {
      this.imagePreview.set(reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  removePhoto(): void {
    this.imagePreview.set(null);
    this.selectedFile.set(null);
    this.mensagem.set('');
    this.erro.set(false);
  }

  uploadPhoto(): void {
    const file = this.selectedFile();
    if (!file) return;

    this.uploading.set(true);
    this.mensagem.set('');

    const formData = new FormData();
    formData.append('foto', file);

    this.usuarioService.uploadFotoPerfil(this.usuario().id, formData).subscribe({
      next: (usuarioAtualizado) => {
        this.uploading.set(false);
        this.erro.set(false);
        this.mensagem.set('Foto atualizada com sucesso!');
        this.selectedFile.set(null);
        this.imagePreview.set(null);
        this.authService.atualizarUsuarioLocal(usuarioAtualizado);
        this.perfilAtualizado.emit(usuarioAtualizado);
      },
      error: (err) => {
        this.uploading.set(false);
        this.erro.set(true);
        this.mensagem.set(err?.error?.mensagem ?? 'Nao foi possivel atualizar a foto.');
      },
    });
  }

  fecharModal(): void {
    this.fechar.emit();
  }
}
