import { PremiumColors } from "@/constants/colors";
import {
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
  BottomSheetModal,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import {
  AlertTriangle,
  ChevronDown,
  FileText,
  HelpCircle,
  Lock,
  Shield,
} from "lucide-react-native";
import React, { forwardRef, useCallback, useMemo, useState } from "react";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

interface LegalInfoSheetProps {
  /** Reserved for future controlled-sheet options. */
  readonly presentationId?: never;
}

interface CollapsibleSectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  isExpanded: boolean;
  onToggle: () => void;
}

function CollapsibleSection({
  title,
  icon,
  children,
  isExpanded,
  onToggle,
}: CollapsibleSectionProps) {
  const rotation = useSharedValue(0);

  React.useEffect(() => {
    rotation.value = withSpring(isExpanded ? 180 : 0, {
      damping: 15,
      stiffness: 200,
    });
  }, [isExpanded, rotation]);

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <View style={styles.section}>
      <Pressable onPress={onToggle} style={styles.sectionHeader}>
        <View style={styles.sectionIconContainer}>{icon}</View>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Animated.View style={chevronStyle}>
          <ChevronDown size={20} color={PremiumColors.text.secondary} />
        </Animated.View>
      </Pressable>
      {isExpanded && <View style={styles.sectionContent}>{children}</View>}
    </View>
  );
}

