import { TestBed } from '@angular/core/testing';
import { EnsoStateService } from './enso-state.service';

describe('EnsoStateService', () => {
  let service: EnsoStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EnsoStateService);
  });

  it('should be created and start playing from earliest keyframe s = -1.6', () => {
    expect(service).toBeTruthy();
    expect(service.sCur()).toBe(-1.6);
    expect(service.sTarget()).toBe(-1.6);
    expect(service.isPlaying()).toBe(true);
  });

  it('should allow setting target strength', () => {
    service.sTarget.set(0.5);
    expect(service.sTarget()).toBe(0.5);
  });

  it('should toggle playing state', () => {
    service.togglePlaying();
    expect(service.isPlaying()).toBe(false);
    service.togglePlaying();
    expect(service.isPlaying()).toBe(true);
  });

  it('should resume playing from current playhead when paused mid-cycle', () => {
    service.setStrengthTarget(0.2); // pauses and sets playhead
    expect(service.isPlaying()).toBe(false);
    expect(service.sTarget()).toBe(0.2);

    service.startPlaying();
    expect(service.isPlaying()).toBe(true);
    expect(service.sTarget()).toBe(0.2); // resumes from playhead position
  });

  it('should restart from earliest when at or past NOW', () => {
    service.setStrengthTarget(1.4);
    service.startPlaying();
    expect(service.isPlaying()).toBe(true);
    expect(service.sTarget()).toBe(-1.6);
  });
});
