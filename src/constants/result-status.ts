import { PremiumColors } from "@/constants/colors";
import type { MatchStatus } from "@/data/mockData";
import { Check, Clock, X } from "lucide-react-native";

/**
 * Single source of truth for how a prediction result is presented.
 * Every status pairs a label with an icon so the state is never carried by
 * colour alone, and a loss stays neutral rather than alarming.
 */
export const RESULT_STATUS = {
  won: {
    label: "Won",
    Icon: Check,
    color: PremiumColors.result.won,
    surface: PremiumColors.result.wonSurface,
    border: PremiumColors.result.wonBorder,
  },
  lost: {
    label: "Lost",
    Icon: X,
    color: PremiumColors.result.lost,
    surface: PremiumColors.result.lostSurface,
    border: PremiumColors.result.lostBorder,
  },
  pending: {
    label: "Pending",
    Icon: Clock,
    color: PremiumColors.result.pending,
    surface: PremiumColors.result.pendingSurface,
    border: PremiumColors.result.pendingBorder,
  },
} as const;

export type ResultStatusConfig = (typeof RESULT_STATUS)[MatchStatus];

export function resultStatus(status: MatchStatus): ResultStatusConfig {
  return RESULT_STATUS[status] ?? RESULT_STATUS.pending;
}

/** A prediction is only revealed once the match has been settled. */
export function isSettled(status: MatchStatus): boolean {
  return status === "won" || status === "lost";
}
