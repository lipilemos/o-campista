import { Injectable, signal } from '@angular/core';
import { Conquista } from '../models/conquista.model';

@Injectable({ providedIn: 'root' })
export class AchievementNotificationService {
  readonly current = signal<Conquista | null>(null);

  private queue: Conquista[] = [];
  private timer?: ReturnType<typeof setTimeout>;

  show(conquista: Conquista): void {
    this.queue.push(conquista);
    if (!this.current()) this.next();
  }

  showMultiple(conquistas: Conquista[]): void {
    conquistas.forEach((c) => this.queue.push(c));
    if (!this.current()) this.next();
  }

  dismiss(): void {
    clearTimeout(this.timer);
    this.current.set(null);
    // small delay so the exit animation plays before showing the next
    setTimeout(() => this.next(), 300);
  }

  private next(): void {
    const item = this.queue.shift();
    if (!item) return;
    this.current.set(item);
    this.timer = setTimeout(() => this.dismiss(), 5000);
  }
}
