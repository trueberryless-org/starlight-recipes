// Server-only environment helpers for the starlight-recipes package.
//
// IMPORTANT: These helpers use process.env with bracket notation so that
// bundlers (Vite/Astro) cannot inline secret values at build time.

/**
 * Returns the secret namespace used for recipe ratings.
 *
 * Reads from process.env at runtime in the server environment.
 */
export function getRatingSecret(): string | undefined {
  // Use bracket notation to avoid static replacement like process.env.XYZ.
  return process.env["STARLIGHT_RECIPES_RATING_SECRET"];
}
