import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TooltipService } from './tooltip.service';

@Component({
  selector: 'app-tooltip',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tooltip.component.html',
  styleUrl: './tooltip.component.scss'
})
export class TooltipComponent {
  readonly tooltip = inject(TooltipService);
}
