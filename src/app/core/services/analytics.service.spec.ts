import { TestBed } from '@angular/core/testing';
import { AnalyticsService } from './analytics.service';

describe('AnalyticsService', () => {
  it('stays off outside the production host: no script, no tracking calls', () => {
    const track = jasmine.createSpy('track');
    (window as unknown as { umami?: unknown }).umami = { track };
    const analytics = TestBed.inject(AnalyticsService);

    analytics.init();
    analytics.track('cta-click');

    expect(document.querySelector('script[src*="umami"]')).toBeNull();
    expect(track).not.toHaveBeenCalled();
    delete (window as unknown as { umami?: unknown }).umami;
  });
});
