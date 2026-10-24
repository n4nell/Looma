// Looma UI Sound System (Web Audio API Synthesizer)
// Provides instant, cheerful audio feedback for all user interactions.

let audioCtx = null;
const SOUND_STORAGE_KEY = 'looma_sound_enabled';

function getAudioContext() {
  if (typeof window === 'undefined') return null;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;

  if (!audioCtx) {
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export function isSoundEnabled() {
  if (typeof window === 'undefined') return true;
  try {
    const stored = localStorage.getItem(SOUND_STORAGE_KEY);
    return stored === null ? true : stored === 'true';
  } catch {
    return true;
  }
}

export function setSoundEnabled(enabled) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SOUND_STORAGE_KEY, String(enabled));
  } catch {}
}

/**
 * Play a synthesizer sound effect
 * @param {'click' | 'pop' | 'like' | 'bounce' | 'coin' | 'chime' | 'tap' | 'woosh'} type
 */
export function playSound(type = 'click') {
  if (!isSoundEnabled()) return;

  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    if (type === 'click') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(520, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(860, ctx.currentTime + 0.045);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.005, ctx.currentTime + 0.045);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } else if (type === 'tap') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(400, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(280, ctx.currentTime + 0.035);
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.005, ctx.currentTime + 0.035);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.04);
    } else if (type === 'pop') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      const startFreq = 340 + Math.random() * 80;
      osc.frequency.setValueAtTime(startFreq, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(690, ctx.currentTime + 0.065);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.005, ctx.currentTime + 0.065);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.07);
    } else if (type === 'like') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.14, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.13);
    } else if (type === 'bounce') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(540, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.11);
    } else if (type === 'coin') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(987.77, ctx.currentTime);
      osc.frequency.setValueAtTime(1318.51, ctx.currentTime + 0.07);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.23);
    } else if (type === 'chime') {
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.05);
        gain.gain.setValueAtTime(0.09, ctx.currentTime + idx * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.05 + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.05);
        osc.stop(ctx.currentTime + idx * 0.05 + 0.26);
      });
    }
  } catch {
    // Ignore audio context autoplay restriction
  }
}

/**
 * Attaches a global capture-phase click listener to the window so that
 * EVERY click on interactive elements (buttons, links, inputs, tabs, etc.)
 * immediately produces a satisfying sound effect.
 */
export function setupGlobalClickSound() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return () => {};

  let lastClickTime = 0;

  const handleGlobalClick = (event) => {
    // Debounce very rapid multi-trigger (e.g. nested click events)
    const now = performance.now();
    if (now - lastClickTime < 35) return;

    if (!isSoundEnabled()) return;

    const target = event.target;
    if (!target || !(target instanceof Element)) return;

    // Check if target or any ancestor is an interactive element
    const interactive = target.closest(
      'button, a, input[type="button"], input[type="submit"], input[type="checkbox"], input[type="radio"], input[type="color"], select, [role="button"], [role="tab"], [role="switch"], [role="menuitem"], summary, .cursor-pointer'
    );

    if (interactive) {
      lastClickTime = now;
      // Differentiate sound type slightly by element type
      const isLike = interactive.querySelector?.('svg.lucide-heart') || interactive.getAttribute?.('aria-label')?.includes('like');
      const isDelete = interactive.querySelector?.('svg.lucide-trash-2') || interactive.querySelector?.('svg.lucide-trash');
      const isTab = interactive.getAttribute?.('role') === 'tab' || interactive.classList?.contains('rounded-full');

      if (isLike) {
        playSound('like');
      } else if (isDelete) {
        playSound('pop');
      } else if (isTab) {
        playSound('pop');
      } else {
        playSound('click');
      }
    }
  };

  // Use capture phase so we catch all clicks even if stopPropagation is called later
  window.addEventListener('click', handleGlobalClick, true);

  return () => {
    window.removeEventListener('click', handleGlobalClick, true);
  };
}
