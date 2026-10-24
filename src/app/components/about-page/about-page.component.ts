import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, ExternalLink, Github, Linkedin } from 'lucide-angular';
import { I18nService } from '../../core/i18n/i18n.service';
import { TEAM } from '../../core/constants/team';

/** "About us": the team behind the app, rendered inside the modal popup. */
@Component({
  selector: 'app-about-page',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './about-page.component.html',
  styleUrl: './about-page.component.scss'
})
export class AboutPageComponent {
  readonly i18n = inject(I18nService);

  readonly team = TEAM;
  readonly linkedinIcon = Linkedin;
  readonly githubIcon = Github;
  readonly refIcon = ExternalLink;
}
