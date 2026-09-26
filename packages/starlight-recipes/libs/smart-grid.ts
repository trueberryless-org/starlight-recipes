import type { StarlightRecipeEntry } from "./types";

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

export function getGridCells(entries: StarlightRecipeEntry[]): GridCell[] {
  const { smartEntries } = getSmartGridData(entries);

  return smartEntries.map((entry) => ({
    entry,
    isFeatured: entry.data.featured ?? false,
    isFullWidth: entry.data.featured === true || smartEntries.length <= 1,
  }));
}

interface GridCell {
  entry: StarlightRecipeEntry;
  isFeatured: boolean;
  isFullWidth: boolean;
}
