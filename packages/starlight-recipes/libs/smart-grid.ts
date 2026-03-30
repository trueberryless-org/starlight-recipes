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
  if (!Number.isInteger(rowSize) || rowSize < 1) {
    throw new Error("rowSize must be a positive integer");
  }

  const featured = entries.filter((e) => e.data.featured);
  const regular = entries.filter((e) => !e.data.featured);

  const smartEntries = ((): StarlightRecipeEntry[] => {
    const result: StarlightRecipeEntry[] = [];
    const pool = [...entries];

    while (pool.length > 0) {
      const current = pool[0]!;

      if (current.data.featured) {
        result.push(pool.shift()!);
      } else {
        const potentialRow: StarlightRecipeEntry[] = [];
        let searchIndex = 0;

        while (potentialRow.length < rowSize && searchIndex < pool.length) {
          if (!pool[searchIndex]!.data.featured) {
            potentialRow.push(pool[searchIndex]!);
          }
          searchIndex++;
        }

        if (potentialRow.length === rowSize) {
          let foundCount = 0;
          for (let i = 0; i < pool.length && foundCount < rowSize; i++) {
            if (!pool[i]!.data.featured) {
              result.push(pool.splice(i, 1)[0]!);
              foundCount++;
              i--;
            }
          }
        } else {
          const nextFeaturedIndex = pool.findIndex(
            (item) => item.data.featured
          );

          if (nextFeaturedIndex !== -1) {
            result.push(pool.splice(nextFeaturedIndex, 1)[0]!);
          } else {
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
