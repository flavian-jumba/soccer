import LegalInfoSheet from "@/components/legal-info-sheet";
import MatchDetailSheet from "@/components/match-detail-sheet";
import { CategoryCard } from "@/components/ui/category-card";
import { GlassCard } from "@/components/ui/glass-card";
import { Header } from "@/components/ui/header";
import { WinningMarquee } from "@/components/ui/winning-marquee";
import VipPromptSheet from "@/components/vip-prompt-sheet";
import { PremiumColors } from "@/constants/colors";
import {
    freeCategories,
    getMatchesByCategory,
    getTotalWinRate,
    getWonMatchesCount,
    vipCategories,
    wonPredictions,
    type Category,
    type Match,
} from "@/data/mockData";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { Crown, TrendingUp, Zap } from "lucide-react-native";
import React, { useCallback, useRef, useState } from "react";
import { FlatList, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown, FadeInRight } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function HomeScreen() {
  const insets = useSafeAreaInsets();

  // Bottom sheet refs
  const matchDetailRef = useRef<BottomSheetModal>(null);
  const vipPromptRef = useRef<BottomSheetModal>(null);
  const legalInfoRef = useRef<BottomSheetModal>(null);

  // State for selected category
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null,
  );
  const [selectedMatches, setSelectedMatches] = useState<Match[]>([]);

  const handleCategoryPress = useCallback((category: Category) => {
    if (category.isVip) {
      // Show VIP prompt for VIP categories
      vipPromptRef.current?.present();
    } else {
      // Show match details for free categories
      const matches = getMatchesByCategory(category.id);
      setSelectedCategory(category);
      setSelectedMatches(matches);
      matchDetailRef.current?.present();
    }
  }, []);

  const handleVipSubscribe = useCallback(() => {
    // Handle subscription - in real app would open payment flow
    vipPromptRef.current?.dismiss();
  }, []);

  const handleInfoPress = useCallback(() => {
    legalInfoRef.current?.present();
  }, []);

  const winRate = getTotalWinRate();
  const wonCount = getWonMatchesCount();

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      {/* Sticky Header */}
      <Header title="VistaScores" onInfoPress={handleInfoPress} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Stats Banner */}
        <Animated.View entering={FadeInDown.delay(100).springify()}>
          <GlassCard variant="elevated" style={styles.statsBanner}>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <View style={[styles.statIcon, styles.statIconWon]}>
                  <TrendingUp size={18} color={PremiumColors.status.won} />
                </View>
                <View>
                  <Text style={styles.statValue}>{winRate}%</Text>
                  <Text style={styles.statLabel}>Win Rate</Text>
                </View>
              </View>

              <View style={styles.statDivider} />

              <View style={styles.statItem}>
                <View style={[styles.statIcon, styles.statIconAccent]}>
                  <Zap size={18} color={PremiumColors.accent.primary} />
                </View>
                <View>
                  <Text style={styles.statValue}>{wonCount}</Text>
                  <Text style={styles.statLabel}>Tips Won</Text>
                </View>
              </View>

              <View style={styles.statDivider} />

              <View style={styles.statItem}>
                <View style={[styles.statIcon, styles.statIconGold]}>
                  <Crown size={18} color={PremiumColors.gold.primary} />
                </View>
                <View>
                  <Text style={styles.statValue}>VIP</Text>
                  <Text style={styles.statLabel}>Premium</Text>
                </View>
              </View>
            </View>
          </GlassCard>
        </Animated.View>

        {/* Free Tips Section */}
        <Animated.View entering={FadeInDown.delay(200).springify()}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Zap size={20} color={PremiumColors.accent.primary} />
              <Text style={styles.sectionTitle}>Free Tips</Text>
            </View>
            <Text style={styles.sectionSubtitle}>
              Daily predictions for everyone
            </Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInRight.delay(300).springify()}>
          <FlatList
            data={freeCategories}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.categoryList}
            renderItem={({ item, index }) => (
              <Animated.View entering={FadeInRight.delay(300 + index * 100)}>
                <CategoryCard
                  category={item}
                  onPress={() => handleCategoryPress(item)}
                />
              </Animated.View>
            )}
          />
        </Animated.View>

        {/* VIP Tips Section */}
        <Animated.View entering={FadeInDown.delay(400).springify()}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Crown size={20} color={PremiumColors.gold.primary} />
              <Text style={[styles.sectionTitle, styles.vipSectionTitle]}>
                VIP Tips
              </Text>
              <View style={styles.vipBadge}>
                <Text style={styles.vipBadgeText}>PREMIUM</Text>
              </View>
            </View>
            <Text style={styles.sectionSubtitle}>
              Exclusive high-accuracy predictions
            </Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInRight.delay(500).springify()}>
          <FlatList
            data={vipCategories}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.categoryList}
            renderItem={({ item, index }) => (
              <Animated.View entering={FadeInRight.delay(500 + index * 100)}>
                <CategoryCard
                  category={item}
                  onPress={() => handleCategoryPress(item)}
                />
              </Animated.View>
            )}
          />
        </Animated.View>

        {/* Recently Won Section */}
        <Animated.View entering={FadeInDown.delay(600).springify()}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <View style={styles.wonIndicator} />
              <Text style={styles.sectionTitle}>Recently Won</Text>
            </View>
            <Text style={styles.sectionSubtitle}>
              Latest winning predictions
            </Text>
          </View>
        </Animated.View>

        {/* Winning Marquee */}
        <Animated.View entering={FadeInDown.delay(700).springify()}>
          <WinningMarquee predictions={wonPredictions} />
        </Animated.View>

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Bottom Sheets */}
      <MatchDetailSheet
        ref={matchDetailRef}
        category={selectedCategory}
        matches={selectedMatches}
      />

      <VipPromptSheet ref={vipPromptRef} onSubscribe={handleVipSubscribe} />

      <LegalInfoSheet ref={legalInfoRef} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PremiumColors.background.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 16,
  },
  statsBanner: {
    marginHorizontal: 16,
    marginBottom: 24,
    padding: 16,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  statIconWon: {
    backgroundColor: PremiumColors.status.wonBackground,
  },
  statIconAccent: {
    backgroundColor: "rgba(59, 130, 246, 0.15)",
  },
  statIconGold: {
    backgroundColor: "rgba(245, 158, 11, 0.15)",
  },
  statValue: {
    fontSize: 18,
    fontWeight: "700",
    color: PremiumColors.text.primary,
    fontFamily: "monospace",
  },
  statLabel: {
    fontSize: 11,
    color: PremiumColors.text.tertiary,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: PremiumColors.glass.border,
  },
  sectionHeader: {
    paddingHorizontal: 20,
    marginBottom: 16,
    marginTop: 8,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: PremiumColors.text.primary,
  },
  vipSectionTitle: {
    color: PremiumColors.gold.light,
  },
  vipBadge: {
    backgroundColor: "rgba(245, 158, 11, 0.2)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginLeft: 4,
  },
  vipBadgeText: {
    fontSize: 9,
    fontWeight: "800",
    color: PremiumColors.gold.primary,
    letterSpacing: 0.5,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: PremiumColors.text.tertiary,
  },
  categoryList: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  wonIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: PremiumColors.status.won,
  },
  bottomSpacer: {
    height: 40,
  },
});
