import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-termos',
  imports: [RouterLink],
  templateUrl: './termos.component.html',
  styleUrl: './termos.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TermosComponent {}