const LegalInfoSheet = forwardRef<BottomSheetModal, LegalInfoSheetProps>(
  (props, ref) => {
    const snapPoints = useMemo(() => ["70%", "95%"], []);
    const [expandedSection, setExpandedSection] = useState<string | null>(null);

    const renderBackdrop = useCallback(
      (backdropProps: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop
          {...backdropProps}
          disappearsOnIndex={-1}
          appearsOnIndex={0}
          opacity={0.7}
        />
      ),
      [],
    );

    const toggleSection = (section: string) => {
      setExpandedSection(expandedSection === section ? null : section);
    };

    return (
      <BottomSheetModal
        ref={ref}
        snapPoints={snapPoints}
        backdropComponent={renderBackdrop}
        backgroundStyle={styles.sheetBackground}
        handleIndicatorStyle={styles.handleIndicator}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Legal & Support</Text>
          <Text style={styles.headerSubtitle}>
            Important information about our service
          </Text>
        </View>

        <BottomSheetScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Disclaimer */}
          <CollapsibleSection
            title="Disclaimer"
            icon={
              <AlertTriangle size={18} color={PremiumColors.gold.primary} />
            }
            isExpanded={expandedSection === "disclaimer"}
            onToggle={() => toggleSection("disclaimer")}
          >
            <Text style={styles.contentText}>
              <Text style={styles.boldText}>For Entertainment Only:</Text>{" "}
              TitanTips provides sports predictions for entertainment purposes
              only. We do not guarantee any winnings or outcomes.
            </Text>
            <Text style={styles.contentText}>
              <Text style={styles.boldText}>No Financial Advice:</Text> Our tips
              and predictions should not be considered financial advice. Always
              gamble responsibly and only with money you can afford to lose.
            </Text>
            <Text style={styles.contentText}>
              <Text style={styles.boldText}>Age Requirement:</Text> You must be
              18 years or older (or the legal gambling age in your jurisdiction)
              to use this app.
            </Text>
            <Text style={styles.contentText}>
              <Text style={styles.boldText}>Past Performance:</Text> Past
              prediction results do not guarantee future outcomes. Sports events
              are inherently unpredictable.
            </Text>
            <Text style={styles.contentText}>
              <Text style={styles.boldText}>Responsible Gambling:</Text> If you
              or someone you know has a gambling problem, please seek help.
              Visit begambleaware.org for information and support. Only gamble
              with money you can afford to lose.
            </Text>
          </CollapsibleSection>

          {/* FAQs */}
          <CollapsibleSection
            title="Frequently Asked Questions"
            icon={<HelpCircle size={18} color={PremiumColors.accent.primary} />}
            isExpanded={expandedSection === "faqs"}
            onToggle={() => toggleSection("faqs")}
          >
            <View style={styles.faqItem}>
              <Text style={styles.faqQuestion}>
                How accurate are your predictions?
              </Text>
              <Text style={styles.contentText}>
                Our predictions are based on statistical analysis, team form,
                and expert insights. However, no prediction is guaranteed —
                sports events are inherently unpredictable.
              </Text>
            </View>
            <View style={styles.faqItem}>
              <Text style={styles.faqQuestion}>
                What is included in a VIP subscription?
              </Text>
              <Text style={styles.contentText}>
                Each plan unlocks one prediction market and only that market —
                subscribing to one does not unlock any other. You can subscribe
                to as many markets as you like, weekly or monthly, and each is
                billed and cancelled on its own. Free tips stay free for
                everyone. The exact price, billing period and any trial are
                shown on the VIP market popup before you subscribe.
              </Text>
            </View>
            <View style={styles.faqItem}>
              <Text style={styles.faqQuestion}>
                How do I cancel or get a refund?
              </Text>
              <Text style={styles.contentText}>
                Subscriptions are billed by Google Play and renew automatically
                until cancelled. Cancel any time in Google Play &rsaquo;
                Subscriptions — you keep access until the current period ends.
                Refunds follow Google Play&apos;s refund policy.
              </Text>
            </View>
            <View style={styles.faqItem}>
              <Text style={styles.faqQuestion}>
                I subscribed but the app still shows a lock.
              </Text>
              <Text style={styles.contentText}>
                Open any VIP market popup and tap Restore purchases. If it still
                does not unlock, contact support with the Google Play order
                number from your purchase email.
              </Text>
            </View>
            <View style={styles.faqItem}>
              <Text style={styles.faqQuestion}>
                When are predictions updated?
              </Text>
              <Text style={styles.contentText}>
                Predictions are updated daily, typically by 10:00 AM UTC. VIP
                tips may be released earlier for premium members.
              </Text>
            </View>
          </CollapsibleSection>

          {/* Privacy Policy */}
          <CollapsibleSection
            title="Privacy Policy"
            icon={<Lock size={18} color={PremiumColors.status.won} />}
            isExpanded={expandedSection === "privacy"}
            onToggle={() => toggleSection("privacy")}
          >
            <Text style={styles.contentText}>
              <Text style={styles.boldText}>Data Collection:</Text> We store a
              random, non-personal app installation ID. It registers your push
              notification token if you enable notifications, and identifies
              your installation to Google Play so a subscription you buy can be
              verified and restored. We never receive your card details — Google
              Play handles all payment information.
            </Text>
            <Text style={styles.contentText}>
              <Text style={styles.boldText}>Data Usage:</Text> Your data is used
              only to deliver notifications, provide app content, prevent abuse,
              and support the service. We do not sell personal information or
              use it for advertising.
            </Text>
            <Text style={styles.contentText}>
              <Text style={styles.boldText}>Data Storage:</Text> Data sent to our
              service providers is encrypted in transit. Notification messages
              are also stored locally on your device.
            </Text>
            <Text style={styles.contentText}>
              <Text style={styles.boldText}>Service Providers:</Text> We use
              Google Firebase for app content and notifications, and Google Play
              Billing for subscription payments and purchase verification.
            </Text>
            <Text style={styles.contentText}>
              <Text style={styles.boldText}>Your Rights:</Text> You can request
              deletion of data associated with this installation by contacting
              support. Revoking notification permission causes the app to make a
              best-effort removal of its stored push token.
            </Text>
            <Text style={styles.contentText}>
              Read our full privacy policy at{" "}
              <Text
                style={styles.linkText}
                onPress={() =>
                  Linking.openURL(
                    "https://titan-tips-privacy-policy.lovable.app/privacy",
                  )
                }
              >
                titan-tips-privacy-policy.lovable.app/privacy
              </Text>
            </Text>
          </CollapsibleSection>

          {/* Terms of Service */}
          <CollapsibleSection
            title="Terms of Service"
            icon={<FileText size={18} color={PremiumColors.accent.secondary} />}
            isExpanded={expandedSection === "terms"}
            onToggle={() => toggleSection("terms")}
          >
            <Text style={styles.contentText}>
              <Text style={styles.boldText}>Acceptance:</Text> By using
              TitanTips, you agree to these terms and our privacy policy.
            </Text>
            <Text style={styles.contentText}>
              <Text style={styles.boldText}>Subscriptions:</Text> Paid plans are
              sold and billed exclusively through Google Play. They renew
              automatically at the price shown until cancelled, and can be
              cancelled at any time in Google Play &rsaquo; Subscriptions.
              TitanTips does not let users create an in-app account; access is
              tied to the Google account that made the purchase.
            </Text>
            <Text style={styles.contentText}>
              <Text style={styles.boldText}>Prohibited Use:</Text> You may not
              use this app for any illegal purposes or in violation of local
              gambling laws.
            </Text>
            <Text style={styles.contentText}>
              <Text style={styles.boldText}>Intellectual Property:</Text> All
              content, predictions, and branding are owned by TitanTips and may
              not be reproduced without permission.
            </Text>
            <Text style={styles.contentText}>
              <Text style={styles.boldText}>No Guarantees:</Text> Predictions are
              opinions based on analysis. We do not guarantee any outcome, win
              rate or return, and a subscription buys access to our analysis —
              not a promised result.
            </Text>
            <Text style={styles.contentText}>
              <Text style={styles.boldText}>Limitation of Liability:</Text>{" "}
              TitanTips is not liable for any losses incurred from following our
              predictions.
            </Text>
            <Text style={styles.contentText}>
              <Text style={styles.boldText}>Changes to Terms:</Text> We reserve
              the right to modify these terms at any time. Continued use
              constitutes acceptance.
            </Text>
          </CollapsibleSection>

          {/* Contact */}
          <View style={styles.contactSection}>
            <Shield size={24} color={PremiumColors.accent.primary} />
            <Text style={styles.contactTitle}>Need Help?</Text>
            <Text style={styles.contactText}>
              Contact us at support@titanfootballtips.com
            </Text>
          </View>
        </BottomSheetScrollView>
      </BottomSheetModal>
    );
  },
);

