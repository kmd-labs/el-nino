import { Injectable, signal } from '@angular/core';

export type TooltipPlacement = 'top' | 'bottom';

@Injectable({
  providedIn: 'root'
})
export class TooltipService {
  readonly text = signal<string>('');
  readonly x = signal<number>(0);
  readonly y = signal<number>(0);
  readonly placement = signal<TooltipPlacement>('bottom');
  readonly visible = signal<boolean>(false);

  private autoHideTimer: ReturnType<typeof setTimeout> | null = null;

  show(text: string, x: number, y: number, placement: TooltipPlacement = 'bottom', autoHideMs = 0) {
    if (!text) {
      this.hide();
      return;
    }
    if (this.autoHideTimer !== null) {
      clearTimeout(this.autoHideTimer);
      this.autoHideTimer = null;
    }

    const padX = Math.min(110, Math.max(48, text.length * 3.6));
    const clampedX = Math.max(padX, Math.min(window.innerWidth - padX, x));
    const clampedY = Math.max(12, Math.min(window.innerHeight - 12, y));

    this.text.set(text);
    this.x.set(clampedX);
    this.y.set(clampedY);
    this.placement.set(placement);
    this.visible.set(true);

    if (autoHideMs > 0) {
      this.autoHideTimer = setTimeout(() => {
        this.autoHideTimer = null;
        this.hide();
      }, autoHideMs);
    }
  }

  hide() {
    if (this.autoHideTimer !== null) {
      clearTimeout(this.autoHideTimer);
      this.autoHideTimer = null;
    }
    this.visible.set(false);
  }
}
