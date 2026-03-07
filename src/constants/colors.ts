/**
 * Premium color palette for VistaScores sports prediction app
 * These colors are designed for a dark glassmorphic premium look
 */

export const PremiumColors = {
  // Premium dark backgrounds
  background: {
    primary: "#0B0F19",
    secondary: "#121212",
    tertiary: "#1A1F2C",
    elevated: "#252A3C",
    card: "#2E3449",
  },

  // Glass effect colors
  glass: {
    background: "rgba(255, 255, 255, 0.05)",
    backgroundLight: "rgba(255, 255, 255, 0.08)",
    backgroundMedium: "rgba(255, 255, 255, 0.12)",
    border: "rgba(255, 255, 255, 0.1)",
    borderLight: "rgba(255, 255, 255, 0.15)",
    borderAccent: "rgba(255, 255, 255, 0.2)",
  },

  // Text colors
  text: {
    primary: "#FFFFFF",
    secondary: "#B0B4BA",
    tertiary: "#6B7280",
    muted: "#4B5563",
  },

  // Accent colors
  accent: {
    primary: "#3B82F6",
    primaryGlow: "#60A5FA",
    secondary: "#8B5CF6",
    cyan: "#06B6D4",
  },

  // VIP Gold accents
  gold: {
    primary: "#F59E0B",
    light: "#FBBF24",
    dark: "#D97706",
    glow: "#FCD34D",
    gradient: ["#F59E0B", "#D97706"],
  },

  // Status colors
  status: {
    won: "#10B981",
    wonGlow: "#34D399",
    wonBackground: "rgba(16, 185, 129, 0.15)",
    lost: "#EF4444",
    lostGlow: "#F87171",
    lostBackground: "rgba(239, 68, 68, 0.15)",
    pending: "#3B82F6",
    pendingGlow: "#60A5FA",
    pendingBackground: "rgba(59, 130, 246, 0.15)",
    live: "#FBBF24",
    liveGlow: "#FCD34D",
  },

  // Category badge colors
  badge: {
    free: "#10B981",
    freeGlow: "#34D399",
    vip: "#F59E0B",
    vipGlow: "#FCD34D",
    locked: "#6B7280",
  },

  // Gradients (for LinearGradient usage)
  gradients: {
    primary: ["#3B82F6", "#1D4ED8"],
    gold: ["#F59E0B", "#D97706"],
    success: ["#10B981", "#059669"],
    dark: ["#0B0F19", "#1A1F2C"],
    glass: ["rgba(255,255,255,0.1)", "rgba(255,255,255,0.05)"],
  },
} as const;

// Glassmorphism style presets
export const GlassStyles = {
  card: {
    backgroundColor: PremiumColors.glass.background,
    borderColor: PremiumColors.glass.border,
    borderWidth: 1,
    borderRadius: 16,
  },
  cardElevated: {
    backgroundColor: PremiumColors.glass.backgroundLight,
    borderColor: PremiumColors.glass.borderLight,
    borderWidth: 1,
    borderRadius: 20,
  },
  header: {
    backgroundColor: "rgba(11, 15, 25, 0.85)",
    borderBottomColor: PremiumColors.glass.border,
    borderBottomWidth: 1,
  },
  modal: {
    backgroundColor: PremiumColors.background.secondary,
    borderColor: PremiumColors.glass.borderLight,
    borderWidth: 1,
    borderRadius: 24,
  },
} as const;

// Shadow presets for glowing effects
export const GlowShadows = {
  accent: {
    shadowColor: PremiumColors.accent.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  gold: {
    shadowColor: PremiumColors.gold.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  success: {
    shadowColor: PremiumColors.status.won,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 15,
    elevation: 8,
  },
  error: {
    shadowColor: PremiumColors.status.lost,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 15,
    elevation: 8,
  },
} as const;

export type StatusType = "won" | "lost" | "pending" | "live";
export type BadgeType = "free" | "vip" | "locked";
