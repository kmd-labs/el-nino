import { TestBed } from '@angular/core/testing';
import { EnsoStateService } from './enso-state.service';
import { ShareLinkService } from './share-link.service';

describe('ShareLinkService', () => {
  let originalUrl: string;

  const setup = (search: string) => {
    history.replaceState(null, '', location.pathname + search);
    TestBed.configureTestingModule({});
    const share = TestBed.inject(ShareLinkService);
    const state = TestBed.inject(EnsoStateService);
    return { share, state };
  };

  beforeEach(() => (originalUrl = location.href));
  afterEach(() => history.replaceState(null, '', originalUrl));

  it('applies a preset and view from the URL and skips the intro', () => {
    const { state } = setup('?state=super&view=walker');
    expect(state.view()).toBe('walker');
    expect(state.sTarget()).toBe(2.6);
    expect(state.sCur()).toBe(2.6);

    state.beginExperience();
    expect(state.isPlaying()).toBe(false);
  });

  it('clamps numeric strengths to the slider range', () => {
    const { state } = setup('?state=9');
    expect(state.sTarget()).toBe(3);
  });

  it('ignores invalid parameters and keeps the defaults', () => {
    const { state } = setup('?state=hot&view=moon');
    expect(state.view()).toBe('globe');
    expect(state.sTarget()).toBe(-1.8);

    state.beginExperience();
    expect(state.isPlaying()).toBe(true);
  });

  it('builds a link with preset names, rounded values and no defaults', () => {
    const { share, state } = setup('?utm_source=linkedin');

    state.setView('impacts');
    state.setPreset(-1.6);
    expect(new URL(share.buildUrl()).search).toBe('?view=impacts&state=nina');

    state.setView('globe');
    state.setStrengthTarget(0.8567);
    expect(new URL(share.buildUrl()).search).toBe('?state=0.86');

    state.setStrengthTarget(1.4);
    expect(new URL(share.buildUrl()).search).toBe('');
  });
});
