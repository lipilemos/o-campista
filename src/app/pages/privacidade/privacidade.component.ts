import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-privacidade',
  imports: [RouterLink],
  templateUrl: './privacidade.component.html',
  styleUrl: './privacidade.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PrivacidadeComponent {}
