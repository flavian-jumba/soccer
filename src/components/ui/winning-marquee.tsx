import { PremiumColors } from "@/constants/colors";
import type { WonPrediction } from "@/data/mockData";
import { CheckCircle } from "lucide-react-native";
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

const ITEM_SIZE = 150;
const GAP = 12;

export function WinningMarquee({ predictions }: WinningMarqueeProps) {
  const translateX = useSharedValue(0);

  // Duplicate the data for seamless looping
  const duplicatedPredictions = [...predictions, ...predictions];
  const totalWidth = predictions.length * (ITEM_SIZE + GAP);

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
  return (
    <View style={styles.item}>
      {/* Green checkmark badge */}
      <View style={styles.checkBadge}>
        <CheckCircle
          size={14}
          color={PremiumColors.status.won}
          fill={PremiumColors.status.wonBackground}
        />
        <Text style={styles.wonText}>WON</Text>
      </View>

      {/* Teams */}
      <Text style={styles.teams} numberOfLines={2}>
        {prediction.homeTeam} vs {prediction.awayTeam}
      </Text>

      {/* Prediction */}
      <Text style={styles.prediction} numberOfLines={1}>
        {prediction.prediction}
      </Text>

      {/* Score */}
      <Text style={styles.score}>{prediction.score}</Text>

      {/* Odds badge */}
      <View style={styles.oddsBadge}>
        <Text style={styles.odds}>@{prediction.odds}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: ITEM_SIZE + 16,
    overflow: "hidden",
  },
  marqueeContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  item: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    backgroundColor: PremiumColors.glass.background,
    borderRadius: 16,
    padding: 14,
    marginRight: GAP,
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.25)",
    justifyContent: "space-between",
  },
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
  teams: {
    fontSize: 12,
    fontWeight: "600",
    color: PremiumColors.text.primary,
    lineHeight: 16,
  },
  prediction: {
    fontSize: 11,
    color: PremiumColors.text.secondary,
    fontWeight: "500",
  },
  score: {
    fontSize: 20,
    fontWeight: "700",
    color: PremiumColors.status.won,
    fontFamily: "monospace",
    textAlign: "center",
  },
  oddsBadge: {
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: "center",
  },
  odds: {
    fontSize: 12,
    fontWeight: "700",
    color: PremiumColors.status.won,
    fontFamily: "monospace",
  },
});

export default WinningMarquee;
