import { Injectable, signal } from '@angular/core';

export type Locale = 'pt-BR' | 'en-US';

@Injectable({
  providedIn: 'root',
})
export class I18nService {
  readonly locale = signal<Locale>(this.getInitialLocale());
  readonly version = signal(0);

  private translations: Record<string, string> = {};
  private loaded = false;

  async init(): Promise<void> {
    if (this.loaded) return;
    await this.loadTranslations(this.locale());
    this.loaded = true;
  }

  async setLocale(locale: Locale): Promise<void> {
    this.locale.set(locale);
    localStorage.setItem('ocampista-locale', locale);
    await this.loadTranslations(locale);
    this.version.update((v) => v + 1);
  }

  t(key: string, fallback?: string): string {
    return this.translations[key] ?? fallback ?? key;
  }

  private async loadTranslations(locale: Locale): Promise<void> {
    try {
      const response = await fetch(`/i18n/${locale}.json`);
      this.translations = await response.json();
    } catch {
      this.translations = {};
    }
  }

  private getInitialLocale(): Locale {
    const saved = localStorage.getItem('ocampista-locale') as Locale | null;
    if (saved) return saved;

    const browserLang = navigator.language;
    return browserLang.startsWith('pt') ? 'pt-BR' : 'en-US';
  }
}
