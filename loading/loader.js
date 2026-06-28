/*!
 * Hanology Liquid Loader
 *
 * A liquid-wave loading animation: the colored logo is incrementally revealed
 * by a rising wavy waterline. The logo image itself stays in place — only the
 * mask on the colored layer moves.
 *
 * Layers (z-order, bottom → top):
 *   - .ld-base  : desaturated logo, always visible (the "ghost")
 *   - .ld-fill  : colored logo, masked by an SVG with a wavy top edge.
 *                 The mask is taller than the wrap (300%) so the wavy edge
 *                 can travel from below the bottom to wholly beyond the top,
 *                 entering and exiting cleanly.
 *
 * The wave is part of the colored ink's shape (its surface), not a separate
 * overlay — so the gray ghost remains visible everywhere above the waterline.
 *
 * Usage:
 *   HanologyLoader.create({ logoUrl: 'logo.svg', size: 'lg', variant: 'route' })
 *   → returns a DOM node. Append anywhere.
 */
(function () {
  // SVG luminance mask: white below the wavy curve (visible), transparent above (hidden).
  // viewBox 0 0 100 300 — wavy edge at y=150 (mid), with 150 units of fill below and
  // 150 units of transparency above. preserveAspectRatio="none" stretches to fit.
  const WAVE_CENTER = 150;
  const DEFAULT_AMPLITUDE = 5;

  function buildWaveMask(amplitude) {
    const peak = WAVE_CENTER - amplitude;
    const valley = WAVE_CENTER + amplitude;
    const halfCycles = 8;
    const w = 100 / halfCycles;
    let path = `M0,${WAVE_CENTER} `;
    for (let i = 0; i < halfCycles; i++) {
      const x0 = i * w;
      const cp1 = (x0 + w / 3).toFixed(2);
      const cp2 = (x0 + (2 * w) / 3).toFixed(2);
      const x2 = (x0 + w).toFixed(2);
      const extreme = i % 2 === 0 ? peak : valley;
      path += `C ${cp1},${extreme} ${cp2},${extreme} ${x2},${WAVE_CENTER} `;
    }
    path += `L 100,300 L 0,300 Z`;
    return `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 300' preserveAspectRatio='none'>` +
      `<path d='${path}' fill='white'/></svg>`;
  }

  const DEFAULT_STOPS = 0;
  const DEFAULT_SWAY_AMP = 30;
  const DEFAULT_MODE = 'progress';
  const DEFAULT_LOW_MARK = 0;
  const DEFAULT_HIGH_MARK = 100;

  // Build rise keyframes with N internal holds. The wave rises through N+1
  // equal segments; at each internal level it holds for `holdPct` of the total
  // duration. stops=0 → smooth rise with no holds.
  //
  // Y travels from lowMark → highMark in both modes. The marks are the begin
  // and end of the rise; setting lowMark===highMark collapses vertical motion
  // to a fixed line (only the sideways sway remains visible).
  //
  // mode='progress': animation-direction is 'normal' (one-way, loops with an
  //   instant reset — like a filling progress bar).
  // mode='spinner': animation-direction is 'alternate' (oscillates back and
  //   forth between the marks).
  //
  // Sway is merged into the same keyframes so it stays synchronized with the
  // rise. The sway direction TURNS at each halt: during segment i the surface
  // travels to the opposite extreme, halts there, then segment i+1 reverses.
  function buildRiseKeyframes(stops, swayAmp, mode, lowMark, highMark, name) {
    const yMin = lowMark;
    const yMax = highMark;
    const yRange = yMax - yMin;
    const holdPct = 6;
    if (stops <= 0) {
      return `@keyframes ${name} { from { --ld-rise-y: ${yMin}%; --ld-sway-x: ${-swayAmp}px; } to { --ld-rise-y: ${yMax}%; --ld-sway-x: ${swayAmp}px; } }`;
    }
    const segCount = stops + 1;
    const totalHold = stops * holdPct;
    const motionSeg = (100 - totalHold) / segCount;
    const level = (i) => yMin + (i * yRange) / segCount;
    const rnd = (n) => Math.round(n * 10) / 10;
    const frames = [];
    let t = 0;
    let sway = -swayAmp;
    frames.push(`  0% { --ld-rise-y: ${rnd(yMin)}%; --ld-sway-x: ${sway}px; }`);
    for (let i = 1; i <= segCount; i++) {
      sway = -sway;
      t += motionSeg;
      frames.push(`  ${rnd(t)}% { --ld-rise-y: ${rnd(level(i))}%; --ld-sway-x: ${sway}px; }`);
      if (i < segCount) {
        t += holdPct;
        frames.push(`  ${rnd(t)}% { --ld-rise-y: ${rnd(level(i))}%; --ld-sway-x: ${sway}px; }`);
      }
    }
    return `@keyframes ${name} {\n${frames.join('\n')}\n}`;
  }

  function riseAnimName(stops, swayAmp, mode, lowMark, highMark) {
    return `ld-wave-rise-${stops}-${swayAmp}-${mode}-${lowMark}-${highMark}`;
  }

  function ensureRiseKeyframes(stops, swayAmp, mode, lowMark, highMark) {
    const name = riseAnimName(stops, swayAmp, mode, lowMark, highMark);
    const id = `hanology-loader-kf-${name}`;
    if (document.getElementById(id)) return;
    const style = document.createElement('style');
    style.id = id;
    style.textContent = buildRiseKeyframes(stops, swayAmp, mode, lowMark, highMark, name);
    document.head.appendChild(style);
  }

  const loaderState = new WeakMap();

  function applyRiseAnim(wrap, stops, swayAmp, mode, lowMark, highMark) {
    ensureRiseKeyframes(stops, swayAmp, mode, lowMark, highMark);
    wrap.style.setProperty('--ld-rise-anim', riseAnimName(stops, swayAmp, mode, lowMark, highMark));
    wrap.style.setProperty('--ld-direction', mode === 'spinner' ? 'alternate' : 'normal');
    loaderState.set(wrap, { stops, swayAmp, mode, lowMark, highMark });
  }

  function forEachWrap(loader, fn) {
    const wraps = loader.matches('.ld-wrap') ? [loader] : loader.querySelectorAll('.ld-wrap');
    wraps.forEach(fn);
  }

  const STYLES = `
@property --ld-rise-y { syntax: '<percentage>'; initial-value: 0%; inherits: true; }
@property --ld-sway-x { syntax: '<length>'; initial-value: 0px; inherits: true; }

.ld-wrap {
  position: relative;
  width: 72px;
  height: 72px;
  overflow: hidden;
  --ld-wave: url("data:image/svg+xml;utf8,${buildWaveMask(DEFAULT_AMPLITUDE)}");
  --ld-rise-anim: ld-wave-rise-${DEFAULT_STOPS}-${DEFAULT_SWAY_AMP}-${DEFAULT_MODE}-${DEFAULT_LOW_MARK}-${DEFAULT_HIGH_MARK};
  --ld-direction: ${DEFAULT_MODE === 'spinner' ? 'alternate' : 'normal'};
  --ld-rise-y: 0%;
  --ld-sway-x: 0px;
}
.ld-wrap--sm { width: 56px; height: 56px; }

.ld-base, .ld-fill {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
}
.ld-base { filter: grayscale(1) opacity(0.25); }

.ld-fill {
  -webkit-mask-image: var(--ld-wave);
          mask-image: var(--ld-wave);
  -webkit-mask-size: 100% 300%;
          mask-size: 100% 300%;
  -webkit-mask-repeat: repeat-x;
          mask-repeat: repeat-x;
  -webkit-mask-position: var(--ld-sway-x) var(--ld-rise-y);
          mask-position: var(--ld-sway-x) var(--ld-rise-y);
  animation:
    var(--ld-rise-anim, ld-wave-rise-0-30-progress-0-100) var(--ld-duration, 5s) cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite var(--ld-direction, normal);
}

.ld-char {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--serif, 'Noto Serif TC', serif);
  font-weight: 900;
  line-height: 1;
  font-size: 60px;
}
.ld-wrap--sm .ld-char { font-size: 46px; }
.ld-char--base { color: var(--ink-faint, #a89b8a); }
.ld-char--fill {
  color: var(--vermillion, #c23a2b);
  -webkit-mask-image: var(--ld-wave);
          mask-image: var(--ld-wave);
  -webkit-mask-size: 100% 300%;
          mask-size: 100% 300%;
  -webkit-mask-repeat: repeat-x;
          mask-repeat: repeat-x;
  -webkit-mask-position: var(--ld-sway-x) var(--ld-rise-y);
          mask-position: var(--ld-sway-x) var(--ld-rise-y);
  animation:
    var(--ld-rise-anim, ld-wave-rise-0-30-progress-0-100) var(--ld-duration, 5s) cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite var(--ld-direction, normal);
}

/* App-load variant: growing vermillion line beneath the loader */
.ld-app {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.ld-app-line {
  width: 1px;
  height: 40px;
  background: linear-gradient(180deg, var(--vermillion, #c23a2b), transparent);
  margin-top: 24px;
  transform: scaleY(0);
  transform-origin: top;
  animation: ld-line-grow 0.6s 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
@keyframes ld-line-grow { to { transform: scaleY(1); } }

@media (prefers-reduced-motion: reduce) {
  .ld-fill, .ld-char--fill {
    --ld-rise-y: 100%;
    --ld-sway-x: 0px;
    animation: none;
  }
  .ld-app-line { animation: none; transform: scaleY(1); }
}
`;

  const STYLE_ID = 'hanology-loader-styles';

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = STYLES;
    document.head.appendChild(style);
    ensureRiseKeyframes(DEFAULT_STOPS, DEFAULT_SWAY_AMP, DEFAULT_MODE, DEFAULT_LOW_MARK, DEFAULT_HIGH_MARK);
  }

  function buildLoader(options) {
    const { logoUrl, char = '文', size = 'lg', amplitude, stops = DEFAULT_STOPS, swayAmp = DEFAULT_SWAY_AMP, mode = DEFAULT_MODE, lowMark = DEFAULT_LOW_MARK, highMark = DEFAULT_HIGH_MARK } = options;
    const wrap = document.createElement('div');
    wrap.className = 'ld-wrap' + (size === 'sm' ? ' ld-wrap--sm' : '');

    applyRiseAnim(wrap, stops, swayAmp, mode, lowMark, highMark);

    if (amplitude != null) {
      wrap.style.setProperty('--ld-wave',
        `url("data:image/svg+xml;utf8,${buildWaveMask(amplitude)}")`);
    }

    if (logoUrl) {
      const base = document.createElement('img');
      base.src = logoUrl;
      base.alt = '';
      base.className = 'ld-base';
      wrap.appendChild(base);

      const fill = document.createElement('img');
      fill.src = logoUrl;
      fill.alt = '';
      fill.className = 'ld-fill';
      wrap.appendChild(fill);
    } else {
      const base = document.createElement('span');
      base.textContent = char;
      base.className = 'ld-char ld-char--base';
      wrap.appendChild(base);

      const fill = document.createElement('span');
      fill.textContent = char;
      fill.className = 'ld-char ld-char--fill';
      wrap.appendChild(fill);
    }

    return wrap;
  }

  function create(options = {}) {
    injectStyles();
    const { variant = 'route' } = options;
    const loader = buildLoader(options);

    if (variant === 'app') {
      const container = document.createElement('div');
      container.className = 'ld-app';
      container.appendChild(loader);
      const line = document.createElement('div');
      line.className = 'ld-app-line';
      container.appendChild(line);
      return container;
    }
    return loader;
  }

  function setLogo(loader, logoUrl) {
    loader.querySelectorAll('img.ld-base, img.ld-fill').forEach((img) => {
      if (img.src !== logoUrl) img.src = logoUrl;
    });
  }

  function setAmplitude(loader, amplitude) {
    const url = `url("data:image/svg+xml;utf8,${buildWaveMask(amplitude)}")`;
    const wraps = loader.matches('.ld-wrap') ? [loader] : loader.querySelectorAll('.ld-wrap');
    wraps.forEach((wrap) => wrap.style.setProperty('--ld-wave', url));
  }

  function setSwayAmp(loader, amp) {
    forEachWrap(loader, (wrap) => {
      const s = loaderState.get(wrap) || { stops: DEFAULT_STOPS, mode: DEFAULT_MODE, lowMark: DEFAULT_LOW_MARK, highMark: DEFAULT_HIGH_MARK };
      applyRiseAnim(wrap, s.stops, amp, s.mode, s.lowMark, s.highMark);
    });
  }

  function setStops(loader, stops) {
    forEachWrap(loader, (wrap) => {
      const s = loaderState.get(wrap) || { swayAmp: DEFAULT_SWAY_AMP, mode: DEFAULT_MODE, lowMark: DEFAULT_LOW_MARK, highMark: DEFAULT_HIGH_MARK };
      applyRiseAnim(wrap, stops, s.swayAmp, s.mode, s.lowMark, s.highMark);
    });
  }

  function setMode(loader, mode) {
    forEachWrap(loader, (wrap) => {
      const s = loaderState.get(wrap) || { stops: DEFAULT_STOPS, swayAmp: DEFAULT_SWAY_AMP, lowMark: DEFAULT_LOW_MARK, highMark: DEFAULT_HIGH_MARK };
      applyRiseAnim(wrap, s.stops, s.swayAmp, mode, s.lowMark, s.highMark);
    });
  }

  function setMarks(loader, lowMark, highMark) {
    forEachWrap(loader, (wrap) => {
      const s = loaderState.get(wrap) || { stops: DEFAULT_STOPS, swayAmp: DEFAULT_SWAY_AMP, mode: DEFAULT_MODE };
      applyRiseAnim(wrap, s.stops, s.swayAmp, s.mode, lowMark, highMark);
    });
  }

  window.HanologyLoader = { create, setLogo, setAmplitude, setSwayAmp, setStops, setMode, setMarks };
})();
