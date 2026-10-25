import { TestBed } from '@angular/core/testing';
import { AnalyticsService, classifyLink } from './analytics.service';

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

describe('classifyLink', () => {
  const own = 'kmd-labs.github.io';

  it('reports LinkedIn and GitHub profiles as profile clicks', () => {
    expect(classifyLink('https://www.linkedin.com/in/leszek-michalak-422745b6/', own))
      .toEqual({ event: 'profile-click', data: { network: 'linkedin', person: 'leszek-michalak-422745b6' } });
    expect(classifyLink('https://github.com/adriankulik', own))
      .toEqual({ event: 'profile-click', data: { network: 'github', person: 'adriankulik' } });
  });

  it('names known data sources and falls back to the host', () => {
    expect(classifyLink('https://www.ncei.noaa.gov/products/optimum-interpolation-sst', own)?.data)
      .toEqual({ source: 'noaa', host: 'ncei.noaa.gov' });
    expect(classifyLink('https://pl.wikipedia.org/wiki/El_Ni%C3%B1o', own)?.data['source']).toBe('wikipedia');
    expect(classifyLink('https://github.com/kmd-labs/el-nino', own)?.data)
      .toEqual({ source: 'github.com', host: 'github.com' });
  });

  it('ignores internal and non-http links', () => {
    expect(classifyLink('https://kmd-labs.github.io/el-nino/?page=about', own)).toBeNull();
    expect(classifyLink('mailto:hello@example.com', own)).toBeNull();
  });
});
