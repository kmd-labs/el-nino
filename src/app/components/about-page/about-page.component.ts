import { AfterViewInit, Component, ElementRef, HostListener, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, ArrowLeft, Github, Linkedin } from 'lucide-angular';
import { I18nService } from '../../core/i18n/i18n.service';
import { PageService } from '../../core/services/page.service';
import { TEAM } from '../../core/constants/team';

/** "About us": the team behind the app, opened from the KMD logo or the header CTA. */
@Component({
  selector: 'app-about-page',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './about-page.component.html',
  styleUrl: './about-page.component.scss'
})
export class AboutPageComponent implements AfterViewInit {
  i18n = inject(I18nService);
  page = inject(PageService);

  readonly team = TEAM;
  readonly backIcon = ArrowLeft;
  readonly linkedinIcon = Linkedin;
  readonly githubIcon = Github;

  @ViewChild('backBtn') private backBtn?: ElementRef<HTMLButtonElement>;

  ngAfterViewInit() {
    this.backBtn?.nativeElement.focus({ preventScroll: true });
  }

  @HostListener('document:keydown.escape')
  onEscape() {
    this.page.closeAbout();
  }
}
