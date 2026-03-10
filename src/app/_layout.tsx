import "../global.css";

import { PremiumColors } from "@/constants/colors";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { DarkTheme, ThemeProvider } from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { LogBox } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

// Suppress non-fatal third-party library warnings
LogBox.ignoreLogs([
  "SafeAreaView has been deprecated",
  "Unable to activate keep awake",
]);

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
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={PremiumDarkTheme}>
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
          </Stack>
        </BottomSheetModalProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
