import {
  Component,
  EventEmitter,
  HostListener,
  Input,
  Output,
  TemplateRef,
  Type,
  inject
} from '@angular/core';
import { CommonModule, NgComponentOutlet } from '@angular/common';
import { LucideAngularModule, X } from 'lucide-angular';
import { ButtonComponent } from '../button/button.component';
import { PopupAction, PopupSize } from './popup.model';
import { PopupService } from './popup.service';
import { I18nService } from '../../../core/i18n/i18n.service';

/**
 * Design System Popup Component (`<app-popup>`).
 * Can be used as a global host driven by `PopupService` OR declaratively in templates
 * with `<ng-content>` projection, dynamic `component` projection, and `actions`.
 */
@Component({
  selector: 'app-popup',
  standalone: true,
  imports: [CommonModule, NgComponentOutlet, ButtonComponent, LucideAngularModule],
  templateUrl: './popup.component.html',
  styleUrl: './popup.component.scss'
})
export class PopupComponent {
  readonly popupService = inject(PopupService);
  readonly i18n = inject(I18nService);
  readonly closeIcon = X;

  /** When true, binds automatically to `PopupService.config()`. */
  @Input() useService = true;

  /** Declarative inputs when used standalone in a template */
  @Input() open = false;
  @Input() title = '';
  @Input() subtitle = '';
  @Input() description = '';
  @Input() component?: Type<unknown>;
  @Input() componentInputs?: Record<string, unknown>;
  @Input() template?: TemplateRef<unknown>;
  @Input() actions: PopupAction[] = [];
  @Input() size: PopupSize = 'md';

  @Output() closed = new EventEmitter<void>();

  get isVisible(): boolean {
    return this.useService ? this.popupService.config() !== null : this.open;
  }

  get activeTitle(): string {
    if (this.useService) {
      return this.popupService.resolveText(this.popupService.config()?.title);
    }
    return this.title;
  }

  get activeSubtitle(): string {
    if (this.useService) {
      return this.popupService.resolveText(this.popupService.config()?.subtitle);
    }
    return this.subtitle;
  }

  get activeDescription(): string {
    if (this.useService) {
      return this.popupService.resolveText(this.popupService.config()?.description);
    }
    return this.description;
  }

  get activeComponent(): Type<unknown> | undefined {
    return this.useService ? this.popupService.config()?.component : this.component;
  }

  get activeComponentInputs(): Record<string, unknown> | undefined {
    return this.useService ? this.popupService.config()?.componentInputs : this.componentInputs;
  }

  get activeTemplate(): TemplateRef<unknown> | undefined {
    return this.useService ? this.popupService.config()?.template : this.template;
  }

  get activeActions(): PopupAction[] {
    return this.useService ? (this.popupService.config()?.actions ?? []) : this.actions;
  }

  get activeSize(): PopupSize {
    return this.useService ? (this.popupService.config()?.size ?? 'md') : this.size;
  }

  handleClose() {
    if (this.useService) {
      this.popupService.close();
    } else {
      this.closed.emit();
    }
  }

  handleActionClick(action: PopupAction) {
    action.onClick?.();
    if (action.closeOnClick !== false) {
      this.handleClose();
    }
  }

  onBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      this.handleClose();
    }
  }

  @HostListener('document:keydown.escape')
  onEscape() {
    if (this.isVisible) {
      this.handleClose();
    }
  }
}
