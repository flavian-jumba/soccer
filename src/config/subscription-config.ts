import { BILLING_ENV } from "@/config/env";
import type { IconName } from "@/data/mockData";

/**
 * Single source of truth for what Titan sells.
 *
 * Titan sells standalone markets. Every product unlocks exactly one tip
 * category and nothing else, and every product is bought independently of every
 * other one — a user may hold any combination of them, in either cadence, at
 * the same time. That rule is expressed structurally: a product carries a single
 * `categoryId`, so there is no way to write a plan that reaches into a market it
 * does not sell. Bundling would have to be a new category with its own tips,
 * never a second entry in one product's unlock list.
 *
 * Product IDs are *not* written here. Each plan declares a `productIdKey`, and
 * the real Play Console subscription ID is injected from
 * `app.json → expo.extra.billing.productIds`. That keeps store identifiers in
 * configuration where they can differ per build profile, and means a Play
 * Console rename is a config edit rather than a code change.
 */

/** Internal, stable plan identifiers. Never shown to the user, never sent to Play. */
export const PLAN_IDS = [
  "special_vvip_weekly",
  "special_vvip_monthly",
  "correct_scores_weekly",
  "correct_scores_monthly",
  "ht_ft_vip_weekly",
  "ht_ft_vip_monthly",
  "over_under_vip_weekly",
  "over_under_vip_monthly",
  "titan_10_odds_weekly",
  "titan_10_odds_monthly",
  "fixed_special_draws_weekly",
  "fixed_special_draws_monthly",
  "special_combo_weekly",
  "special_combo_monthly",
] as const;

export type PlanId = (typeof PLAN_IDS)[number];

/** Cadences every product is sold in. Both are independently purchasable. */
export const PLAN_CADENCES = ["weekly", "monthly"] as const;

export type PlanCadence = (typeof PLAN_CADENCES)[number];

const CADENCE_LABEL: Record<PlanCadence, string> = {
  weekly: "Weekly",
  monthly: "Monthly",
};

/**
 * One sellable market, described once and sold in each cadence.
 *
 * Copy lives at this level rather than per plan so the weekly and monthly cards
 * for a market can never drift apart.
 */
interface SubscriptionProduct {
  /** The one tip category this product unlocks. See `src/data/category-catalog.ts`. */
  categoryId: string;
  title: string;
  /** Completes "Weekly access - ..." on the plan card. */
  taglineSuffix: string;
  /** Longer copy shown when the plan is expanded. */
  description: string;
  /** Bullet points describing what the subscription includes. */
  features: readonly string[];
  icon: IconName;
  /** Ascending display order on the VIP screen. */
  order: number;
  /** Set false to retire a product without deleting its definition. */
  isActive: boolean;
  /** Plan identifier per cadence; doubles as the `app.json` product-ID key. */
  plans: Record<PlanCadence, PlanId>;
}

const PRODUCTS: readonly SubscriptionProduct[] = [
  {
    categoryId: "combined",
    title: "Special VVIP",
    taglineSuffix: "the flagship VVIP market",
    description:
      "Our highest-conviction selections of the day, published in the Special VVIP market before any other Titan market goes live.",
    features: [
      "Highest-conviction VVIP selections",
      "Earliest release of the day's picks",
      "Reasoning published with every call",
      "Settled results kept on record",
    ],
    icon: "Crown",
    order: 1,
    isActive: true,
    plans: {
      weekly: "special_vvip_weekly",
      monthly: "special_vvip_monthly",
    },
  },
  {
    categoryId: "correct",
    title: "Titan Correct Scores",
    taglineSuffix: "exact scoreline selections",
    description:
      "Our analysts' exact scoreline calls, with the reasoning and the full settled-result history for the market.",
    features: [
      "Exact scoreline selections",
      "Published daily with kickoff times",
      "Settled results kept on record",
    ],
    icon: "Star",
    order: 2,
    isActive: true,
    plans: {
      weekly: "correct_scores_weekly",
      monthly: "correct_scores_monthly",
    },
  },
  {
    categoryId: "htft",
    title: "HT/FT VIP",
    taglineSuffix: "half-time and full-time calls",
    description:
      "Half-time / full-time selections for matches where our model separates the two halves with confidence.",
    features: [
      "Half-time and full-time selections",
      "Published daily with kickoff times",
      "Settled results kept on record",
    ],
    icon: "Trophy",
    order: 3,
    isActive: true,
    plans: {
      weekly: "ht_ft_vip_weekly",
      monthly: "ht_ft_vip_monthly",
    },
  },
  {
    categoryId: "vipsingle",
    title: "OV/UN Sure Tips",
    taglineSuffix: "premium totals selections",
    description:
      "Over and under goal-line selections across the leagues our analysts track most closely.",
    features: [
      "Premium over/under selections",
      "Goal-line reasoning for each pick",
      "Settled results kept on record",
    ],
    icon: "TrendingUp",
    order: 4,
    isActive: true,
    plans: {
      weekly: "over_under_vip_weekly",
      monthly: "over_under_vip_monthly",
    },
  },
  {
    categoryId: "megaodds",
    title: "Titan 10+ Odds",
    taglineSuffix: "higher-odds combined selections",
    description:
      "Carefully combined selections built to reach 10+ combined odds. Higher odds carry proportionally higher risk.",
    features: [
      "Combined selections targeting 10+ odds",
      "Each leg listed separately",
      "Settled results kept on record",
    ],
    icon: "Award",
    order: 5,
    isActive: true,
    plans: {
      weekly: "titan_10_odds_weekly",
      monthly: "titan_10_odds_monthly",
    },
  },
  {
    categoryId: "draws",
    title: "Fixed Special Draws",
    taglineSuffix: "selected draw predictions",
    description:
      "Draw selections for fixtures our model reads as tightly matched.",
    features: [
      "Selected draw predictions",
      "Published daily with kickoff times",
      "Settled results kept on record",
    ],
    icon: "Percent",
    order: 6,
    isActive: true,
    plans: {
      weekly: "fixed_special_draws_weekly",
      monthly: "fixed_special_draws_monthly",
    },
  },
  {
    categoryId: "combo",
    title: "Special Combo",
    taglineSuffix: "curated combo selections",
    description:
      "Curated multi-leg combo selections, assembled by our analysts from the strongest calls on the card.",
    features: [
      "Curated multi-leg combo selections",
      "Each leg listed separately",
      "Settled results kept on record",
    ],
    icon: "Zap",
    order: 7,
    isActive: true,
    plans: {
      weekly: "special_combo_weekly",
      monthly: "special_combo_monthly",
    },
  },
];

