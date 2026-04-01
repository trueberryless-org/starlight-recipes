# starlight-recipes

## 0.1.1

### Patch Changes

- [#15](https://github.com/trueberryless-org/starlight-recipes/pull/15) [`ba4144a`](https://github.com/trueberryless-org/starlight-recipes/commit/ba4144a066325fe81962e2013b03c3bc8193e8c7) Thanks [@trueberryless](https://github.com/trueberryless)! - **⚠️ Security fix**: Do not expose `STARLIGHT_RECIPES_RATING_SECRET` secret to the client.

  The previous release bundled the namespace secret into the build output and the `0.1.0` version is therefore locked from downloads.

## 0.1.0

### Minor Changes

- [#2](https://github.com/trueberryless-org/starlight-recipes/pull/2) [`24544b2`](https://github.com/trueberryless-org/starlight-recipes/commit/24544b25d227ed2e1a98db48ca27f81304b1c350) Thanks [@trueberryless](https://github.com/trueberryless)! - Initial public release.

  ### Features
  - **Recipe schema** with cover images, dates, categories, cuisines (with country emoji flags), tags, and multi-author support
  - **Time & yield tracking** for preparation, cooking, servings, and calories
  - **Flexible ingredients & instructions** with optional images, step names, and per-step timing
  - **YouTube video integration** with automatic metadata fetching (thumbnails, duration, view count)
  - **Auto-generated taxonomy pages** for categories, cuisines, tags, and authors
  - **Interactive cooking mode** with step timers and progress checkboxes
  - **Rating system** API endpoint (requires server adapter)
  - **i18n support** with built-in translations
  - **SEO-optimized structured data** for Google Recipe rich results
  - **Configurable sidebar** with featured and popular recipes
