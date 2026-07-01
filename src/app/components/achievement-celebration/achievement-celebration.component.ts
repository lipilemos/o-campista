import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AchievementNotificationService } from '../../core/services/achievement-notification.service';

@Component({
  selector: 'app-achievement-celebration',
  templateUrl: './achievement-celebration.component.html',
  styleUrl: './achievement-celebration.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AchievementCelebrationComponent {
  protected service = inject(AchievementNotificationService);
}
