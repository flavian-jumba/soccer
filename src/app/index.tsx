import LegalInfoSheet from "@/components/legal-info-sheet";
import { AnimatedPressableButton } from "@/components/ui/animated-pressable";
import { GlassCard } from "@/components/ui/glass-card";
import { PremiumColors } from "@/constants/colors";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import {
    CheckSquare,
    ChevronRight,
    Sparkles,
    Square,
} from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
    FadeInDown,
    FadeInUp,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const TERMS_ACCEPTED_KEY = "vista_terms_accepted";

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const [isChecked, setIsChecked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const legalInfoRef = useRef<BottomSheetModal>(null);

  // Animation values
  const buttonOpacity = useSharedValue(0.5);
  const checkScale = useSharedValue(1);

  // Check if user already accepted terms
  useEffect(() => {
    checkTermsAccepted();
  }, []);

  // Update button opacity based on checkbox
  useEffect(() => {
    buttonOpacity.value = withTiming(isChecked ? 1 : 0.5, { duration: 200 });
  }, [isChecked, buttonOpacity]);

  const checkTermsAccepted = async () => {
    try {
      const accepted = await AsyncStorage.getItem(TERMS_ACCEPTED_KEY);
      if (accepted === "true") {
        router.replace("/home");
      } else {
        setIsLoading(false);
      }
    } catch {
      setIsLoading(false);
    }
  };

  const handleCheckboxPress = () => {
    checkScale.value = withSpring(0.9, { damping: 15 }, () => {
      checkScale.value = withSpring(1, { damping: 15 });
    });
    setIsChecked(!isChecked);
  };

  const handleGetStarted = async () => {
    if (!isChecked) return;
    try {
      await AsyncStorage.setItem(TERMS_ACCEPTED_KEY, "true");
      router.replace("/home");
    } catch {
      // Handle error silently
    }
  };

  const handleOpenLegalInfo = () => {
    legalInfoRef.current?.present();
  };

  const checkboxAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
  }));

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
  }));

  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <Sparkles size={32} color={PremiumColors.accent.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Background Glow Effects */}
      <View style={styles.glowContainer}>
        <View style={[styles.glow, styles.glowBlue]} />
        <View style={[styles.glow, styles.glowPurple]} />
      </View>

      {/* Logo Section */}
      <Animated.View
        entering={FadeInDown.delay(200).springify()}
        style={styles.logoSection}
      >
        <View style={styles.logoContainer}>
          <View style={styles.logoIcon}>
            <Sparkles size={48} color={PremiumColors.accent.primary} />
          </View>
        </View>
        <Text style={styles.appName}>VistaScores</Text>
        <Text style={styles.tagline}>Premium Sports Predictions</Text>
      </Animated.View>

      {/* Terms Card */}
      <Animated.View
        entering={FadeInUp.delay(400).springify()}
        style={styles.cardContainer}
      >
        <GlassCard variant="elevated" style={styles.termsCard}>
          {/* Checkbox Row */}
          <Pressable onPress={handleCheckboxPress} style={styles.checkboxRow}>
            <Animated.View style={checkboxAnimatedStyle}>
              {isChecked ? (
                <CheckSquare
                  size={24}
                  color={PremiumColors.accent.primary}
                  fill={PremiumColors.accent.primary}
                />
              ) : (
                <Square size={24} color={PremiumColors.text.tertiary} />
              )}
            </Animated.View>
            <View style={styles.checkboxTextContainer}>
              <Text style={styles.checkboxText}>
                I am 18+ years old and accept the{" "}
                <Text style={styles.linkText} onPress={handleOpenLegalInfo}>
                  Terms of Service
                </Text>{" "}
                and{" "}
                <Text style={styles.linkText} onPress={handleOpenLegalInfo}>
                  Privacy Policy
                </Text>
              </Text>
            </View>
          </Pressable>

          {/* Get Started Button */}
          <AnimatedPressableButton
            onPress={handleGetStarted}
            disabled={!isChecked}
            style={[styles.getStartedButton]}
          >
            <Animated.View style={[styles.buttonInner, buttonAnimatedStyle]}>
              <Text
                style={[
                  styles.buttonText,
                  !isChecked && styles.buttonTextDisabled,
                ]}
              >
                Get Started
              </Text>
              <ChevronRight
                size={20}
                color={
                  isChecked
                    ? PremiumColors.text.primary
                    : PremiumColors.text.tertiary
                }
              />
            </Animated.View>
          </AnimatedPressableButton>
        </GlassCard>
      </Animated.View>

      {/* Footer */}
      <Animated.View
        entering={FadeInUp.delay(600).springify()}
        style={styles.footer}
      >
        <Text style={styles.footerText}>
          By continuing, you agree to responsible gambling practices
        </Text>
      </Animated.View>

      {/* Legal Info Sheet */}
      <LegalInfoSheet ref={legalInfoRef} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PremiumColors.background.primary,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  glowContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  glow: {
    position: "absolute",
    width: 300,
    height: 300,
    borderRadius: 150,
    opacity: 0.3,
  },
  glowBlue: {
    backgroundColor: PremiumColors.accent.primary,
    top: "10%",
    left: "-20%",
    transform: [{ scale: 1.5 }],
  },
  glowPurple: {
    backgroundColor: PremiumColors.accent.secondary,
    bottom: "15%",
    right: "-20%",
    transform: [{ scale: 1.2 }],
  },
  logoSection: {
    alignItems: "center",
    marginBottom: 48,
  },
  logoContainer: {
    marginBottom: 20,
  },
  logoIcon: {
    width: 100,
    height: 100,
    borderRadius: 28,
    backgroundColor: "rgba(59, 130, 246, 0.15)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(59, 130, 246, 0.3)",
  },
  appName: {
    fontSize: 36,
    fontWeight: "800",
    color: PremiumColors.text.primary,
    letterSpacing: -1,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: PremiumColors.text.secondary,
    letterSpacing: 0.5,
  },
  cardContainer: {
    width: "100%",
    maxWidth: 400,
  },
  termsCard: {
    padding: 24,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 24,
    gap: 14,
  },
  checkboxTextContainer: {
    flex: 1,
  },
  checkboxText: {
    fontSize: 14,
    color: PremiumColors.text.secondary,
    lineHeight: 22,
  },
  linkText: {
    color: PremiumColors.accent.primary,
    textDecorationLine: "underline",
  },
  getStartedButton: {
    width: "100%",
  },
  buttonInner: {
    backgroundColor: PremiumColors.accent.primary,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "700",
    color: PremiumColors.text.primary,
  },
  buttonTextDisabled: {
    color: PremiumColors.text.tertiary,
  },
  footer: {
    position: "absolute",
    bottom: 40,
    paddingHorizontal: 24,
  },
  footerText: {
    fontSize: 12,
    color: PremiumColors.text.tertiary,
    textAlign: "center",
  },
});
