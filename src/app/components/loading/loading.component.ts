import { Component, inject } from '@angular/core';
import { LoadingService } from '../../core/services/loading.service';
import { TranslatePipe } from '../../core/pipes/translate.pipe';

@Component({
  selector: 'app-loading',
  imports: [TranslatePipe],
  styleUrls: ['./loading.component.scss'],
  templateUrl: './loading.component.html',
})
export class LoadingComponent {
  loadingService = inject(LoadingService);
}
