import { Signal, TemplateRef, Type } from '@angular/core';
import { ButtonVariant } from '../button/button.component';

export type PopupSize = 'sm' | 'md' | 'lg';
export type PopupText = string | Signal<string> | (() => string);

export interface PopupAction {
  label: PopupText;
  variant?: ButtonVariant;
  hot?: boolean;
  disabled?: boolean;
  /** Whether clicking the button automatically closes the popup (default: true). */
  closeOnClick?: boolean;
  onClick?: () => void;
}

export interface PopupConfig<TComponent = unknown> {
  id?: string;
  title: PopupText;
  subtitle?: PopupText;
  /** Optional text description shown in the popup body. */
  description?: PopupText;
  /** Optional Angular component to project dynamically inside the popup description/body area. */
  component?: Type<TComponent>;
  /** Inputs passed to the projected Angular component. */
  componentInputs?: Record<string, unknown>;
  /** Optional Angular TemplateRef to render inside the popup body. */
  template?: TemplateRef<unknown>;
  /** Optional button actions rendered in the popup footer. */
  actions?: PopupAction[];
  /** Width preset for the popup dialog ('sm' | 'md' | 'lg'). */
  size?: PopupSize;
  /** Callback invoked when the popup is closed. */
  onClose?: () => void;
}
