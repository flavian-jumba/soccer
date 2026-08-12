import "../global.css";

import { PremiumColors } from "@/constants/colors";
import { SubscriptionProvider } from "@/features/subscription/subscription-provider";
import { getAppAccountId, peekAppAccountId } from "@/services/billing/app-account";
import { saveLocalNotification } from "@/services/localNotificationStore";
import {
  configureNotifications,
  createNotificationChannels,
  registerFCMTokenInFirestore,
  requestNotificationPermissions,
  unregisterFCMToken,
  watchFCMTokenRefresh,
} from "@/services/notificationService";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { DarkTheme, ThemeProvider } from "@react-navigation/native";
import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useRef } from "react";
import { LogBox } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

// Suppress non-fatal third-party library warnings
LogBox.ignoreLogs([
  "SafeAreaView has been deprecated",
  "Unable to activate keep awake",
]);

// Expo Go does not support FCM — skip all notification code inside it
const isExpoGo = Constants.executionEnvironment === "storeClient";
const TERMS_ACCEPTED_KEY = "titan_terms_accepted";

// ── PRIVACY NOTE ──────────────────────────────────────────────────────────────
// The installation identifier is a random, non-PII value stored in platform
// secure storage (see services/billing/app-account.ts). It registers the FCM
// push token in Firestore and identifies the installation to Google Play
// billing. No personal data (name, email, phone, etc.) is collected.
// ─────────────────────────────────────────────────────────────────────────────

// Custom dark theme for premium look
const PremiumDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: PremiumColors.background.primary,
    card: PremiumColors.background.secondary,
    border: PremiumColors.glass.border,
    text: PremiumColors.text.primary,
    primary: PremiumColors.accent.primary,
  },
};

export default function RootLayout() {
  const notificationListener = useRef<any>(null);
  const responseListener = useRef<any>(null);

  useEffect(() => {
    let cancelled = false;
    let unsubscribeTokenRefresh: (() => void) | undefined;
    if (isExpoGo) return; // FCM not supported in Expo Go

    void (async () => {
      try {
        // Do not trigger Android's notification permission prompt before the
        // user has seen and accepted the privacy disclosure on onboarding.
        const acceptedTerms =
          (await AsyncStorage.getItem(TERMS_ACCEPTED_KEY)) === "true";
        if (!acceptedTerms || cancelled) return;

        configureNotifications();
        await createNotificationChannels();

        const granted = await requestNotificationPermissions();
        if (!granted) {
          const storedDeviceId = await peekAppAccountId();
          if (storedDeviceId) await unregisterFCMToken(storedDeviceId);
          return;
        }

        if (cancelled) return;

        const deviceId = await getAppAccountId();
        await registerFCMTokenInFirestore(deviceId);
        unsubscribeTokenRefresh = watchFCMTokenRefresh(deviceId);

        notificationListener.current =
          Notifications.addNotificationReceivedListener((notification) => {
            const { title, body, data } = notification.request.content;
            if (title && body) {
              void saveLocalNotification({
                title,
                body,
                data: data as Record<string, string> | undefined,
              });
            }
          });

        responseListener.current =
          Notifications.addNotificationResponseReceivedListener((response) => {
            const { title, body, data } = response.notification.request.content;
            if (title && body) {
              void saveLocalNotification({
                title,
                body,
                data: data as Record<string, string> | undefined,
              });
            }
          });

        const lastResponse =
          await Notifications.getLastNotificationResponseAsync();
        if (lastResponse) {
          const { title, body, data } =
            lastResponse.notification.request.content;
          if (title && body) {
            await saveLocalNotification({
              title,
              body,
              data: data as Record<string, string> | undefined,
            });
          }
        }
      } catch (error) {
        // Push setup is optional and must never prevent the application shell,
        // navigation, or billing UI from mounting.
        if (__DEV__) {
          console.warn("[notifications] Initialization skipped:", error);
        }
      }
    })();

    return () => {
      cancelled = true;
      unsubscribeTokenRefresh?.();
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={PremiumDarkTheme}>
        {/*
          Mounted above the navigator so the store connection, entitlement cache
          and purchase listeners survive navigation. A purchase that completes
          while the user is on another screen is still processed.
        */}
        <SubscriptionProvider>
          <BottomSheetModalProvider>
            <StatusBar style="light" />
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: {
                  backgroundColor: PremiumColors.background.primary,
                },
                animation: "fade",
              }}
            >
              <Stack.Screen name="index" />
              <Stack.Screen name="home" />
              <Stack.Screen name="vip" />
            </Stack>
          </BottomSheetModalProvider>
        </SubscriptionProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
