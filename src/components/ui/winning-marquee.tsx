import { PremiumColors } from "@/constants/colors";
import type { WonPrediction } from "@/data/mockData";
import { CheckCircle, Crown } from "lucide-react-native";
import React, { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming,
} from "react-native-reanimated";

interface WinningMarqueeProps {
  predictions: WonPrediction[];
}

const ITEM_WIDTH = 220;
const ITEM_HEIGHT = 170;
const GAP = 12;

export function WinningMarquee({ predictions }: WinningMarqueeProps) {
  const translateX = useSharedValue(0);

  // Duplicate the data for seamless looping
  const duplicatedPredictions = [...predictions, ...predictions];
  const totalWidth = predictions.length * (ITEM_WIDTH + GAP);

  useEffect(() => {
    translateX.value = 0;
    translateX.value = withRepeat(
      withTiming(-totalWidth, {
        duration: predictions.length * 8000,
        easing: Easing.linear,
      }),
      -1,
      false,
    );
  }, [predictions.length, totalWidth, translateX]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.marqueeContent, animatedStyle]}>
        {duplicatedPredictions.map((prediction, index) => (
          <WonItem key={`${prediction.id}-${index}`} prediction={prediction} />
        ))}
      </Animated.View>
    </View>
  );
}

function WonItem({ prediction }: { prediction: WonPrediction }) {
  const isVip = prediction.isVip;

  return (
    <View style={[styles.item, isVip && styles.vipItem]}>
      {/* VIP golden shimmer top bar */}
      {isVip && <View style={styles.vipTopBar} />}

      {/* Badge row */}
      {isVip ? (
        <View style={styles.vipBadgeRow}>
          <View style={styles.crownBadge}>
            <Crown
              size={12}
              color={PremiumColors.gold.glow}
              fill={PremiumColors.gold.primary}
            />
            <Text style={styles.vipBadgeText}>VIP</Text>
          </View>
          <View style={styles.wonBadgeVip}>
            <CheckCircle
              size={12}
              color={PremiumColors.gold.light}
              fill="rgba(245,158,11,0.2)"
            />
            <Text style={styles.wonTextVip}>WON</Text>
          </View>
        </View>
      ) : (
        <View style={styles.checkBadge}>
          <CheckCircle
            size={14}
            color={PremiumColors.status.won}
            fill={PremiumColors.status.wonBackground}
          />
          <Text style={styles.wonText}>WON</Text>
        </View>
      )}

      {/* Teams VS row */}
      <View style={styles.teamsRow}>
        <Text
          style={[styles.teamName, isVip && styles.teamNameVip]}
          numberOfLines={2}
        >
          {prediction.homeTeam}
        </Text>
        <View style={styles.vsContainer}>
          <Text style={[styles.vsText, isVip && styles.vsTextVip]}>VS</Text>
        </View>
        <Text
          style={[
            styles.teamName,
            styles.teamNameRight,
            isVip && styles.teamNameVip,
          ]}
          numberOfLines={2}
        >
          {prediction.awayTeam}
        </Text>
      </View>

      {/* Prediction */}
      <Text
        style={[styles.prediction, isVip && styles.predictionVip]}
        numberOfLines={1}
      >
        {prediction.prediction}
      </Text>

      {/* Score */}
      <Text style={[styles.score, isVip && styles.scoreVip]}>
        {prediction.score}
      </Text>

      {/* Odds badge */}
      <View style={[styles.oddsBadge, isVip && styles.oddsBadgeVip]}>
        <Text style={[styles.odds, isVip && styles.oddsVip]}>
          @{prediction.odds}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: ITEM_HEIGHT + 16,
    overflow: "hidden",
  },
  marqueeContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  item: {
    width: ITEM_WIDTH,
    height: ITEM_HEIGHT,
    backgroundColor: PremiumColors.glass.background,
    borderRadius: 16,
    padding: 14,
    marginRight: GAP,
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.25)",
    justifyContent: "space-between",
    overflow: "hidden",
  },
  // --- VIP item overrides ---
  vipItem: {
    backgroundColor: "rgba(245, 158, 11, 0.08)",
    borderColor: PremiumColors.gold.primary,
    borderWidth: 1.5,
  },
  vipTopBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: PremiumColors.gold.primary,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  vipBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  crownBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(245, 158, 11, 0.2)",
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.5)",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  vipBadgeText: {
    fontSize: 9,
    fontWeight: "800",
    color: PremiumColors.gold.light,
    letterSpacing: 0.5,
  },
  wonBadgeVip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(245, 158, 11, 0.12)",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 3,
  },
  wonTextVip: {
    fontSize: 9,
    fontWeight: "800",
    color: PremiumColors.gold.glow,
    letterSpacing: 0.5,
  },
  // --- Standard badge ---
  checkBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: PremiumColors.status.wonBackground,
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  wonText: {
    fontSize: 9,
    fontWeight: "800",
    color: PremiumColors.status.won,
    letterSpacing: 0.5,
  },
  // --- Teams VS row ---
  teamsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 4,
  },
  teamName: {
    flex: 1,
    fontSize: 12,
    fontWeight: "700",
    color: PremiumColors.text.primary,
    textAlign: "center",
    lineHeight: 16,
  },
  teamNameRight: {
    textAlign: "center",
  },
  teamNameVip: {
    color: PremiumColors.gold.glow,
  },
  vsContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.07)",
    justifyContent: "center",
    alignItems: "center",
  },
  vsText: {
    fontSize: 9,
    fontWeight: "900",
    color: PremiumColors.text.tertiary,
    letterSpacing: 0.5,
  },
  vsTextVip: {
    color: PremiumColors.gold.dark,
  },
  prediction: {
    fontSize: 11,
    color: PremiumColors.text.secondary,
    fontWeight: "500",
  },
  predictionVip: {
    color: PremiumColors.gold.light,
  },
  score: {
    fontSize: 20,
    fontWeight: "700",
    color: PremiumColors.status.won,
    fontFamily: "monospace",
    textAlign: "center",
  },
  scoreVip: {
    color: PremiumColors.gold.primary,
  },
  oddsBadge: {
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: "center",
  },
  oddsBadgeVip: {
    backgroundColor: "rgba(245, 158, 11, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.3)",
  },
  odds: {
    fontSize: 12,
    fontWeight: "700",
    color: PremiumColors.status.won,
    fontFamily: "monospace",
  },
  oddsVip: {
    color: PremiumColors.gold.primary,
  },
});

export default WinningMarquee;
