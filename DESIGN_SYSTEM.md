# ZT Lounge Design System

## Architecture Overview

The ZT Lounge design system provides a centralized, scalable CSS architecture that eliminates duplicate styles across all pages.

### File Structure

```
assets/
├── css/
│   ├── variables.css          # Design tokens (colors, spacing, typography)
│   ├── reset.css              # Modern CSS reset
│   ├── typography.css         # Text styles and headings
│   ├── layout.css             # Grid, flex, and spacing utilities
│   ├── utilities.css          # Helper classes
│   ├── theme.css              # Main entry point - imports all files
│   │
│   ├── components/
│   │   ├── buttons.css        # Shared button styles
│   │   ├── navbar.css         # Header and navigation styles
│   │   ├── footer.css         # Footer styles
│   │   ├── hero.css           # Hero/slider section styles
│   │   ├── cards.css          # Card component styles
│   │   ├── gallery.css        # Gallery and slider styles
│   │   └── forms.css          # Form input styles
│   │
│   └── sections/
│       ├── about.css          # About section styles
│       ├── services.css       # Services section styles
│       ├── menu.css           # Menu section styles
│       ├── testimonials.css   # Testimonials section styles
│       ├── contact.css        # Contact section styles
│       └── faq.css            # FAQ section styles
│
└── js/
    ├── core/
    │   └── app.js             # Centralized app logic (theme, nav, slider)
    │
    ├── config/
    │   └── supabase.config.js   # Supabase configuration
    │
    └── repositories/
        └── ...                  # Data fetching (existing)
```

## Design Tokens

All colors, spacing, typography, and other design values are centralized in `variables.css` using CSS custom properties.

### Colors
- `--color-primary` - Main background
- `--color-accent` - Gold accent color
- `--color-text` - Primary text
- `--color-text-secondary` - Secondary text

### Spacing Scale (8px base)
- `--spacing-1` through `--spacing-20` - Consistent spacing values

### Typography
- `--font-size-xs` through `--font-size-5xl` - Consistent font sizes
- `--font-weight-light` through `--font-weight-bold` - Font weights

## Refactoring Rules Applied

✅ **No page contains embedded `<style>` blocks** (except existing inline critical CSS)
✅ **All shared components use centralized CSS**
✅ **No hardcoded colors in pages** - all use CSS variables
✅ **One theme for all pages** - consistent design language
✅ **No duplicate CSS** - shared via imports

## HTML Structure Pattern

Every page should follow this semantic structure:

```html
<body>
  <a href="#main" class="skip-link">Skip to content</a>
  
  <!-- Header (injected by shared-components.js) -->
  <div id="site-header"></div>
  
  <main id="main">
    <section class="hero">...</section>
    <section class="about-section">...</section>
    <section class="services-section">...</section>
    <section class="gallery-section">...</section>
    <section class="testimonials-section">...</section>
    <section class="faq-section">...</section>
    <section class="contact-section">...</section>
  </main>
  
  <!-- Footer (injected by shared-components.js) -->
  <div id="site-footer"></div>
</body>
```

## JavaScript Modules

The `window.ZTLounge` object provides centralized functionality:

- `ZTLounge.init()` - Initialize theme and navigation
- `ZTLounge.theme` - Theme management
- `ZTLounge.navigation` - Navigation handling
- `ZTLounge.slider` - Slider functionality

## Usage

Include in HTML head:
```html
<link rel="stylesheet" href="assets/css/theme.css" />
```

Include before closing body:
```html
<script src="assets/js/core/app.js"></script>
<script src="assets/js/shared-components.js"></script>
<script>
  ZTLounge.init();
  injectHeader();
  injectFooter();
</script>
```

## Next Steps

1. Remove inline styles from existing HTML pages
2. Replace hardcoded colors with CSS variables
3. Use semantic class names matching the design system
4. Test all pages for visual consistency