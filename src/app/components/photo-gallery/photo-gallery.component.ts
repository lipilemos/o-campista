import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { ImgFallbackDirective } from '../../core/directives/img-fallback.directive';
import { CampingFoto } from '../../core/models/camping-foto.model';

@Component({
  selector: 'app-photo-gallery',
  templateUrl: './photo-gallery.component.html',
  styleUrl: './photo-gallery.component.scss',
  imports: [ImgFallbackDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PhotoGalleryComponent {
  fotos = input.required<CampingFoto[]>();
  currentIndex = signal(0);
  fullscreen = signal(false);

  prev(): void {
    this.currentIndex.update((i) => (i > 0 ? i - 1 : this.fotos().length - 1));
  }

  next(): void {
    this.currentIndex.update((i) => (i < this.fotos().length - 1 ? i + 1 : 0));
  }

  openFullscreen(index: number): void {
    this.currentIndex.set(index);
    this.fullscreen.set(true);
  }

  closeFullscreen(): void {
    this.fullscreen.set(false);
  }
}
