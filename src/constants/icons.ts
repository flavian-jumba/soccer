import type { IconName } from "@/data/mockData";
import {
  Award,
  Crown,
  Flame,
  Goal,
  Percent,
  Star,
  Target,
  TrendingUp,
  Trophy,
  Zap,
} from "lucide-react-native";
import type React from "react";

/** Maps a catalog icon name to its component. One map, used everywhere. */
export const ICONS: Record<IconName, React.ComponentType<any>> = {
  Goal,
  TrendingUp,
  Target,
  Trophy,
  Zap,
  Crown,
  Star,
  Flame,
  Award,
  Percent,
};

export function resolveIcon(name: IconName): React.ComponentType<any> {
  return ICONS[name] ?? Target;
}
