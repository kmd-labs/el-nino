import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SharePopupComponent } from './share-popup.component';
import { I18nService } from '../../core/i18n/i18n.service';
import { EnsoStateService } from '../../core/services/enso-state.service';
import { ShareLinkService } from '../../core/services/share-link.service';
import { signal } from '@angular/core';

describe('SharePopupComponent', () => {
  let component: SharePopupComponent;
  let fixture: ComponentFixture<SharePopupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SharePopupComponent],
      providers: [
        I18nService,
        {
          provide: EnsoStateService,
          useValue: {
            category: signal({ name: 'Neutral', key: 'neutral' }),
            view: signal('globe')
          }
        },
        {
          provide: ShareLinkService,
          useValue: {
            currentDate: signal('2023-11-15'),
            buildUrl: (mode: string) => `https://example.com/?${mode}=val`
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SharePopupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and generate QR code SVG for canonical URL', async () => {
    expect(component).toBeTruthy();
    await fixture.whenStable();
    expect(component.appUrl()).toBe('https://kmd-labs.github.io/el-nino/');
    expect(component.qrSvg()).toBeTruthy();
  });

  it('should compute date and state labels and urls', () => {
    expect(component.stateLabel()).toBe('Neutral');
    expect(component.stateUrl()).toBe('https://example.com/?state=val');
    expect(component.dateUrl()).toBe('https://example.com/?date=val');
    expect(component.dateLabel()).toContain('2023');
  });

  it('should set copiedKey on copyText', async () => {
    spyOn(navigator.clipboard, 'writeText').and.returnValue(Promise.resolve());
    await component.copyText('https://example.com', 'app');
    expect(component.copiedKey()).toBe('app');
  });
});
