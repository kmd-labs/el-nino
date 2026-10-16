import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonComponent } from '../button/button.component';
import { TimelineMarker } from './timeline-slider.model';

/**
 * Design System Timeline Slider / Scrollbar Component.
 * Displays clickable event markers on top of a gradient range track with
 * an optional action slot (e.g. Play/Pause button) directly to the right of the scrollbar.
 */
@Component({
  selector: 'app-timeline-slider',
  standalone: true,
  imports: [CommonModule, ButtonComponent],
  templateUrl: './timeline-slider.component.html',
  styleUrl: './timeline-slider.component.scss'
})
export class TimelineSliderComponent {
  readonly min = input<number>(-2);
  readonly max = input<number>(3);
  readonly step = input<number>(0.05);
  readonly value = input.required<number>();
  readonly markers = input<TimelineMarker[]>([]);
  readonly thumbColor = input<string | undefined>(undefined);
  readonly ariaLabel = input<string>('');

  readonly valueChange = output<number>();
  readonly markerClick = output<TimelineMarker>();

  markerPct(m: TimelineMarker): number {
    const span = this.max() - this.min();
    if (span <= 0) return 0;
    return ((m.value - this.min()) / span) * 100;
  }

  onRangeInput(event: Event) {
    const next = parseFloat((event.target as HTMLInputElement).value);
    this.valueChange.emit(next);
  }

  onMarkerSelect(m: TimelineMarker) {
    this.markerClick.emit(m);
  }
}