/** One purchasable plan: a product in one cadence. */
export interface SubscriptionPlanDefinition {
  /** Internal identifier used across the app's own state. */
  id: PlanId;
  /** Key looked up in `expo.extra.billing.productIds` to resolve the store ID. */
  productIdKey: PlanId;
  /** The one tip category this plan unlocks. */
  categoryId: string;
  cadence: PlanCadence;
  title: string;
  /** One line shown under the title on the plan card. */
  tagline: string;
  description: string;
  features: readonly string[];
  icon: IconName;
  /** Ascending display order. */
  order: number;
  isActive: boolean;
}

function flatten(
  products: readonly SubscriptionProduct[],
): SubscriptionPlanDefinition[] {
  const definitions: SubscriptionPlanDefinition[] = [];

  for (const product of [...products].sort((a, b) => a.order - b.order)) {
    for (const cadence of PLAN_CADENCES) {
      const planId = product.plans[cadence];
      definitions.push({
        id: planId,
        productIdKey: planId,
        categoryId: product.categoryId,
        cadence,
        title: product.title,
        tagline: `${CADENCE_LABEL[cadence]} access - ${product.taglineSuffix}`,
        description: product.description,
        features: product.features,
        icon: product.icon,
        order: definitions.length + 1,
        isActive: product.isActive,
      });
    }
  }

  return definitions;
}

const CATALOG = flatten(PRODUCTS);

/** A plan definition joined with the store ID resolved from configuration. */
export interface SubscriptionPlan extends SubscriptionPlanDefinition {
  /** The Play Console subscription ID. */
  productId: string;
}

function resolveProductId(plan: SubscriptionPlanDefinition): string | null {
  const configured = BILLING_ENV.PRODUCT_IDS[plan.productIdKey];
  return typeof configured === "string" && configured.trim().length > 0
    ? configured.trim()
    : null;
}

interface ResolvedCatalog {
  plans: SubscriptionPlan[];
  byId: Map<string, SubscriptionPlan>;
  byProductId: Map<string, SubscriptionPlan>;
}

/**
 * A plan without a configured product ID is dropped rather than guessed: showing
 * a card that cannot be purchased is worse than showing nothing, and Play
 * rejects builds that advertise products the console does not have.
 */
function resolveCatalog(): ResolvedCatalog {
  const plans: SubscriptionPlan[] = [];

  for (const definition of CATALOG) {
    if (!definition.isActive) continue;
    const productId = resolveProductId(definition);
    if (!productId) {
      if (__DEV__) {
        console.warn(
          `[billing] No product ID configured for plan "${definition.id}". ` +
            `Add expo.extra.billing.productIds.${definition.productIdKey} to app.json.`,
        );
      }
      continue;
    }
    plans.push({ ...definition, productId });
  }

  return {
    plans,
    byId: new Map(plans.map((plan) => [plan.id, plan])),
    byProductId: new Map(plans.map((plan) => [plan.productId, plan])),
  };
}

/**
 * Resolution runs once. `BILLING_ENV` is read from the app manifest at startup
 * and cannot change while the app runs, and these lookups sit on the hot path of
 * every access check.
 */
let resolved: ResolvedCatalog | null = null;

function catalog(): ResolvedCatalog {
  if (!resolved) resolved = resolveCatalog();
  return resolved;
}

/** Active plans that have a store ID configured, in display order. */
export function getSubscriptionPlans(): SubscriptionPlan[] {
  return catalog().plans;
}

/** Every configured store ID, for the single `fetchProducts` round trip. */
export function getConfiguredProductIds(): string[] {
  return catalog().plans.map((plan) => plan.productId);
}

export function findPlanByProductId(productId: string): SubscriptionPlan | null {
  return catalog().byProductId.get(productId) ?? null;
}

export function findPlanById(planId: string): SubscriptionPlan | null {
  return catalog().byId.get(planId) ?? null;
}
