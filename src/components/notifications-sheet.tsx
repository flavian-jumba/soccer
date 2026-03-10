import { PremiumColors } from "@/constants/colors";
import type { AppNotification } from "@/hooks/use-notifications";
import {
    BottomSheetBackdrop,
    BottomSheetBackdropProps,
    BottomSheetFlatList,
    BottomSheetModal,
} from "@gorhom/bottom-sheet";
import type { Timestamp } from "firebase/firestore";
import { Bell, Clock, Crown, Sparkles, TrendingUp } from "lucide-react-native";
import React, { forwardRef, useCallback, useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

interface NotificationsSheetProps {
  notifications: AppNotification[];
  onMarkAllRead: () => void;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatTimeAgo(createdAt: Timestamp | undefined): string {
  if (!createdAt) return "";
  const diff = Date.now() - createdAt.toMillis();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const TYPE_CONFIG = {
  new_tips: {
    Icon: Sparkles,
    color: PremiumColors.accent.primary,
    bg: PremiumColors.status.pendingBackground,
  },
  result: {
    Icon: TrendingUp,
    color: PremiumColors.status.won,
    bg: PremiumColors.status.wonBackground,
  },
  kickoff: {
    Icon: Clock,
    color: PremiumColors.status.live,
    bg: "rgba(251, 191, 36, 0.15)" as string,
  },
  vip_promo: {
    Icon: Crown,
    color: PremiumColors.gold.primary,
    bg: "rgba(245, 158, 11, 0.15)" as string,
  },
} as const;

const CATEGORY_LABELS: Record<string, string> = {
  btts: "BTTS",
  over25: "Over 2.5",
  "1x2": "1X2",
  correct_score: "Correct Score",
  htft: "HT/FT",
  combo: "Combo",
};

// ── Notification Row ──────────────────────────────────────────────────────────

function NotificationRow({ item }: { item: AppNotification }) {
  const config = TYPE_CONFIG[item.type] ?? TYPE_CONFIG.new_tips;
  const { Icon, color, bg } = config;

  return (
    <View style={[styles.row, !item.read && styles.rowUnread]}>
      {!item.read && <View style={styles.unreadDot} />}

      <View style={[styles.iconCircle, { backgroundColor: bg }]}>
        <Icon size={18} color={color} />
      </View>

      <View style={styles.rowContent}>
        <View style={styles.rowTopLine}>
          <Text
            style={[styles.rowTitle, !item.read && styles.rowTitleUnread]}
            numberOfLines={1}
          >
            {item.title}
          </Text>
          <Text style={styles.rowTime}>{formatTimeAgo(item.createdAt)}</Text>
        </View>

        <Text style={styles.rowBody} numberOfLines={2}>
          {item.body}
        </Text>

        {item.type === "new_tips" &&
          item.categoryIds &&
          item.categoryIds.length > 0 && (
            <View style={styles.chips}>
              {item.categoryIds.map((cid) => (
                <View key={cid} style={styles.chip}>
                  <Text style={styles.chipText}>
                    {CATEGORY_LABELS[cid] ?? cid}
                  </Text>
                </View>
              ))}
            </View>
          )}
      </View>
    </View>
  );
}

// ── Sheet ─────────────────────────────────────────────────────────────────────

const NotificationsSheet = forwardRef<
  BottomSheetModal,
  NotificationsSheetProps
>(({ notifications, onMarkAllRead }, ref) => {
  const snapPoints = useMemo(() => ["60%", "90%"], []);

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

  const hasUnread = notifications.some((n) => !n.read);

  const renderEmpty = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconCircle}>
        <Bell size={32} color={PremiumColors.text.muted} />
      </View>
      <Text style={styles.emptyTitle}>All caught up</Text>
      <Text style={styles.emptyBody}>
        We'll notify you here when today's tips are posted.
      </Text>
    </View>
  );

  return (
    <BottomSheetModal
      ref={ref}
      snapPoints={snapPoints}
      backdropComponent={renderBackdrop}
      backgroundStyle={styles.sheetBackground}
      handleIndicatorStyle={styles.handleIndicator}
    >
      {/* Sheet Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Notifications</Text>
          <Text style={styles.headerSubtitle}>
            {notifications.length === 0
              ? "No notifications yet"
              : `${notifications.length} notification${notifications.length !== 1 ? "s" : ""}`}
          </Text>
        </View>

        {hasUnread && (
          <Pressable onPress={onMarkAllRead} style={styles.markReadButton}>
            <Text style={styles.markReadText}>Mark all read</Text>
          </Pressable>
        )}
      </View>

      <BottomSheetFlatList<AppNotification>
        data={notifications}
        keyExtractor={(item: AppNotification) => item.id}
        renderItem={({ item }: { item: AppNotification }) => (
          <NotificationRow item={item} />
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmpty}
        showsVerticalScrollIndicator={false}
      />
    </BottomSheetModal>
  );
});

NotificationsSheet.displayName = "NotificationsSheet";

export default NotificationsSheet;

// ── Styles ────────────────────────────────────────────────────────────────────

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

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: PremiumColors.glass.border,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: PremiumColors.text.primary,
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 13,
    color: PremiumColors.text.tertiary,
  },
  markReadButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: PremiumColors.glass.background,
    borderWidth: 1,
    borderColor: PremiumColors.glass.border,
  },
  markReadText: {
    fontSize: 12,
    fontWeight: "600",
    color: PremiumColors.accent.primaryGlow,
  },

  // List
  listContent: {
    paddingTop: 8,
    paddingBottom: 32,
    flexGrow: 1,
  },

  // Row
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: PremiumColors.glass.border,
    gap: 12,
  },
  rowUnread: {
    backgroundColor: "rgba(59, 130, 246, 0.04)",
  },
  unreadDot: {
    position: "absolute",
    top: 20,
    left: 8,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: PremiumColors.accent.primary,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  rowContent: {
    flex: 1,
    gap: 4,
  },
  rowTopLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  rowTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: PremiumColors.text.secondary,
  },
  rowTitleUnread: {
    color: PremiumColors.text.primary,
    fontWeight: "700",
  },
  rowTime: {
    fontSize: 11,
    color: PremiumColors.text.muted,
    flexShrink: 0,
  },
  rowBody: {
    fontSize: 13,
    color: PremiumColors.text.tertiary,
    lineHeight: 18,
  },

  // Category chips
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 6,
  },
  chip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: PremiumColors.status.pendingBackground,
    borderWidth: 1,
    borderColor: "rgba(59, 130, 246, 0.25)",
  },
  chipText: {
    fontSize: 11,
    fontWeight: "700",
    color: PremiumColors.accent.primaryGlow,
    letterSpacing: 0.3,
  },

  // Empty state
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    paddingTop: 80,
    gap: 12,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: PremiumColors.glass.background,
    borderWidth: 1,
    borderColor: PremiumColors.glass.border,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: PremiumColors.text.primary,
  },
  emptyBody: {
    fontSize: 14,
    color: PremiumColors.text.tertiary,
    textAlign: "center",
    lineHeight: 20,
  },
});
