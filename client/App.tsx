import React, { useEffect } from "react";
import { StyleSheet, AppState, Linking } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/query-client";

import RootStackNavigator from "@/navigation/RootStackNavigator";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { RadioPlayerProvider } from "@/providers/RadioPlayerProvider";
import {
  startScheduler,
  onAppForegrounded,
  registerNotificationHandlers,
} from "@/services/LiveSchedulerService";
import { syncPushTokenRegistration } from "@/services/pushRegistration";

export default function App() {
  useEffect(() => {
    startScheduler();
    void syncPushTokenRegistration();

    const appStateSub = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        onAppForegrounded();
      }
    });

    const unsubNotif = registerNotificationHandlers((url: string) => {
      Linking.openURL(url).catch(() => {});
    });

    return () => {
      appStateSub.remove();
      unsubNotif();
    };
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <GestureHandlerRootView style={styles.root}>
            <KeyboardProvider>
              <RadioPlayerProvider>
                <NavigationContainer>
                  <RootStackNavigator />
                </NavigationContainer>
              </RadioPlayerProvider>
              <StatusBar style="auto" />
            </KeyboardProvider>
          </GestureHandlerRootView>
        </SafeAreaProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
