import { PremiumColors } from "@/constants/colors";
import {
    BottomSheetBackdrop,
    BottomSheetBackdropProps,
    BottomSheetModal,
    BottomSheetView,
} from "@gorhom/bottom-sheet";
import { Check, Crown, Zap } from "lucide-react-native";
import React, { forwardRef, useCallback, useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { AnimatedPressableButton } from "./ui/animated-pressable";

interface VipPromptSheetProps {
  onSubscribe?: () => void;
}

const VipPromptSheet = forwardRef<BottomSheetModal, VipPromptSheetProps>(
  ({ onSubscribe }, ref) => {
    const snapPoints = useMemo(() => ["55%"], []);

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

    const benefits = [
      "Access to all VIP prediction categories",
      "Daily 2+ odds guaranteed tips",
      "Correct score predictions",
      "HT/FT & Combo tips",
      "Priority customer support",
    ];

    return (
      <BottomSheetModal
        ref={ref}
        snapPoints={snapPoints}
        backdropComponent={renderBackdrop}
        backgroundStyle={styles.sheetBackground}
        handleIndicatorStyle={styles.handleIndicator}
      >
        <BottomSheetView style={styles.content}>
          {/* Header Icon */}
          <View style={styles.iconContainer}>
            <Crown size={40} color={PremiumColors.gold.primary} />
          </View>

          {/* Title */}
          <Text style={styles.title}>Unlock VIP Access</Text>
          <Text style={styles.subtitle}>
            Get exclusive access to premium predictions
          </Text>

          {/* Benefits List */}
          <View style={styles.benefitsList}>
            {benefits.map((benefit, index) => (
              <View key={index} style={styles.benefitRow}>
                <View style={styles.checkIcon}>
                  <Check size={14} color={PremiumColors.gold.primary} />
                </View>
                <Text style={styles.benefitText}>{benefit}</Text>
              </View>
            ))}
          </View>

          {/* Pricing */}
          <View style={styles.pricingContainer}>
            <Text style={styles.priceLabel}>VIP Membership</Text>
            <View style={styles.priceRow}>
              <Text style={styles.price}>$19.99</Text>
              <Text style={styles.pricePeriod}>/month</Text>
            </View>
          </View>

          {/* Subscribe Button */}
          <AnimatedPressableButton
            style={styles.subscribeButton}
            onPress={onSubscribe}
          >
            <Zap
              size={18}
              color={PremiumColors.background.primary}
              fill={PremiumColors.background.primary}
            />
            <Text style={styles.subscribeButtonText}>Subscribe Now</Text>
          </AnimatedPressableButton>

          {/* Terms */}
          <Text style={styles.terms}>Cancel anytime. Terms apply.</Text>
        </BottomSheetView>
      </BottomSheetModal>
    );
  },
);

VipPromptSheet.displayName = "VipPromptSheet";

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
  content: {
    flex: 1,
    padding: 24,
    alignItems: "center",
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(245, 158, 11, 0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 2,
    borderColor: "rgba(245, 158, 11, 0.3)",
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: PremiumColors.gold.light,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: PremiumColors.text.secondary,
    marginBottom: 24,
    textAlign: "center",
  },
  benefitsList: {
    width: "100%",
    marginBottom: 24,
  },
  benefitRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  checkIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(245, 158, 11, 0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  benefitText: {
    fontSize: 14,
    color: PremiumColors.text.primary,
    flex: 1,
  },
  pricingContainer: {
    backgroundColor: "rgba(245, 158, 11, 0.1)",
    borderRadius: 16,
    padding: 16,
    width: "100%",
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.2)",
  },
  priceLabel: {
    fontSize: 12,
    color: PremiumColors.text.tertiary,
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  price: {
    fontSize: 32,
    fontWeight: "800",
    color: PremiumColors.gold.light,
    fontFamily: "monospace",
  },
  pricePeriod: {
    fontSize: 14,
    color: PremiumColors.text.tertiary,
    marginLeft: 4,
  },
  subscribeButton: {
    backgroundColor: PremiumColors.gold.primary,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 32,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    gap: 8,
  },
  subscribeButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: PremiumColors.background.primary,
  },
  terms: {
    fontSize: 11,
    color: PremiumColors.text.tertiary,
    marginTop: 12,
  },
});

export default VipPromptSheet;
