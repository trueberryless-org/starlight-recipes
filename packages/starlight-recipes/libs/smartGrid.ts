import type { StarlightRecipeEntry } from "./content";

/**
 * Organizes recipe entries into a grid layout with a row size for regular items.
 * A featured item always occupies a full row.
 * If a regular item is about to be left alone in a row (and it's not the end of the list),
 * we swap it with the subsequent featured item to maintain row density.
 */
export function getSmartGridData(
  entries: StarlightRecipeEntry[],
  rowSize: number = 2
) {
  const featured = entries.filter((e) => e.data.featured);
  const regular = entries.filter((e) => !e.data.featured);

  const smartEntries = ((): StarlightRecipeEntry[] => {
    const result: StarlightRecipeEntry[] = [];
    const pool = [...entries];

    while (pool.length > 0) {
      const current = pool[0]!;

      if (current.data.featured) {
        // Featured items always just get pushed and take a full row
        result.push(pool.shift()!);
      } else {
        // We have a regular item. Let's see if we can fill a row.
        const potentialRow: StarlightRecipeEntry[] = [];
        let searchIndex = 0;

        // Try to collect 'rowSize' regular items from the remaining pool
        while (potentialRow.length < rowSize && searchIndex < pool.length) {
          if (!pool[searchIndex]!.data.featured) {
            potentialRow.push(pool[searchIndex]!);
          }
          searchIndex++;
        }

        if (potentialRow.length === rowSize) {
          // We found enough to fill a row!
          // Extract exactly these items from the pool (preserving their relative order)
          let foundCount = 0;
          for (let i = 0; i < pool.length && foundCount < rowSize; i++) {
            if (!pool[i]!.data.featured) {
              result.push(pool.splice(i, 1)[0]!);
              foundCount++;
              i--;
            }
          }
        } else {
          // We don't have enough regular items left to fill a row.
          // Is there a Featured item coming up that we should swap with?
          const nextFeaturedIndex = pool.findIndex(
            (item) => item.data.featured
          );

          if (nextFeaturedIndex !== -1) {
            // Swap: Move the featured item ahead of this lonely regular item
            result.push(pool.splice(nextFeaturedIndex, 1)[0]!);
          } else {
            // No featured items left, just push the remaining regular items
            result.push(pool.shift()!);
          }
        }
      }
    }
    return result;
  })();

  return {
    featured,
    regular,
    smartEntries,
  };
}
