import { TestBed } from '@angular/core/testing';
import { EnsoStateService } from './enso-state.service';

describe('EnsoStateService', () => {
  let service: EnsoStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EnsoStateService);
  });

  it('should be created and start playing from earliest keyframe s = -1.8', () => {
    expect(service).toBeTruthy();
    expect(service.sCur()).toBe(-1.8);
    expect(service.sTarget()).toBe(-1.8);
    expect(service.isPlaying()).toBe(true);
    expect(service.experienceReady()).toBe(false);
  });

  it('should unlock the animation only when the splash begins the experience', () => {
    service.updateInterpolatedStrength(0.1);
    expect(service.sCur()).toBe(-1.8);

    service.beginExperience();
    expect(service.experienceReady()).toBe(true);

    service.updateCycle(1);
    service.updateInterpolatedStrength(0.1);
    expect(service.sCur()).toBeGreaterThan(-1.8);
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
    expect(service.sTarget()).toBe(-1.8);
  });

  it('should speed-ramp playback: slow at the start, fast in the middle, slow at the end', () => {
    service.beginExperience();
    const dt = 0.05;
    const baseStep = (3.2 / 12) * dt;

    service.updateCycle(dt);
    const firstStep = service.sTarget() - (-1.8);
    expect(firstStep).toBeLessThan(baseStep * 0.5);

    let elapsed = dt;
    while (service.isPlaying() && elapsed < 20) {
      service.updateCycle(dt);
      elapsed += dt;
    }

    expect(elapsed).toBeGreaterThan(11.5);
    expect(elapsed).toBeLessThan(12.5);
    expect(service.sTarget()).toBe(1.4);
  });

  const playThrough = () => {
    let elapsed = 0;
    while (service.isPlaying() && elapsed < 100) {
      service.updateCycle(0.05);
      elapsed += 0.05;
    }
    return elapsed;
  };

  it('should play three times as slow as the intro after the user presses play, scaled by the speed', () => {
    service.beginExperience();
    playThrough();

    service.startPlaying();
    expect(playThrough()).toBeCloseTo(36, 0);

    service.setPlaybackSpeed(2);
    service.startPlaying();
    expect(playThrough()).toBeCloseTo(18, 0);

    service.setPlaybackSpeed(0.5);
    service.startPlaying();
    expect(playThrough()).toBeCloseTo(72, 0);
  });

  it('should keep the playhead when the speed changes mid-play', () => {
    service.beginExperience();
    playThrough();
    service.startPlaying();
    for (let i = 0; i < 100; i++) service.updateCycle(0.05);
    const before = service.sTarget();

    service.setPlaybackSpeed(2);
    service.updateCycle(0.001);
    expect(service.sTarget()).toBeCloseTo(before, 2);
  });

  it('should ignore unsupported speeds', () => {
    service.setPlaybackSpeed(3);
    expect(service.playbackSpeed()).toBe(1);
  });
});
