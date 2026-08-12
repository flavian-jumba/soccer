import { PremiumColors } from "@/constants/colors";
import { isSettled, resultStatus } from "@/constants/result-status";
import type { Match } from "@/data/mockData";
import { Flag, Lock } from "lucide-react-native";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { StatusBadge } from "./status-badge";

interface MatchRowProps {
  match: Match;
  /**
   * Preview mode. Hides both the pick and the odds behind a Premium badge until
   * the match is settled — a visible price is most of the tip, so showing it
   * would give the selection away.
   */
  lockUntilSettled?: boolean;
}

export function MatchRow({ match, lockUntilSettled = false }: MatchRowProps) {
  const status = resultStatus(match.status);
  const settled = isSettled(match.status);
  const locked = lockUntilSettled && !settled;
  const { Icon } = status;

  return (
    <View style={styles.card}>
      {/* League strip */}
      <View style={styles.strip}>
        <View style={styles.stripLeft}>
          <Flag size={13} color={PremiumColors.text.secondary} strokeWidth={2.2} />
          <Text style={styles.league} numberOfLines={1}>
            {match.league}
          </Text>
        </View>
        <StatusBadge status={match.status} size="small" />
      </View>

      {/* Kickoff | teams | odds */}
      <View style={styles.body}>
        <View style={styles.when}>
          <Text style={styles.date}>{match.date}</Text>
          <Text style={styles.time}>{match.time}</Text>
        </View>
        <View style={styles.rule} />

        <View style={styles.teams}>
          <View style={styles.teamRow}>
            <View style={styles.dot} />
            <Text style={styles.team} numberOfLines={1}>
              {match.homeTeam}
            </Text>
          </View>
          <View style={styles.teamRow}>
            <View style={styles.dot} />
            <Text style={styles.team} numberOfLines={1}>
              {match.awayTeam}
            </Text>
          </View>
        </View>

        <View style={styles.right}>
          {locked ? (
            <View
              accessible
              accessibilityRole="text"
              accessibilityLabel="Premium odds, revealed once the result is in"
              style={styles.premiumBadge}
            >
              <Lock size={10} color={PremiumColors.gold.light} strokeWidth={2.4} />
              <Text style={styles.premiumText}>Premium</Text>
            </View>
          ) : (
            <View style={styles.oddsChip}>
              <Text style={styles.oddsText}>{match.odds}</Text>
            </View>
          )}
          {locked ? (
            <Text style={styles.masked}>•••</Text>
          ) : match.score ? (
            <Text style={styles.score}>{match.score}</Text>
          ) : (
            <Icon size={13} color={status.color} strokeWidth={2.2} />
          )}
        </View>
      </View>

      {/* Prediction */}
      <View style={styles.footer}>
        {locked ? (
          <View style={styles.lockRow}>
            <Lock size={12} color={PremiumColors.text.tertiary} strokeWidth={2.2} />
            <Text style={styles.lockText}>Revealed once the result is in</Text>
          </View>
        ) : (
          <Text style={[styles.prediction, { color: status.color }]} numberOfLines={1}>
            {match.prediction}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: PremiumColors.background.tertiary,
    borderRadius: 14,
    borderCurve: "continuous",
    borderWidth: 1,
    borderColor: PremiumColors.glass.border,
    overflow: "hidden",
    marginBottom: 10,
  },
  strip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: PremiumColors.background.elevated,
  },
  stripLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  league: {
    flex: 1,
    fontSize: 12,
    fontWeight: "600",
    color: PremiumColors.text.primary,
  },
  premiumBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderCurve: "continuous",
    backgroundColor: "rgba(245, 158, 11, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.28)",
  },
  premiumText: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.2,
    color: PremiumColors.gold.light,
  },
  body: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  when: {
    width: 62,
    gap: 2,
  },
  date: {
    fontSize: 11,
    fontWeight: "600",
    color: PremiumColors.text.secondary,
  },
  time: {
    fontSize: 11,
    fontWeight: "600",
    color: PremiumColors.text.tertiary,
  },
  rule: {
    alignSelf: "stretch",
    width: 1,
    backgroundColor: PremiumColors.glass.border,
  },
  teams: {
    flex: 1,
    gap: 6,
  },
  teamRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: PremiumColors.text.muted,
  },
  team: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: PremiumColors.text.primary,
  },
  /** Fixed width so a locked "Premium" pill and a revealed odds chip align. */
  right: {
    width: 76,
    alignItems: "center",
    gap: 5,
  },
  oddsChip: {
    minWidth: 48,
    alignItems: "center",
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
    borderCurve: "continuous",
    backgroundColor: PremiumColors.glass.backgroundLight,
    borderWidth: 1,
    borderColor: PremiumColors.glass.border,
  },
  oddsText: {
    fontSize: 13,
    fontWeight: "700",
    color: PremiumColors.gold.light,
  },
  masked: {
    fontSize: 12,
    fontWeight: "700",
    color: PremiumColors.text.muted,
    letterSpacing: 1.5,
  },
  score: {
    fontSize: 12,
    fontWeight: "700",
    color: PremiumColors.text.secondary,
    letterSpacing: 0.5,
  },
  footer: {
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderTopWidth: 1,
    borderTopColor: PremiumColors.glass.border,
  },
  prediction: {
    fontSize: 13,
    fontWeight: "700",
  },
  lockRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  lockText: {
    fontSize: 12,
    fontWeight: "500",
    color: PremiumColors.text.tertiary,
  },
});

export default MatchRow;
