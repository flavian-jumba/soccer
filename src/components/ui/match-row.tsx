import { PremiumColors } from "@/constants/colors";
import type { Match } from "@/data/mockData";
import { Calendar, Clock, TrendingUp } from "lucide-react-native";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface MatchRowProps {
  match: Match;
}

export function MatchRow({ match }: MatchRowProps) {
  const statusConfig = {
    won: {
      label: "WON",
      bgColor: PremiumColors.status.wonBackground,
      textColor: PremiumColors.status.won,
      borderColor: "rgba(16, 185, 129, 0.3)",
    },
    lost: {
      label: "LOST",
      bgColor: PremiumColors.status.lostBackground,
      textColor: PremiumColors.status.lost,
      borderColor: "rgba(239, 68, 68, 0.3)",
    },
    pending: {
      label: "PENDING",
      bgColor: PremiumColors.status.pendingBackground,
      textColor: PremiumColors.status.pending,
      borderColor: "rgba(59, 130, 246, 0.3)",
    },
  };

  const status = statusConfig[match.status];
  const predictionColor =
    match.status === "won"
      ? PremiumColors.status.won
      : match.status === "lost"
        ? PremiumColors.status.lost
        : PremiumColors.gold.primary;

  return (
    <View style={styles.container}>
      {/* Top Row: Date | Status | Odds */}
      <View style={styles.topRow}>
        {/* Date */}
        <View style={styles.dateContainer}>
          <Calendar size={14} color={PremiumColors.text.tertiary} />
          <Text style={styles.dateText}>{match.date}</Text>
        </View>

        {/* Status Badge */}
        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor: status.bgColor,
              borderColor: status.borderColor,
            },
          ]}
        >
          <Clock size={12} color={status.textColor} />
          <Text style={[styles.statusText, { color: status.textColor }]}>
            {status.label}
          </Text>
        </View>

        {/* Odds Badge */}
        <View style={styles.oddsBadge}>
          <TrendingUp size={14} color={PremiumColors.status.won} />
          <Text style={styles.oddsText}>{match.odds}</Text>
        </View>
      </View>

      {/* League */}
      <Text style={styles.league}>{match.league}</Text>

      {/* Teams Row - Side by Side */}
      <View style={styles.teamsRow}>
        <Text style={styles.homeTeam} numberOfLines={1}>
          {match.homeTeam}
        </Text>
        <Text style={styles.vsText}>vs</Text>
        <Text style={styles.awayTeam} numberOfLines={1}>
          {match.awayTeam}
        </Text>
      </View>

      {/* Score (if available) */}
      {match.score && (
        <View style={styles.scoreContainer}>
          <Text style={[styles.scoreText, { color: status.textColor }]}>
            {match.score}
          </Text>
        </View>
      )}

      {/* Prediction Bar */}
      <View style={styles.predictionBar}>
        <Text style={styles.predictionLabel}>Prediction:</Text>
        <Text style={[styles.predictionValue, { color: predictionColor }]}>
          {match.prediction}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: PremiumColors.glass.background,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: PremiumColors.glass.border,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dateText: {
    fontSize: 12,
    color: PremiumColors.text.secondary,
    fontFamily: "monospace",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
    fontFamily: "monospace",
  },
  oddsBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.2)",
  },
  oddsText: {
    fontSize: 13,
    fontWeight: "700",
    color: PremiumColors.status.won,
    fontFamily: "monospace",
  },
  league: {
    fontSize: 11,
    fontWeight: "500",
    color: PremiumColors.text.tertiary,
    marginBottom: 12,
    fontStyle: "italic",
  },
  teamsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    gap: 16,
  },
  homeTeam: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: PremiumColors.text.primary,
    textAlign: "center",
    fontStyle: "italic",
  },
  vsText: {
    fontSize: 13,
    color: PremiumColors.text.tertiary,
    fontWeight: "400",
    fontStyle: "italic",
  },
  awayTeam: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: PremiumColors.text.primary,
    textAlign: "center",
    fontStyle: "italic",
  },
  scoreContainer: {
    alignItems: "center",
    marginBottom: 12,
  },
  scoreText: {
    fontSize: 24,
    fontWeight: "700",
    fontFamily: "monospace",
    letterSpacing: 2,
  },
  predictionBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 6,
  },
  predictionLabel: {
    fontSize: 13,
    color: PremiumColors.text.tertiary,
    fontStyle: "italic",
  },
  predictionValue: {
    fontSize: 14,
    fontWeight: "700",
    fontStyle: "italic",
  },
});

export default MatchRow;
