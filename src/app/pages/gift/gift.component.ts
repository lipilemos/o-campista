import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { GiftService } from '../../core/services/gift.service';
import { ImageCompressorService } from '../../core/services/image-compressor.service';
import { ToastService } from '../../core/services/toast.service';
import { UsuarioService } from '../../core/services/usuario.service';
import { TranslatePipe } from '../../core/pipes/translate.pipe';

@Component({
  selector: 'app-gift-form',
  imports: [CommonModule, ReactiveFormsModule, TranslatePipe],
  templateUrl: './gift.component.html',
  styleUrls: ['./gift.component.scss'],
})
export class GiftComponent implements OnInit {
  private imageCompressor = inject(ImageCompressorService);
  private toast = inject(ToastService);
  private usuarioService = inject(UsuarioService);

  giftForm: FormGroup;
  imagePreview: string | null = null;
  selectedFile: File | null = null;
  hasLocation = false;
  coords = { lat: 0, lng: 0 };
  loading = false;
  mensagem = '';
  erro = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private giftService: GiftService,
    private router: Router,
  ) {
    this.giftForm = this.fb.group({
      nome: ['', [Validators.required, Validators.minLength(3)]],
      descricao: [''],
    });
  }

  ngOnInit(): void {
    this.captureGPS();
  }

  captureGPS() {
    // Defina aqui a sua posição default (ex: um camping específico ou centro da cidade)
    //const DEFAULT_COORDS = { lat: -22.0174, lng: -47.8903 }; // Exemplo: São Paulo

    if (navigator.geolocation) {
      const options = {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      };

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          // Sucesso: GPS Real
          this.coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          this.hasLocation = true;
        },
        (error) => {
          console.warn('GPS falhou', error.message);

          //this.coords = undefined; // Atribui a mesma posição default no fallback
          this.hasLocation = false; // Mantemos como true para permitir o envio do formulário
        },
        options,
      );
    } else {
      // Caso o navegador não suporte Geolocation
      //this.coords = DEFAULT_COORDS;
      this.hasLocation = false;
    }
  }

  async onPhotoSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const files = input.files;

    if (files && files.length > 0) {
      const file = await this.imageCompressor.compress(files[0]);
      this.selectedFile = file;

      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  removePhoto() {
    this.imagePreview = null;
    this.selectedFile = null;
  }

  onSubmit() {
    const usuarioLogado = this.authService.getUser();

    if (!this.giftForm.valid || !this.selectedFile) {
      return;
    }

    this.loading = true;
    this.mensagem = '';

    const formData = new FormData();

    formData.append('nome', this.giftForm.value.nome);
    formData.append('descricao', this.giftForm.value.descricao);
    formData.append('latitude', this.coords.lat.toString());
    formData.append('longitude', this.coords.lng.toString());
    formData.append('foto', this.selectedFile);
    formData.append('usuariocriadorid', usuarioLogado?.id.toString() || '');

    this.giftService.createGift(formData).subscribe({
      next: () => {
        this.loading = false;
        this.toast.success('Presente deixado com sucesso!');
        this.usuarioService.verificarNovasConquistas();
        setTimeout(() => this.router.navigate(['/home']), 1500);
      },
      error: (error) => {
        this.loading = false;
        this.toast.error(error?.error?.mensagem || 'Não foi possível criar o presente.');
      },
    });
  }

  goBack() {
    this.router.navigate(['/home']);
  }
}
