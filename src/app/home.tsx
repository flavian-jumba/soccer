import LegalInfoSheet from "@/components/legal-info-sheet";
import { MatchDetailModal } from "@/components/match-detail-modal";
import { AppBottomNav } from "@/components/ui/app-bottom-nav";
import { AnimatedPressableButton } from "@/components/ui/animated-pressable";
import { CategoryCard } from "@/components/ui/category-card";
import { LoadingOverlay } from "@/components/ui/loading-overlay";
import type { FullScreenModalHandle } from "@/components/ui/full-screen-modal";
import { PremiumColors } from "@/constants/colors";
import {
  FREE_TIP_CATALOG,
  resolveCatalog,
  VIP_TIP_CATALOG,
} from "@/data/category-catalog";
import type { Category, IconName } from "@/data/mockData";
import { ENV } from "@/config/env";
import { useFreeTips, useVipTips } from "@/hooks/use-categories";
import { useMatchesByCategory } from "@/hooks/use-matches";
import { useEntitlements } from "@/hooks/use-subscription";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { useRouter } from "expo-router";
import { Crown, Info, Send, ShieldCheck } from "lucide-react-native";
import React, { useCallback, useMemo, useRef, useState } from "react";
import { Image, Linking, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/**
 * Home-only preview cards. The copy is home-specific, while matches and
 * entitlement come from the VIP category named by `sourceId`. The VIP page
 * keeps the catalog titles.
 */
const UPCOMING_PREVIEWS: {
  sourceId: string;
  title: string;
  description: string;
  icon: IconName;
}[] = [
  {
    sourceId: "combo",
    title: "HT/FT Vault",
    description: "Half-time and full-time picks",
    icon: "Trophy",
  },
  {
    sourceId: "combined",
    title: "Correct Score Vault",
    description: "Exact scoreline predictions",
    icon: "Star",
  },
];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { hasCategory } = useEntitlements();
  const { categories: freeCategories, loading: freeLoading } = useFreeTips();
  const { categories: vipCategories, loading: vipLoading } = useVipTips();
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const { matches, loading: matchesLoading } = useMatchesByCategory(
    selectedCategory?.id ?? null,
  );
  const matchDetailRef = useRef<FullScreenModalHandle>(null);
  const legalInfoRef = useRef<BottomSheetModal>(null);

  const freeTips = useMemo(
    () =>
      resolveCatalog(FREE_TIP_CATALOG, freeCategories),
    [freeCategories],
  );
  const upcoming = useMemo(
    () =>
      resolveCatalog(
        UPCOMING_PREVIEWS.map(
          (preview) =>
            VIP_TIP_CATALOG.find((category) => category.id === preview.sourceId)!,
        ),
        vipCategories,
      ).map((category, index) => ({
        ...category,
        title: UPCOMING_PREVIEWS[index].title,
        description: UPCOMING_PREVIEWS[index].description,
        icon: UPCOMING_PREVIEWS[index].icon,
      })),
    [vipCategories],
  );

  const [previewLocked, setPreviewLocked] = useState(false);

  const openCategory = useCallback((category: Category, locked = false) => {
    setSelectedCategory(category);
    setPreviewLocked(locked);
    matchDetailRef.current?.present();
  }, []);

  const goToVip = useCallback(() => {
    matchDetailRef.current?.dismiss();
    router.push("/vip");
  }, [router]);

  return (
    <View style={styles.screen}>
      <LoadingOverlay isLoading={freeLoading || vipLoading} />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 18, paddingBottom: 28 },
        ]}
      >
        <View style={styles.topBar}>
          <View style={styles.brand}>
            <Image source={require("../../assets/images/icon.png")} style={styles.logo} />
            <View>
              <Text style={styles.eyebrow}>MASTER THE</Text>
              <Text style={styles.brandTitle}>Match!</Text>
            </View>
          </View>
          <View style={styles.actions}>
            <AnimatedPressableButton
              onPress={() => legalInfoRef.current?.present()}
              style={styles.iconButton}
            >
              <Info size={19} color={PremiumColors.text.secondary} />
            </AnimatedPressableButton>
          </View>
        </View>

        <Animated.View entering={FadeInDown.delay(80).springify()} style={styles.community}>
          <View style={styles.communityCopy}>
            <View style={styles.communityLabel}>
              <Crown size={13} color={PremiumColors.gold.light} />
              <Text style={styles.eyebrow}>TELEGRAM COMMUNITY</Text>
            </View>
            <Text style={styles.communityTitle}>For more updates</Text>
          </View>
          <AnimatedPressableButton
            accessibilityRole="link"
            onPress={() => Linking.openURL(ENV.COMMUNITY_URL)}
            style={styles.communityButton}
          >
            <Send size={15} color="#FFFFFF" />
            <Text style={styles.communityButtonText}>Join Community</Text>
          </AnimatedPressableButton>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(140).springify()} style={styles.section}>
          <View style={styles.sectionHeading}>
            <Text style={styles.sectionTitle}>Free Tips</Text>
            <Text style={styles.sectionCaption}>Fresh picks, updated daily</Text>
          </View>
          <View style={styles.grid}>
            {freeTips.map((category) => (
              <CategoryCard
                key={category.id}
                category={category}
                onPress={() => openCategory(category)}
              />
            ))}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(220).springify()} style={styles.section}>
          <View style={styles.sectionHeading}>
            <View style={styles.titleRow}>
              <Text style={styles.sectionTitle}>Premium Upcoming Predictions</Text>
              <ShieldCheck size={17} color={PremiumColors.gold.light} />
            </View>
            <Text style={styles.sectionCaption}>A preview of today&apos;s VIP markets</Text>
          </View>
          <View style={styles.grid}>
            {upcoming.map((category) => (
              <CategoryCard
                key={category.id}
                category={category}
                locked={!hasCategory(category.id)}
                hideLockedStatus
                onPress={() => openCategory(category, !hasCategory(category.id))}
              />
            ))}
          </View>
        </Animated.View>
      </ScrollView>

      <AppBottomNav />
      <MatchDetailModal
        ref={matchDetailRef}
        category={selectedCategory}
        matches={matches}
        loading={matchesLoading}
        lockUntilSettled={previewLocked}
        onUnlock={goToVip}
      />
      <LegalInfoSheet ref={legalInfoRef} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: PremiumColors.background.primary },
  content: { paddingHorizontal: 18, gap: 28 },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  brand: { flexDirection: "row", alignItems: "center", gap: 11 },
  logo: { width: 44, height: 44, borderRadius: 22 },
  eyebrow: {
    color: PremiumColors.text.tertiary,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.7,
  },
  brandTitle: {
    color: PremiumColors.text.primary,
    fontSize: 18,
    lineHeight: 20,
    fontWeight: "800",
  },
  actions: { flexDirection: "row", gap: 8 },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: PremiumColors.glass.background,
    borderWidth: 1,
    borderColor: PremiumColors.glass.border,
  },
  community: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 20,
    borderCurve: "continuous",
    backgroundColor: "#17131E",
    borderWidth: 1,
    borderColor: PremiumColors.glass.border,
  },
  communityCopy: { gap: 5, flexShrink: 1 },
  communityLabel: { flexDirection: "row", alignItems: "center", gap: 5 },
  communityTitle: { color: PremiumColors.text.primary, fontSize: 15, fontWeight: "700" },
  communityButton: {
    height: 42,
    paddingHorizontal: 15,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    backgroundColor: "#329DD1",
  },
  communityButtonText: { color: "#FFF", fontSize: 12, fontWeight: "700" },
  section: { gap: 14 },
  sectionHeading: { gap: 4 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  sectionTitle: {
    color: PremiumColors.text.primary,
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  sectionCaption: { color: PremiumColors.text.tertiary, fontSize: 12 },
  grid: { flexDirection: "row", gap: 10 },
});
