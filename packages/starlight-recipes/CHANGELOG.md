# starlight-recipes

## 0.2.1

### Patch Changes

- [#22](https://github.com/trueberryless-org/starlight-recipes/pull/22) [`c8468f5`](https://github.com/trueberryless-org/starlight-recipes/commit/c8468f53cdd0b3dff3586c460580cf0d7d4e5175) Thanks [@copilot-swe-agent](https://github.com/apps/copilot-swe-agent)! - Fix missing `/tags/` prefix in footer tag pill links

## 0.2.0

### Minor Changes

- [#11](https://github.com/trueberryless-org/starlight-recipes/pull/11) [`b7a1ae3`](https://github.com/trueberryless-org/starlight-recipes/commit/b7a1ae338202198928c77a3dd989ceebb376a450) Thanks [@trueberryless](https://github.com/trueberryless)! - Adds support for Astro v6, drops support for Astro v5.

  ⚠️ **BREAKING CHANGE:** The minimum supported version of Starlight is now `0.38.0`.

  Please follow the [upgrade guide](https://github.com/withastro/starlight/releases/tag/%40astrojs%2Fstarlight%400.38.0) to update your project.

- [#14](https://github.com/trueberryless-org/starlight-recipes/pull/14) [`a0c155b`](https://github.com/trueberryless-org/starlight-recipes/commit/a0c155b709c564c18f25d4848506f83cfdaef648) Thanks [@trueberryless](https://github.com/trueberryless)! - Replace package dotenv with Node natives.

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
