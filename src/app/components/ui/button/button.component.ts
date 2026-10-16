import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TooltipDirective } from '../tooltip/tooltip.directive';

export type ButtonVariant = 'default' | 'ghost' | 'preset' | 'toggle' | 'play';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule, TooltipDirective],
  templateUrl: './button.component.html',
  styleUrl: './button.component.scss'
})
export class ButtonComponent {
  @Input() variant: ButtonVariant = 'default';
  @Input() active = false;
  @Input() hot = false;
  @Input() disabled = false;
  @Input() iconOnly = false;
  @Input() ariaLabel: string | null = null;
  @Input() titleText: string | null = null;
  @Input() extraClass = '';

  @Output() btnClick = new EventEmitter<MouseEvent>();

  get buttonClasses(): string {
    return [
      'btn',
      `btn--${this.variant}`,
      this.active ? 'btn--active' : '',
      this.hot ? 'btn--hot' : '',
      this.iconOnly ? 'btn--icon' : '',
      this.extraClass
    ].filter(Boolean).join(' ');
  }

  handleClick(event: MouseEvent) {
    if (!this.disabled) {
      this.btnClick.emit(event);
    }
  }
}
