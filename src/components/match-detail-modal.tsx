import { AnimatedPressableButton } from "@/components/ui/animated-pressable";
import {
  FullScreenModal,
  type FullScreenModalHandle,
} from "@/components/ui/full-screen-modal";
import { PremiumColors } from "@/constants/colors";
import type { Category, Match } from "@/data/mockData";
import { ArrowLeft, CalendarClock, Crown } from "lucide-react-native";
import React, { forwardRef } from "react";
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MatchRow } from "./ui/match-row";

interface MatchDetailModalProps {
  category: Category | null;
  matches: Match[];
  /** True while this market's tips are still being fetched. */
  loading?: boolean;
  /** Preview mode: hide picks and odds on matches that are not settled yet. */
  lockUntilSettled?: boolean;
  /** Shows an unlock call to action under the list while in preview mode. */
  onUnlock?: () => void;
}

/** Opens as a full page — the list is readable the moment it appears. */
export const MatchDetailModal = forwardRef<
  FullScreenModalHandle,
  MatchDetailModalProps
>(({ category, matches, loading = false, lockUntilSettled = false, onUnlock }, ref) => {
  const insets = useSafeAreaInsets();

  const wonCount = matches.filter((match) => match.status === "won").length;
  const pendingCount = matches.filter(
    (match) => match.status === "pending",
  ).length;

  return (
    <FullScreenModal ref={ref}>
      {(close) => (
        <>
          <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
            <View style={styles.titleRow}>
              <AnimatedPressableButton
                accessibilityRole="button"
                accessibilityLabel="Close predictions"
                onPress={close}
                style={styles.back}
              >
                <ArrowLeft size={20} color={PremiumColors.text.primary} />
              </AnimatedPressableButton>
              <View style={styles.headings}>
                <Text style={styles.categoryTitle} numberOfLines={1}>
                  {category?.title ?? "Predictions"}
                </Text>
                {category?.description && (
                  <Text style={styles.categoryDescription} numberOfLines={1}>
                    {category.description}
                  </Text>
                )}
              </View>
            </View>

            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{matches.length}</Text>
                <Text style={styles.statLabel}>Total</Text>
              </View>
              <View style={[styles.statItem, styles.statItemWon]}>
                <Text style={[styles.statValue, styles.statValueWon]}>
                  {wonCount}
                </Text>
                <Text style={styles.statLabel}>Won</Text>
              </View>
              <View style={[styles.statItem, styles.statItemPending]}>
                <Text style={[styles.statValue, styles.statValuePending]}>
                  {pendingCount}
                </Text>
                <Text style={styles.statLabel}>Pending</Text>
              </View>
            </View>
          </View>

          <FlatList<Match>
            data={matches}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <MatchRow match={item} lockUntilSettled={lockUntilSettled} />
            )}
            contentContainerStyle={[
              styles.listContent,
              matches.length === 0 && styles.listContentEmpty,
            ]}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              // "Nothing published yet" is a claim about the market, not about
              // the network — showing it while the fetch is still in flight
              // tells a user who has just subscribed that they bought nothing.
              loading ? (
                <View style={styles.empty}>
                  <ActivityIndicator color={PremiumColors.gold.light} />
                  <Text style={styles.emptyTitle}>Loading predictions</Text>
                </View>
              ) : (
                <View style={styles.empty}>
                  <CalendarClock size={26} color={PremiumColors.text.muted} />
                  <Text style={styles.emptyTitle}>Nothing published yet</Text>
                  <Text style={styles.emptyText}>
                    Today&apos;s selections for this market have not been released.
                    Check back closer to kickoff.
                  </Text>
                </View>
              )
            }
          />

          {lockUntilSettled && onUnlock && (
            <View style={[styles.unlockBar, { paddingBottom: insets.bottom + 16 }]}>
              <AnimatedPressableButton
                accessibilityRole="button"
                accessibilityLabel="Unlock this VIP market"
                onPress={onUnlock}
                style={styles.unlockButton}
              >
                <Crown size={15} color="#1A1206" />
                <Text style={styles.unlockText}>Unlock this market</Text>
              </AnimatedPressableButton>
              <Text style={styles.unlockCaption}>
                Predictions and odds are revealed to subscribers, or to everyone
                once the result is in.
              </Text>
            </View>
          )}
        </>
      )}
    </FullScreenModal>
  );
});

MatchDetailModal.displayName = "MatchDetailModal";

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 18,
    paddingBottom: 16,
    gap: 16,
    borderBottomWidth: 1,
    borderBottomColor: PremiumColors.glass.border,
    backgroundColor: PremiumColors.background.secondary,
  },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  back: {
    width: 40,
    height: 40,
    borderRadius: 14,
    borderCurve: "continuous",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: PremiumColors.glass.border,
    backgroundColor: PremiumColors.glass.background,
  },
  headings: { flex: 1, gap: 3 },
  categoryTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: PremiumColors.text.primary,
    letterSpacing: -0.4,
  },
  categoryDescription: {
    fontSize: 12.5,
    color: PremiumColors.text.tertiary,
  },
  statsContainer: { flexDirection: "row", gap: 10 },
  statItem: {
    backgroundColor: PremiumColors.glass.background,
    borderRadius: 12,
    borderCurve: "continuous",
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: PremiumColors.glass.border,
  },
  statItemWon: {
    backgroundColor: PremiumColors.result.wonSurface,
    borderColor: PremiumColors.result.wonBorder,
  },
  statItemPending: {
    backgroundColor: PremiumColors.result.pendingSurface,
    borderColor: PremiumColors.result.pendingBorder,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "700",
    color: PremiumColors.text.primary,
    fontFamily: "monospace",
  },
  statValueWon: { color: PremiumColors.result.won },
  statValuePending: { color: PremiumColors.result.pending },
  statLabel: {
    fontSize: 10,
    color: PremiumColors.text.tertiary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 2,
  },
  listContent: { padding: 16, paddingBottom: 32 },
  listContentEmpty: { flexGrow: 1, justifyContent: "center" },
  empty: { alignItems: "center", gap: 8, paddingHorizontal: 32 },
  emptyTitle: {
    color: PremiumColors.text.secondary,
    fontSize: 15,
    fontWeight: "700",
  },
  emptyText: {
    color: PremiumColors.text.tertiary,
    fontSize: 12.5,
    lineHeight: 18,
    textAlign: "center",
  },
  unlockBar: {
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: PremiumColors.glass.border,
    backgroundColor: PremiumColors.background.secondary,
  },
  unlockButton: {
    minHeight: 46,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 14,
    borderCurve: "continuous",
    backgroundColor: PremiumColors.gold.primary,
  },
  unlockText: { color: "#1A1206", fontSize: 14, fontWeight: "800" },
  unlockCaption: {
    color: PremiumColors.text.tertiary,
    fontSize: 11,
    lineHeight: 16,
    textAlign: "center",
  },
});

export default MatchDetailModal;
