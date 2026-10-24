import { TestBed } from '@angular/core/testing';
import { PageService } from './page.service';
import { PopupService } from '@kmd/design-system/ui/popup/popup.service';

describe('PageService', () => {
  let originalUrl: string;

  const setup = (search: string) => {
    history.replaceState(null, '', location.pathname + search);
    TestBed.configureTestingModule({});
    return {
      page: TestBed.inject(PageService),
      popup: TestBed.inject(PopupService)
    };
  };

  beforeEach(() => (originalUrl = location.href));
  afterEach(() => history.replaceState(null, '', originalUrl));

  it('opens the About page from a ?page=about link', () => {
    const { page, popup } = setup('?page=about&lang=pl');
    expect(page.about()).toBe(true);
    page.initFromUrl();
    expect(popup.config()?.id).toBe('about');
  });

  it('adds ?page=about and opens popup when opened', () => {
    const { page, popup } = setup('?state=super');
    page.openAbout();
    expect(page.about()).toBe(true);
    expect(popup.config()?.id).toBe('about');
    expect(new URLSearchParams(location.search).get('page')).toBe('about');
    expect(new URLSearchParams(location.search).get('state')).toBe('super');
  });

  it('removes the parameter and closes popup when closed', () => {
    const { page, popup } = setup('?page=about&view=walker');
    page.initFromUrl();
    expect(popup.config()?.id).toBe('about');
    page.closeAbout();
    expect(page.about()).toBe(false);
    expect(popup.config()).toBeNull();
    expect(location.search).toBe('?view=walker');
  });
});
