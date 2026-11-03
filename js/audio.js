/* Tiny synthesized sounds (Web Audio), no audio files needed. */
window.MouseAudio = (function () {
  'use strict';
  let ctx = null;
  let muted = false;

  function ac() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tone(freq, dur, type, vol, when, slideTo) {
    const c = ac();
    if (!c || muted) return;
    const t0 = c.currentTime + (when || 0);
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, t0);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol || 0.12, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g).connect(c.destination);
    o.start(t0);
    o.stop(t0 + dur + 0.05);
  }

  return {
    unlock() { ac(); },
    setMuted(m) { muted = !!m; },
    isMuted() { return muted; },
    click() { tone(660, 0.07, 'square', 0.05); },
    remove() { tone(330, 0.08, 'square', 0.05); },
    step() { tone(440, 0.14, 'triangle', 0.12, 0, 540); },
    turn() { tone(560, 0.12, 'triangle', 0.1, 0, 400); },
    bump() { tone(150, 0.3, 'sawtooth', 0.16, 0, 55); },
    win() {
      [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.18, 'triangle', 0.14, i * 0.12));
      tone(1047, 0.6, 'sine', 0.1, 0.5);
    },
  };
})();
