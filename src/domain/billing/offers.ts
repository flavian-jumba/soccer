/**
 * Presentation helpers for store offers.
 *
 * Prices are never computed here — the store already formats them for the
 * user's locale and currency, and re-deriving a price on device is how apps end
 * up showing the wrong number in the wrong currency.
 */

import type { BillingPeriod, StoreOffer, StoreSubscription } from "./types";

/**
 * The offer shown by default: the best deal Play says the user is eligible for.
 * A free trial wins, then a discounted introductory phase, then the plain base
 * plan. Play only returns offers the user actually qualifies for, so whatever is
 * picked here is purchasable.
 */
export function pickDefaultOffer(
  subscription: StoreSubscription | undefined,
): StoreOffer | null {
  if (!subscription || subscription.offers.length === 0) return null;

  return (
    subscription.offers.find((offer) => offer.freeTrialDays !== null) ??
    subscription.offers.find((offer) => offer.introductoryPhase !== null) ??
    subscription.offers[0]
  );
}

const UNIT_LABELS: Record<BillingPeriod["unit"], [string, string]> = {
  day: ["day", "days"],
  week: ["week", "weeks"],
  month: ["month", "months"],
  year: ["year", "years"],
  unknown: ["period", "periods"],
};

/** "month", "3 months", "year" — the noun that follows "per". */
export function formatPeriod(period: BillingPeriod | null): string | null {
  if (!period) return null;
  const [singular, plural] = UNIT_LABELS[period.unit];
  return period.value === 1 ? singular : `${period.value} ${plural}`;
}

const DAYS_PER_UNIT: Record<BillingPeriod["unit"], number | null> = {
  day: 1,
  week: 7,
  month: 30,
  year: 365,
  unknown: null,
};

/**
 * Approximate length of a billing period in days. Used only to compare two
 * offers against each other, never to compute or display a price.
 */
export function periodInDays(period: BillingPeriod | null): number | null {
  if (!period) return null;
  const days = DAYS_PER_UNIT[period.unit];
  return days === null ? null : days * period.value;
}

function pricePerDay(offer: StoreOffer | null): number | null {
  if (!offer) return null;
  const micros = Number(offer.priceAmountMicros);
  const days = periodInDays(offer.billingPeriod);
  if (!Number.isFinite(micros) || micros <= 0) return null;
  if (days === null || days <= 0) return null;
  return micros / days;
}

/**
 * Which plan genuinely costs least per day, for the "best value" badge.
 *
 * Derived from the store's own prices rather than assumed from the cadence, so
 * the badge cannot outlive a pricing change and never makes a claim the numbers
 * do not support. Returns null when fewer than two offers carry comparable
 * price data, or when the cheapest two tie — in both cases nothing is flagged.
 */
export function bestValuePlanId(
  candidates: readonly { planId: string; offer: StoreOffer | null }[],
): string | null {
  const rated: { planId: string; perDay: number }[] = [];

  for (const { planId, offer } of candidates) {
    const perDay = pricePerDay(offer);
    if (perDay !== null) rated.push({ planId, perDay });
  }

  if (rated.length < 2) return null;

  rated.sort((a, b) => a.perDay - b.perDay);
  return rated[0].perDay < rated[1].perDay ? rated[0].planId : null;
}

/** "KSh 500 / month" — the headline price line on a plan card. */
export function formatPrice(offer: StoreOffer | null): string {
  if (!offer) return "—";
  const period = formatPeriod(offer.billingPeriod);
  return period ? `${offer.displayPrice} / ${period}` : offer.displayPrice;
}

/**
 * The sentence Play policy requires before purchase: what is charged, when, and
 * what happens after any introductory period. Returns null for a plain base
 * plan, where the price line already says everything.
 */
export function describeOfferTerms(offer: StoreOffer | null): string | null {
  if (!offer) return null;
  const period = formatPeriod(offer.billingPeriod);
  const recurring = period
    ? `${offer.displayPrice} every ${period}`
    : offer.displayPrice;

  if (offer.freeTrialDays !== null) {
    return `Free for ${offer.freeTrialDays} days, then ${recurring}. Cancel any time before the trial ends and you will not be charged.`;
  }

  if (offer.introductoryPhase) {
    const introPeriod = formatPeriod(offer.introductoryPhase.period);
    const cycles = offer.introductoryPhase.cycles;
    const intro = introPeriod
      ? `${offer.introductoryPhase.displayPrice} for the first ${
          cycles > 1 ? `${cycles} ${introPeriod}s` : introPeriod
        }`
      : offer.introductoryPhase.displayPrice;
    return `${intro}, then ${recurring}.`;
  }

  return null;
}

/** Short badge copy, e.g. "7-day free trial". Null when there is nothing to flag. */
export function offerBadge(offer: StoreOffer | null): string | null {
  if (!offer) return null;
  if (offer.freeTrialDays !== null) return `${offer.freeTrialDays}-day free trial`;
  if (offer.introductoryPhase) return "Intro price";
  return null;
}
