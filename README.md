# Hanology Branding

Source brand assets for the Hanology (漢流) project.

The site at [hanology.github.io](https://github.com/mulgogi/hanology.github.io) consumes the logo SVGs from this repo via its `config.yaml`.

The repo ships the logo in two forms:

| Form | Directory | Use it for |
|------|-----------|------------|
| **Static logo** | `logo/` | Persistent branding — headers, footers, nav, print, documents, favicon |
| **Dynamic logo** | `loading/` | Loading states — route transitions, initial app load, async waits |

Rule of thumb: if the logo sits still, use `logo/`. If it animates while the user waits, use `loading/`.

## Static logo

The canonical logo artwork as SVG exports, plus the designer's source PDF.

### Files

| File | Role |
|------|------|
| `logo/hanology-logo.pdf` | Designer's source artwork (canonical) |
| `logo/hanology-logo_logo-white.svg` | White glyph — for dark backgrounds (site `logo`) |
| `logo/hanology-logo_logo-red.svg` | Vermillion glyph — for light backgrounds (site `logoDark`) |

### Usage

Pick the variant by background color, then reference the SVG directly:

```html
<!-- Dark background → white glyph -->
<img src="logo/hanology-logo_logo-white.svg" alt="Hanology">

<!-- Light background → red glyph -->
<img src="logo/hanology-logo_logo-red.svg" alt="Hanology">
```

For the hanology.github.io site, these are wired through `config.yaml`:

- `logo` → `_logo-white.svg` — shown on the dark header
- `logoDark` → `_logo-red.svg` — shown on the light header

## Dynamic logo (liquid loader)

The logo as a loading animation: a rising wavy waterline reveals the colored glyph while the desaturated ghost stays visible above the surface. It is a transitional element — use it during loading states, not as persistent branding.

- `loading/loader.js` — the library; exposes `window.HanologyLoader`
- `loading/index.html` — interactive playground for all options
- `loading/_shots/` — Playwright verification scripts and captured frames

### Choosing a mode

| Mode | Behavior | Use when |
|------|----------|----------|
| `progress` | Rises one-way, then resets | Progress is deterministic — splash screen, known asset download, "starting up" |
| `spinner` | Oscillates back and forth | Wait time is unknown — network request, indeterminate async |

### Choosing a variant

| Variant | Use for |
|---------|---------|
| `route` | Inline loader — route transitions, button states, card placeholders |
| `app` | Full-page initial app load — wraps the loader with a trailing vermillion line |

### Quick start

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

### Options

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

### Runtime updates

Each option has a setter that updates an existing loader in place:

```js
HanologyLoader.setLogo(loader, 'logo/hanology-logo_logo-red.svg');
HanologyLoader.setAmplitude(loader, 8);
HanologyLoader.setSwayAmp(loader, 40);
HanologyLoader.setStops(loader, 3);
HanologyLoader.setMode(loader, 'spinner');
HanologyLoader.setMarks(loader, 25, 75);   // lowMark, highMark
```

### Accessibility

The animation honors `prefers-reduced-motion`: when reduce is requested, the waterline is pinned at the high mark and all motion stops. The demo page (`index.html`) overrides this for visual review only — the library itself keeps the accessible default.

### Live demo

Open `loading/index.html` in a browser for an interactive playground with sliders, theme switcher, and a copy-pasteable code preview.

## Source vs derived

The PDF is the canonical source. The SVGs are derived exports. To update a variant, modify the PDF in the source design tool and re-export the SVG. Do not delete the PDF or replace it with a derived file.
