import { Component, inject } from '@angular/core';
import { LoadingService } from '../../core/services/loading.service';

@Component({
  selector: 'app-loading',
  styleUrls: ['./loading.component.scss'],
  templateUrl: './loading.component.html',
})
export class LoadingComponent {
  loadingService = inject(LoadingService);
}
