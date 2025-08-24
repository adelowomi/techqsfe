import '@testing-library/jest-dom';

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  root = null;
  rootMargin = '0px';
  thresholds = [0];
  
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() { return []; }
} as any;

// Mock Animation API
global.Animation = class Animation {
  currentTime = 0;
  effect = null;
  id = '';
  oncancel = null;
  onfinish = null;
  onremove = null;
  playState = 'idle' as AnimationPlayState;
  playbackRate = 1;
  ready = Promise.resolve(this);
  replaceState = 'active' as AnimationReplaceState;
  startTime = 0;
  timeline = null;
  
  constructor() {}
  play() {}
  cancel() {}
  finish() {}
  pause() {}
  reverse() {}
  updatePlaybackRate() {}
  persist() {}
  commitStyles() {}
  addEventListener() {}
  removeEventListener() {}
  dispatchEvent() { return true; }
  finished = Promise.resolve(this);
} as any;

// Mock KeyframeEffect
global.KeyframeEffect = class KeyframeEffect {
  composite = 'replace' as CompositeOperation;
  iterationComposite = 'replace' as IterationCompositeOperation;
  pseudoElement = null;
  target = null;
  
  constructor() {}
  getKeyframes() { return []; }
  setKeyframes() {}
  getTiming() { return {}; }
  getComputedTiming() { return {}; }
  updateTiming() {}
} as any;

// Mock requestAnimationFrame
global.requestAnimationFrame = (callback: FrameRequestCallback) => {
  return setTimeout(callback, 16);
};

global.cancelAnimationFrame = (id: number) => {
  clearTimeout(id);
};