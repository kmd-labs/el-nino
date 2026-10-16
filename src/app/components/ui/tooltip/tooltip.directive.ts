import {
  Directive,
  ElementRef,
  HostListener,
  Input,
  OnDestroy,
  inject
} from '@angular/core';
import { TooltipPlacement, TooltipService } from './tooltip.service';

@Directive({
  selector: '[appTooltip]',
  standalone: true
})
export class TooltipDirective implements OnDestroy {
  @Input('appTooltip') tooltipText: string | null | undefined = null;
  @Input() tooltipPlacement: 'auto' | TooltipPlacement = 'auto';

  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly tooltip = inject(TooltipService);

  private holdTimer: ReturnType<typeof setTimeout> | null = null;
  private startX = 0;
  private startY = 0;
  private longPressTriggered = false;

  private resolvePlacement(rect: DOMRect, preferTop = false): { x: number; y: number; placement: TooltipPlacement } {
    const x = rect.left + rect.width / 2;
    let placement: TooltipPlacement;
    if (this.tooltipPlacement !== 'auto') {
      placement = this.tooltipPlacement;
    } else if (preferTop) {
      placement = rect.top > 56 ? 'top' : 'bottom';
    } else {
      placement = rect.bottom > window.innerHeight - 90 ? 'top' : 'bottom';
    }
    const y = placement === 'top' ? rect.top - 8 : rect.bottom + 8;
    return { x, y, placement };
  }

  @HostListener('pointerenter', ['$event'])
  onPointerEnter(e: PointerEvent) {
    if (e.pointerType !== 'mouse' || !this.tooltipText) return;
    const rect = this.el.nativeElement.getBoundingClientRect();
    const { x, y, placement } = this.resolvePlacement(rect, false);
    this.tooltip.show(this.tooltipText, x, y, placement);
  }

  @HostListener('pointerleave', ['$event'])
  onPointerLeave(e: PointerEvent) {
    if (e.pointerType === 'mouse') {
      this.tooltip.hide();
    } else {
      this.clearHoldTimer();
    }
  }

  @HostListener('pointerdown', ['$event'])
  onPointerDown(e: PointerEvent) {
    if (e.pointerType === 'mouse') {
      this.tooltip.hide();
      return;
    }
    if (!this.tooltipText) return;

    this.longPressTriggered = false;
    this.startX = e.clientX;
    this.startY = e.clientY;
    this.clearHoldTimer();

    this.holdTimer = setTimeout(() => {
      this.holdTimer = null;
      if (!this.tooltipText) return;
      this.longPressTriggered = true;
      const rect = this.el.nativeElement.getBoundingClientRect();
      const { x, y, placement } = this.resolvePlacement(rect, true);
      this.tooltip.show(this.tooltipText, x, y, placement, 1800);
    }, 420);
  }

  @HostListener('pointermove', ['$event'])
  onPointerMove(e: PointerEvent) {
    if (this.holdTimer !== null) {
      const dist = Math.hypot(e.clientX - this.startX, e.clientY - this.startY);
      if (dist > 10) {
        this.clearHoldTimer();
      }
    }
  }

  @HostListener('pointerup')
  @HostListener('pointercancel')
  onPointerUp() {
    this.clearHoldTimer();
  }

  @HostListener('contextmenu', ['$event'])
  onContextMenu(e: Event) {
    if (this.longPressTriggered) {
      e.preventDefault();
    }
  }

  @HostListener('click', ['$event'])
  onClick(e: MouseEvent) {
    if (this.longPressTriggered) {
      this.longPressTriggered = false;
      e.preventDefault();
      e.stopImmediatePropagation();
      return;
    }
    this.tooltip.hide();
  }

  ngOnDestroy() {
    this.clearHoldTimer();
  }

  private clearHoldTimer() {
    if (this.holdTimer !== null) {
      clearTimeout(this.holdTimer);
      this.holdTimer = null;
    }
  }
}
