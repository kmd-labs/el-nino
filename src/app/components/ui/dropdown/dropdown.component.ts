import {
  Component,
  ElementRef,
  HostListener,
  computed,
  inject,
  input,
  output,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Check, ChevronDown } from 'lucide-angular';
import { ButtonComponent, ButtonVariant } from '../button/button.component';
import { DropdownOption } from './dropdown.model';

@Component({
  selector: 'app-dropdown',
  standalone: true,
  imports: [CommonModule, ButtonComponent, LucideAngularModule],
  templateUrl: './dropdown.component.html',
  styleUrl: './dropdown.component.scss',
  host: { '[class.dropdown-host--full]': 'fullWidth()' }
})
export class DropdownComponent<T = string> {
  private hostRef = inject(ElementRef<HTMLElement>);

  readonly options = input<DropdownOption<T>[]>([]);
  readonly value = input<T | undefined>(undefined);
  readonly label = input<string | undefined>(undefined);
  readonly icon = input<any>(null);
  readonly variant = input<ButtonVariant>('ghost');
  readonly ariaLabel = input<string>('');
  readonly align = input<'left' | 'right'>('left');
  readonly direction = input<'down' | 'up'>('down');
  readonly fullWidth = input<boolean>(false);

  readonly valueChange = output<T>();

  readonly isOpen = signal(false);

  readonly chevronDownIcon = ChevronDown;
  readonly checkIcon = Check;

  readonly selectedOption = computed<DropdownOption<T> | undefined>(() => {
    const opts = this.options();
    if (!opts.length) return undefined;
    const cur = this.value();
    return opts.find(o => o.value === cur) ?? opts[0];
  });

  readonly triggerText = computed(() => {
    const explicit = this.label();
    if (explicit !== undefined) return explicit;
    const opt = this.selectedOption();
    if (!opt) return '';
    return opt.shortLabel ?? opt.label;
  });

  toggle() {
    this.isOpen.update(v => !v);
  }

  close() {
    this.isOpen.set(false);
  }

  select(opt: DropdownOption<T>) {
    this.valueChange.emit(opt.value);
    this.close();
  }

  @HostListener('document:pointerdown', ['$event'])
  onDocumentPointerDown(event: PointerEvent) {
    if (!this.isOpen()) return;
    const target = event.target as Node | null;
    if (target && !this.hostRef.nativeElement.contains(target)) {
      this.close();
    }
  }

  @HostListener('document:keydown.escape')
  onEscape() {
    if (this.isOpen()) {
      this.close();
    }
  }
}
