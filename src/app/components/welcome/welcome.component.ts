import { Component, inject } from '@angular/core';
import { I18nService } from '../../core/i18n/i18n.service';
import { Lang } from '../../core/i18n/i18n.types';
import { FlagComponent } from '../ui/flag/flag.component';

/** Start screen over the (already running) globe: pick English, Spanish or Polish. */
@Component({
  selector: 'app-welcome',
  standalone: true,
  imports: [FlagComponent],
  templateUrl: './welcome.component.html',
  styleUrl: './welcome.component.scss'
})
export class WelcomeComponent {
  i18n = inject(I18nService);

  pick(lang: Lang) {
    this.i18n.choose(lang);
  }
}
