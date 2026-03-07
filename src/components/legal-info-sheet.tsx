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
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from "react-native-reanimated";

interface LegalInfoSheetProps {}

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
              VistaScores provides sports predictions for entertainment purposes
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
                and expert insights. While we maintain a high accuracy rate, no
                prediction is guaranteed.
              </Text>
            </View>
            <View style={styles.faqItem}>
              <Text style={styles.faqQuestion}>
                What is included in VIP membership?
              </Text>
              <Text style={styles.contentText}>
                VIP members get access to premium tips including HT/FT, Correct
                Score, Combo Tips, Mega Odds, and priority customer support.
              </Text>
            </View>
            <View style={styles.faqItem}>
              <Text style={styles.faqQuestion}>
                How do I cancel my subscription?
              </Text>
              <Text style={styles.contentText}>
                You can cancel anytime through your app store subscription
                settings. Your access continues until the end of the billing
                period.
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
              <Text style={styles.boldText}>Data Collection:</Text> We collect
              minimal data necessary to provide our service, including device
              information and usage analytics.
            </Text>
            <Text style={styles.contentText}>
              <Text style={styles.boldText}>Data Usage:</Text> Your data is used
              solely to improve the app experience and deliver personalized
              predictions. We never sell your personal information.
            </Text>
            <Text style={styles.contentText}>
              <Text style={styles.boldText}>Data Storage:</Text> All data is
              encrypted and stored securely. We follow industry-standard
              security practices.
            </Text>
            <Text style={styles.contentText}>
              <Text style={styles.boldText}>Third Parties:</Text> We may use
              analytics services to improve our app. These services have their
              own privacy policies.
            </Text>
            <Text style={styles.contentText}>
              <Text style={styles.boldText}>Your Rights:</Text> You can request
              to view, modify, or delete your data at any time by contacting
              support.
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
              VistaScores, you agree to these terms and our privacy policy.
            </Text>
            <Text style={styles.contentText}>
              <Text style={styles.boldText}>Account Responsibility:</Text> You
              are responsible for maintaining the security of your account and
              any activities under it.
            </Text>
            <Text style={styles.contentText}>
              <Text style={styles.boldText}>Prohibited Use:</Text> You may not
              use this app for any illegal purposes or in violation of local
              gambling laws.
            </Text>
            <Text style={styles.contentText}>
              <Text style={styles.boldText}>Intellectual Property:</Text> All
              content, predictions, and branding are owned by VistaScores and
              may not be reproduced without permission.
            </Text>
            <Text style={styles.contentText}>
              <Text style={styles.boldText}>Limitation of Liability:</Text>{" "}
              VistaScores is not liable for any losses incurred from following
              our predictions.
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
              Contact us at support@vistascores.com
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
