import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LoadingComponent } from './components/loading/loading.component';
import { OfflineIndicatorComponent } from './components/offline-indicator/offline-indicator.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, LoadingComponent, OfflineIndicatorComponent],
  templateUrl: './app.html',
})
export class App {}
