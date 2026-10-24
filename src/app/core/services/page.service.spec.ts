import { TestBed } from '@angular/core/testing';
import { PageService } from './page.service';

describe('PageService', () => {
  let originalUrl: string;

  const setup = (search: string) => {
    history.replaceState(null, '', location.pathname + search);
    TestBed.configureTestingModule({});
    return TestBed.inject(PageService);
  };

  beforeEach(() => (originalUrl = location.href));
  afterEach(() => history.replaceState(null, '', originalUrl));

  it('opens the About page from a ?page=about link', () => {
    expect(setup('?page=about&lang=pl').about()).toBe(true);
  });

  it('adds ?page=about when opened and keeps other parameters', () => {
    const page = setup('?state=super');
    page.openAbout();
    expect(page.about()).toBe(true);
    expect(new URLSearchParams(location.search).get('page')).toBe('about');
    expect(new URLSearchParams(location.search).get('state')).toBe('super');
  });

  it('removes the parameter when a shared link is closed', () => {
    const page = setup('?page=about&view=walker');
    page.closeAbout();
    expect(page.about()).toBe(false);
    expect(location.search).toBe('?view=walker');
  });
});
