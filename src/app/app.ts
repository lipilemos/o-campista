import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ConfirmDialogComponent } from './components/confirm-dialog/confirm-dialog.component';
import { LoadingComponent } from './components/loading/loading.component';
import { OfflineIndicatorComponent } from './components/offline-indicator/offline-indicator.component';
import { ToastComponent } from './components/toast/toast.component';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    LoadingComponent,
    OfflineIndicatorComponent,
    ToastComponent,
    ConfirmDialogComponent,
  ],
  templateUrl: './app.html',
})
export class App {}
