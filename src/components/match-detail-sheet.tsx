import { PremiumColors } from "@/constants/colors";
import type { Category, Match } from "@/data/mockData";
import {
    BottomSheetBackdrop,
    BottomSheetBackdropProps,
    BottomSheetFlatList,
    BottomSheetModal,
} from "@gorhom/bottom-sheet";
import React, { forwardRef, useCallback, useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { MatchRow } from "./ui/match-row";

interface MatchDetailSheetProps {
  category: Category | null;
  matches: Match[];
}

const MatchDetailSheet = forwardRef<BottomSheetModal, MatchDetailSheetProps>(
  ({ category, matches }, ref) => {
    const snapPoints = useMemo(() => ["50%", "90%"], []);

    const renderBackdrop = useCallback(
      (props: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop
          {...props}
          disappearsOnIndex={-1}
          appearsOnIndex={0}
          opacity={0.7}
        />
      ),
      [],
    );

    const wonCount = matches.filter((m) => m.status === "won").length;
    const pendingCount = matches.filter((m) => m.status === "pending").length;

    return (
      <BottomSheetModal
        ref={ref}
        snapPoints={snapPoints}
        backdropComponent={renderBackdrop}
        backgroundStyle={styles.sheetBackground}
        handleIndicatorStyle={styles.handleIndicator}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.categoryTitle}>
              {category?.title ?? "Predictions"}
            </Text>
            <Text style={styles.categoryDescription}>
              {category?.description}
            </Text>
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

        {/* Match List */}
        <BottomSheetFlatList<Match>
          data={matches}
          keyExtractor={(item: Match) => item.id}
          renderItem={({ item }: { item: Match }) => <MatchRow match={item} />}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      </BottomSheetModal>
    );
  },
);

MatchDetailSheet.displayName = "MatchDetailSheet";

const styles = StyleSheet.create({
  sheetBackground: {
    backgroundColor: PremiumColors.background.secondary,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  handleIndicator: {
    backgroundColor: PremiumColors.glass.borderLight,
    width: 40,
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: PremiumColors.glass.border,
  },
  categoryTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: PremiumColors.text.primary,
    marginBottom: 4,
  },
  categoryDescription: {
    fontSize: 13,
    color: PremiumColors.text.tertiary,
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: "row",
    gap: 12,
  },
  statItem: {
    backgroundColor: PremiumColors.glass.background,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: PremiumColors.glass.border,
  },
  statItemWon: {
    backgroundColor: PremiumColors.status.wonBackground,
    borderColor: "rgba(16, 185, 129, 0.3)",
  },
  statItemPending: {
    backgroundColor: PremiumColors.status.pendingBackground,
    borderColor: "rgba(59, 130, 246, 0.3)",
  },
  statValue: {
    fontSize: 18,
    fontWeight: "700",
    color: PremiumColors.text.primary,
    fontFamily: "monospace",
  },
  statValueWon: {
    color: PremiumColors.status.won,
  },
  statValuePending: {
    color: PremiumColors.status.pending,
  },
  statLabel: {
    fontSize: 10,
    color: PremiumColors.text.tertiary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 2,
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
});

export default MatchDetailSheet;
