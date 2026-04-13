import React, { useEffect, useRef } from "react";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { Platform } from "react-native";
import * as Linking from "expo-linking";
import * as Application from "expo-application";
import * as SecureStore from "expo-secure-store";

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

interface NotificationProps {
  children: React.ReactNode;
}

const BACKEND_URL =
  process.env.EXPO_PUBLIC_BACKEND_URL || "http://localhost:4000";

const NotificationProvider: React.FC<NotificationProps> = ({ children }) => {
  const notificationListener = useRef<any>();
  const responseListener = useRef<any>();

  const getUniqueDeviceId = async () => {
    let deviceId: string | null = null;
    try {
      if (Platform.OS === "android") {
        deviceId = Application.androidId;
      } else if (Platform.OS === "ios") {
        deviceId = await Application.getIosIdForVendorAsync();
      }

      if (!deviceId) {
        deviceId = await SecureStore.getItemAsync("unique_device_id");
        if (!deviceId) {
          deviceId = `${Math.random().toString(36).substring(2, 15)}-${Date.now()}`;
          await SecureStore.setItemAsync("unique_device_id", deviceId);
        }
      }
      console.log("device unique ID: ", deviceId);
    } catch (e) {
      console.error("Error getting device ID:", e);
    }
    return deviceId;
  };

  const registerForPushNotificationsAsync = async () => {
    let token;

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF231F7C",
      });
    }

    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== "granted") {
      console.log("Failed to get push token for push notification!");
      return;
    }

    try {
      // Get projectId from app config
      const projectId =
        Constants?.expoConfig?.extra?.eas?.projectId ??
        Constants?.easConfig?.projectId;

      if (!projectId) {
        console.error("Project ID not found in Expo configuration");
        return;
      }

      token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
      console.log("Expo Push Token:", token);

      const deviceId = await getUniqueDeviceId();
      console.log("Device ID:", deviceId);

      // Send token to backend
      await fetch(`${BACKEND_URL}/api/notifications/register-token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          deviceId,
          // userId: "some-user-id", // Add actual user ID if available
        }),
      });
    } catch (e) {
      console.error("Error getting push token:", e);
    }

    return token;
  };

  useEffect(() => {
    registerForPushNotificationsAsync();

    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        console.log("Notification Received:", notification);
      });

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log("Notification Response:", response);
        const { videoId } = response.notification.request.content.data;
        if (videoId) {
          Linking.openURL(`https://www.youtube.com/watch?v=${videoId}`);
        }
      });

    return () => {
      Notifications.removeNotificationSubscription(
        notificationListener.current,
      );
      Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, []);

  return <>{children}</>;
};

export default NotificationProvider;
