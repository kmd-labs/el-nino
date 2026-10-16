import { Injectable, signal } from '@angular/core';
import { PopupConfig, PopupText } from './popup.model';

/**
 * Design System Popup API service.
 * Allows any feature or service to open a blurred-backdrop modal dialog with a title,
 * description, projected Angular component, and footer action buttons.
 */
@Injectable({ providedIn: 'root' })
export class PopupService {
  private readonly activeConfig = signal<PopupConfig | null>(null);

  readonly config = this.activeConfig.asReadonly();
  readonly isOpen = () => this.activeConfig() !== null;

  open<T = unknown>(config: PopupConfig<T>) {
    this.activeConfig.set(config as PopupConfig);
  }

  close() {
    const current = this.activeConfig();
    if (!current) return;
    this.activeConfig.set(null);
    current.onClose?.();
  }

  resolveText(val: PopupText | undefined): string {
    if (!val) return '';
    if (typeof val === 'function') return val();
    return val;
  }
}
