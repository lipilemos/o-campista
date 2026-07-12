import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { OnboardingService } from '../../core/services/onboarding.service';
import { TranslatePipe } from '../../core/pipes/translate.pipe';

@Component({
  selector: 'app-onboarding',
  imports: [TranslatePipe],
  templateUrl: './onboarding.component.html',
  styleUrl: './onboarding.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(keydown.escape)': 'onEscape()',
    '(keydown.arrowright)': 'onArrowRight()',
    '(keydown.arrowleft)': 'onArrowLeft()',
  },
})
export class OnboardingComponent {
  protected service = inject(OnboardingService);

  protected onEscape(): void {
    if (this.service.visivel()) this.service.pular();
  }

  protected onArrowRight(): void {
    if (this.service.visivel()) this.service.proximo();
  }

  protected onArrowLeft(): void {
    if (this.service.visivel()) this.service.anterior();
  }
}
