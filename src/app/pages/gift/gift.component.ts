import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { GiftService } from '../../core/services/gift.service';
@Component({
  selector: 'app-gift-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule], // Apenas módulos essenciais
  templateUrl: './gift.component.html',
  styleUrls: ['./gift.component.scss']
})
export class GiftComponent implements OnInit {
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
    private router: Router
  ) {
    this.giftForm = this.fb.group({
      nome: ['', [Validators.required, Validators.minLength(3)]],
      descricao: ['']
    });
  }

  ngOnInit(): void {
    this.captureGPS();
  }

  captureGPS() {
    // Defina aqui a sua posição default (ex: um camping específico ou centro da cidade)
    const DEFAULT_COORDS = { lat: -23.550520, lng: -46.633308 }; // Exemplo: São Paulo

    if (navigator.geolocation) {
      const options = {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      };

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          // Sucesso: GPS Real
          this.coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          this.hasLocation = true;
        },
        (error) => {
          // Fallback: Em caso de erro, usamos a posição padrão
          console.warn('GPS falhou, usando posição default:', error.message);

          this.coords = DEFAULT_COORDS; // Atribui a mesma posição default no fallback
          this.hasLocation = true; // Mantemos como true para permitir o envio do formulário

        },
        options
      );
    } else {
      // Caso o navegador não suporte Geolocation
      this.coords = DEFAULT_COORDS;
      this.hasLocation = true;
    }
  }

  onPhotoSelected(event: any) {
    const files: FileList = event.target.files;

    if (files && files.length > 0) {
      const file = files[0];
      this.selectedFile = file;

      const reader = new FileReader();

      reader.onload = () => {
        // Define o preview da imagem para o HTML
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
    formData.append(
      'usuariocriadorid',
      usuarioLogado?.id.toString() || ''
    );

    this.giftService.createGift(formData)
      .subscribe({

        next: () => {

          this.loading = false;
          this.erro = false;

          this.mensagem =
            '🎉 Presente deixado com sucesso!';

          setTimeout(() => {

            this.router.navigate(['/home']);

          }, 2000);
        },

        error: (error) => {

          this.loading = false;
          this.erro = true;

          this.mensagem =
            error?.error?.mensagem ||
            'Não foi possível criar o presente.';
        }
      });
  }

  goBack() { this.router.navigate(['/account']); }
}
