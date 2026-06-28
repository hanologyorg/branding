# Hanology Branding

Source brand assets for the Hanology (漢流) project.

The site at [hanology.github.io](https://github.com/mulgogi/hanology.github.io) consumes the logo SVGs from this repo via its `config.yaml`.

## Contents

### `logo/`

The Hanology logo in source and exported forms.

| File | Role |
|------|------|
| `hanology-logo.pdf` | Designer's source artwork (canonical) |
| `hanology-logo_logo-red.svg` | Exported variant — red, used as `logoDark` |
| `hanology-logo_logo-white.svg` | Exported variant — white, used as `logo` |

### `loading/`

A liquid-wave loading animation: the colored logo stays in place while a paper-colored wave rises from bottom to top, revealing it. The gray "ghost" of the logo remains visible above the waterline.

- `loader.js` — the library; exposes `window.HanologyLoader`
- `index.html` — interactive playground for all options
- `_shots/` — Playwright verification scripts and captured frames

#### Quick start

```html
<script src="loading/loader.js"></script>
<script>
  const loader = HanologyLoader.create({
    logoUrl: 'logo/hanology-logo_logo-white.svg',
    size: 'lg',           // 'lg' (72px) or 'sm' (56px)
    mode: 'progress',     // 'progress' (one-way, loops) or 'spinner' (oscillates)
    amplitude: 5,         // wave amplitude (SVG mask units)
    swayAmp: 30,          // sideways sway of the surface (px)
    stops: 0,             // number of hold positions during the rise
    lowMark: 0,           // begin of the rise (0–100%)
    highMark: 100,        // end of the rise (0–100%)
    variant: 'route',     // 'route' or 'app' (adds a trailing vermillion line)
  });
  loader.style.setProperty('--ld-duration', '5s');
  document.body.appendChild(loader);
</script>
```

If `logoUrl` is omitted, the loader renders the `char` glyph (default `文`) in place of the logo.

#### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `logoUrl` | string | — | Logo image URL. If omitted, renders `char` instead. |
| `char` | string | `'文'` | Glyph used when no `logoUrl` is given. |
| `size` | `'lg'` \| `'sm'` | `'lg'` | Loader dimensions (72px or 56px). |
| `mode` | `'progress'` \| `'spinner'` | `'progress'` | `progress` rises one-way then resets; `spinner` oscillates back and forth. |
| `amplitude` | number | `5` | Wave amplitude within the SVG mask's viewBox. |
| `swayAmp` | number | `30` | Horizontal travel of the wave surface, in pixels. |
| `stops` | number | `0` | Number of internal hold positions. `0` = smooth rise. |
| `lowMark` | number | `0` | Begin of the rise (0–100% of mask travel). |
| `highMark` | number | `100` | End of the rise. Set `lowMark === highMark` to pin the waterline — only the sideways sway remains. |
| `variant` | `'route'` \| `'app'` | `'route'` | `app` wraps the loader with a growing vermillion line beneath (for initial app load). |

The rise always travels `lowMark → highMark`. In `progress` mode it does this one-way and loops; in `spinner` mode it oscillates between them.

#### Runtime updates

Each option has a setter that updates an existing loader in place:

```js
HanologyLoader.setLogo(loader, 'logo/hanology-logo_logo-red.svg');
HanologyLoader.setAmplitude(loader, 8);
HanologyLoader.setSwayAmp(loader, 40);
HanologyLoader.setStops(loader, 3);
HanologyLoader.setMode(loader, 'spinner');
HanologyLoader.setMarks(loader, 25, 75);   // lowMark, highMark
```

#### Accessibility

The animation honors `prefers-reduced-motion`: when reduce is requested, the waterline is pinned at the high mark and all motion stops. The demo page (`index.html`) overrides this for visual review only — the library itself keeps the accessible default.

#### Live demo

Open `loading/index.html` in a browser for an interactive playground with sliders, theme switcher, and a copy-pasteable code preview.

## Source vs derived

The PDF is the canonical source. The SVGs are derived exports. To update a variant, modify the PDF in the source design tool and re-export the SVG. Do not delete the PDF or replace it with a derived file.