LegalInfoSheet.displayName = "LegalInfoSheet";

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
    paddingHorizontal: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: PremiumColors.glass.border,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: PremiumColors.text.primary,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 13,
    color: PremiumColors.text.tertiary,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  section: {
    backgroundColor: PremiumColors.glass.background,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: PremiumColors.glass.border,
    overflow: "hidden",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  sectionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    justifyContent: "center",
    alignItems: "center",
  },
  sectionTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: PremiumColors.text.primary,
  },
  sectionContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: PremiumColors.glass.border,
    paddingTop: 12,
  },
  contentText: {
    fontSize: 13,
    color: PremiumColors.text.secondary,
    lineHeight: 20,
    marginBottom: 10,
  },
  boldText: {
    fontWeight: "600",
    color: PremiumColors.text.primary,
  },
  linkText: {
    color: PremiumColors.accent.primary,
    textDecorationLine: "underline" as const,
  },
  faqItem: {
    marginBottom: 16,
  },
  faqQuestion: {
    fontSize: 14,
    fontWeight: "600",
    color: PremiumColors.accent.primary,
    marginBottom: 6,
  },
  contactSection: {
    alignItems: "center",
    padding: 24,
    backgroundColor: PremiumColors.glass.background,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: PremiumColors.glass.border,
    marginTop: 8,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: PremiumColors.text.primary,
    marginTop: 12,
    marginBottom: 4,
  },
  contactText: {
    fontSize: 13,
    color: PremiumColors.accent.primary,
  },
});

export default LegalInfoSheet;
