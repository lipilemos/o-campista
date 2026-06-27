import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NetworkStatusService } from '../../core/services/network-status.service';

@Component({
  selector: 'app-offline-indicator',
  templateUrl: './offline-indicator.component.html',
  styleUrls: ['./offline-indicator.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OfflineIndicatorComponent {
  networkStatus = inject(NetworkStatusService);
}
