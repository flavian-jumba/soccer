import LegalInfoSheet from "@/components/legal-info-sheet";
import MatchDetailSheet from "@/components/match-detail-sheet";
import NotificationsSheet from "@/components/notifications-sheet";
import { CategoryCard } from "@/components/ui/category-card";
import { GlassCard } from "@/components/ui/glass-card";
import { Header } from "@/components/ui/header";
import { WinningMarquee } from "@/components/ui/winning-marquee";
import VipPromptSheet from "@/components/vip-prompt-sheet";
import { PremiumColors } from "@/constants/colors";
import type { Category } from "@/data/mockData";
import { useFreeTips, useVipTips } from "@/hooks/use-categories";
import { useMatchesByCategory, useMatchStats } from "@/hooks/use-matches";
import { useNotifications } from "@/hooks/use-notifications";
import { useWonPredictions } from "@/hooks/use-won-predictions";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { Crown, TrendingUp, Zap } from "lucide-react-native";
import React, { useCallback, useRef, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import Animated, { FadeInDown, FadeInRight } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function HomeScreen() {
  const insets = useSafeAreaInsets();

  // ── Firestore data ──────────────────────────────────────────────────────────
  const { categories: freeCategories, loading: freeCatsLoading } =
    useFreeTips();
  const { categories: vipCategories, loading: vipCatsLoading } = useVipTips();
  const { predictions: wonPredictions, loading: wonLoading } =
    useWonPredictions();
  const { wonCount, winRate } = useMatchStats();
  const { notifications, unreadCount, markAllRead } = useNotifications();

  // ── Selected category for the match detail sheet ────────────────────────────
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null,
  );
  const { matches: selectedMatches } = useMatchesByCategory(
    selectedCategory?.id ?? null,
  );

  // ── Bottom sheet refs ───────────────────────────────────────────────────────
  const matchDetailRef = useRef<BottomSheetModal>(null);
  const vipPromptRef = useRef<BottomSheetModal>(null);
  const legalInfoRef = useRef<BottomSheetModal>(null);
  const notificationsRef = useRef<BottomSheetModal>(null);

  const handleCategoryPress = useCallback((category: Category) => {
    if (category.isVip) {
      vipPromptRef.current?.present();
    } else {
      setSelectedCategory(category);
      matchDetailRef.current?.present();
    }
  }, []);

  const handleVipSubscribe = useCallback(() => {
    vipPromptRef.current?.dismiss();
  }, []);

  const handleInfoPress = useCallback(() => {
    legalInfoRef.current?.present();
  }, []);

  const handleNotificationPress = useCallback(() => {
    notificationsRef.current?.present();
    markAllRead();
  }, [markAllRead]);

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      {/* Sticky Header */}
      <Header
        onInfoPress={handleInfoPress}
        onNotificationPress={handleNotificationPress}
        unreadCount={unreadCount}
      />

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
          {freeCatsLoading ? (
            <ActivityIndicator
              size="small"
              color={PremiumColors.accent.primary}
              style={styles.loader}
            />
          ) : (
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
          )}
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
          {vipCatsLoading ? (
            <ActivityIndicator
              size="small"
              color={PremiumColors.gold.primary}
              style={styles.loader}
            />
          ) : (
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
          )}
        </Animated.View>

        {/* Recently Won Section */}
        <Animated.View entering={FadeInDown.delay(600).springify()}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <View style={styles.wonIndicator} />
              <Text style={styles.sectionTitle}>Recently Won</Text>
              <Crown size={16} color={PremiumColors.gold.primary} />
            </View>
            <Text style={styles.sectionSubtitle}>
              Latest winning predictions · Gold = VIP
            </Text>
          </View>
        </Animated.View>

        {/* Winning Marquee */}
        <Animated.View entering={FadeInDown.delay(700).springify()}>
          {wonLoading ? (
            <ActivityIndicator
              size="small"
              color={PremiumColors.status.won}
              style={styles.loader}
            />
          ) : (
            <WinningMarquee predictions={wonPredictions} />
          )}
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

      <NotificationsSheet
        ref={notificationsRef}
        notifications={notifications}
        onMarkAllRead={markAllRead}
      />
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
  loader: {
    marginVertical: 24,
  },
  bottomSpacer: {
    height: 40,
  },
});
