import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import { apiRequest } from "@/lib/query-client";

const DEVICE_ID_STORAGE_KEY = "@dominion_tv/device_id";
const LAST_REGISTERED_TOKEN_STORAGE_KEY = "@dominion_tv/last_registered_push_token";

function generateDeviceId() {
  return [
    "dominion-tv",
    Date.now().toString(36),
    Math.random().toString(36).slice(2, 10),
  ].join("-");
}

async function getOrCreateDeviceId() {
  const storedDeviceId = await AsyncStorage.getItem(DEVICE_ID_STORAGE_KEY);
  if (storedDeviceId) {
    return storedDeviceId;
  }

  const deviceId = generateDeviceId();
  await AsyncStorage.setItem(DEVICE_ID_STORAGE_KEY, deviceId);
  return deviceId;
}

async function getExpoPushToken(requestPermission: boolean) {
  if (Platform.OS === "web") {
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted" && requestPermission) {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    return null;
  }

  const projectId =
    Constants.easConfig?.projectId ??
    Constants.expoConfig?.extra?.eas?.projectId;

  const tokenResponse = projectId
    ? await Notifications.getExpoPushTokenAsync({ projectId })
    : await Notifications.getExpoPushTokenAsync();

  return tokenResponse.data;
}

export async function syncPushTokenRegistration() {
  try {
    const token = await getExpoPushToken(false);
    if (!token) {
      return false;
    }

    const lastRegisteredToken = await AsyncStorage.getItem(
      LAST_REGISTERED_TOKEN_STORAGE_KEY
    );
    if (lastRegisteredToken === token) {
      return true;
    }

    const deviceId = await getOrCreateDeviceId();

    await apiRequest("POST", "/api/notifications/register-token", {
      token,
      deviceId,
    });

    await AsyncStorage.setItem(LAST_REGISTERED_TOKEN_STORAGE_KEY, token);
    return true;
  } catch (error) {
    console.warn("[pushRegistration] Failed to sync push token:", error);
    return false;
  }
}
