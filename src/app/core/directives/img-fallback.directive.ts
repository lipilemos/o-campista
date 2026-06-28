import { Directive, ElementRef, HostListener, inject, input } from '@angular/core';

@Directive({
  selector: 'img[appImgFallback]',
})
export class ImgFallbackDirective {
  readonly appImgFallback = input<string>('');

  private elementRef = inject(ElementRef<HTMLImageElement>);

  @HostListener('error')
  onError() {
    const fallback = this.appImgFallback();
    const el = this.elementRef.nativeElement;
    if (fallback) {
      el.src = fallback;
    } else {
      el.style.display = 'none';
    }
  }
}
