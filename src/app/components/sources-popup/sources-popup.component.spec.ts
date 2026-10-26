import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SourcesPopupComponent } from './sources-popup.component';
import { I18nService } from '../../core/i18n/i18n.service';
import { PageService } from '../../core/services/page.service';
import { PopupService } from '@kmd/design-system/ui/popup/popup.service';

describe('SourcesPopupComponent', () => {
  let fixture: ComponentFixture<SourcesPopupComponent>;
  let component: SourcesPopupComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SourcesPopupComponent],
      providers: [I18nService, PageService, PopupService]
    }).compileComponents();

    fixture = TestBed.createComponent(SourcesPopupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders data sources list, methodology, and attribution', () => {
    const el: HTMLElement = fixture.nativeElement;
    const cards = el.querySelectorAll('.sources-popup__card');
    expect(cards.length).toBeGreaterThan(0);
    expect(el.querySelector('#sources-methodology-title')).toBeTruthy();
    expect(el.querySelector('.sources-popup__built')).toBeTruthy();
  });
});
