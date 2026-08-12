import type { Category } from "./mockData";

type CatalogCategory = Omit<Category, "matchCount" | "winRate">;

export const FREE_TIP_CATALOG: CatalogCategory[] = [
  {
    id: "btts",
    title: "Free Hot Picks",
    description: "Hottest free predictions daily",
    icon: "Flame",
    isVip: false,
    order: 1,
    isActive: true,
  },
  {
    id: "over25",
    title: "Daily OV/UN Tips",
    description: "Daily over and under selections",
    icon: "TrendingUp",
    isVip: false,
    order: 2,
    isActive: true,
  },
];

export const VIP_TIP_CATALOG: CatalogCategory[] = [
  {
    id: "combined",
    title: "Special VVIP",
    description: "Our highest-conviction daily calls",
    icon: "Crown",
    isVip: true,
    order: 1,
    isActive: true,
  },
  {
    id: "correct",
    title: "Titan Correct Scores",
    description: "Exact scoreline predictions",
    icon: "Star",
    isVip: true,
    order: 2,
    isActive: true,
  },
  {
    id: "htft",
    title: "HT/FT VIP",
    description: "Half-time and full-time picks",
    icon: "Trophy",
    isVip: true,
    order: 3,
    isActive: true,
  },
  {
    id: "vipsingle",
    title: "OV/UN Sure Tips",
    description: "Premium totals selections",
    icon: "TrendingUp",
    isVip: true,
    order: 4,
    isActive: true,
  },
  {
    id: "megaodds",
    title: "Titan 10+ Odds",
    description: "Carefully combined 10+ odds",
    icon: "Crown",
    isVip: true,
    order: 5,
    isActive: true,
  },
  {
    id: "draws",
    title: "Fixed Special Draws",
    description: "Selected draw predictions",
    icon: "Percent",
    isVip: true,
    order: 6,
    isActive: true,
  },
  {
    id: "combo",
    title: "Special Combo",
    description: "Curated multi-leg combo selections",
    icon: "Zap",
    isVip: true,
    order: 7,
    isActive: true,
  },
];

/**
 * Firestore owns live counts and availability. Product names and ordering live
 * in code so an older remote category document can never regress navigation.
 */
export function resolveCatalog(
  catalog: CatalogCategory[],
  remoteCategories: Category[],
): Category[] {
  return catalog.map((definition) => {
    const remote = remoteCategories.find((category) => category.id === definition.id);
    return {
      ...remote,
      ...definition,
      matchCount: remote?.matchCount ?? 0,
      winRate: remote?.winRate ?? 0,
    };
  });
}
