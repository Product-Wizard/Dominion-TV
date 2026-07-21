/**
 * LiveSchedulerService.ts
 * ─────────────────────────────────────────────────────────────────
 * Dominion TV — Live Notifier (Expo / React Native)
 *
 * Adapted from the original LiveSchedulerService.js to use:
 *   expo-notifications   (replaces @notifee/react-native)
 *   expo-background-fetch + expo-task-manager  (replaces react-native-background-fetch)
 *   @react-native-async-storage/async-storage  (same)
 *
 * Background task fires every ~15 min (OS minimum).
 * Retry schedule per programme (from scheduled start time):
 *   Attempt 1 → +1 min
 *   Attempt 2 → +2 min
 *   Attempt 3 → +5 min
 *   → Give up after attempt 3; sleep until programme window ends
 * ─────────────────────────────────────────────────────────────────
 */

import * as Notifications from 'expo-notifications';
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

import {
  API_KEY,
  CHANNEL_ID,
  PROGRAMMES,
  RETRY_OFFSETS_MINUTES,
  TIMEZONE,
  type Programme,
} from '../config/schedule';

// ─── Background task name ─────────────────────────────────────────
export const BACKGROUND_TASK_NAME = 'dominion-tv-live-check';

// ─── Storage keys ─────────────────────────────────────────────────
const STORAGE_KEY_STATE    = '@dominion_tv/scheduler_state';
const STORAGE_KEY_NOTIFIED = '@dominion_tv/notified_streams';

// ─── Max network retries per single API call ──────────────────────
const MAX_NETWORK_RETRIES = 3;

/* ═══════════════════════════════════════════════════════════════
   TIME UTILITIES
═══════════════════════════════════════════════════════════════ */

function getLocalParts(date = new Date()) {
  const fmt = new Intl.DateTimeFormat('en-GB', {
    timeZone: TIMEZONE,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  });
  const parts = fmt.formatToParts(date);
  const get = (type: string) =>
    parseInt(parts.find((p) => p.type === type)!.value, 10);
  const y = get('year'), mo = get('month'), d = get('day');
  const dow = new Date(
    `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}T12:00:00Z`,
  ).getDay();
  return { year: y, month: mo, day: d, hour: get('hour'), minute: get('minute'), dow };
}

function toUtcDate(year: number, month: number, day: number, timeStr: string) {
  const [h, m] = timeStr.split(':').map(Number);
  const pad = (n: number) => String(n).padStart(2, '0');
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  });

  let ms = new Date(`${year}-${pad(month)}-${pad(day)}T${pad(h)}:${pad(m)}:00Z`).getTime();
  for (let pass = 0; pass < 2; pass++) {
    const p = fmt.formatToParts(new Date(ms));
    const get = (t: string) => parseInt(p.find((x) => x.type === t)!.value, 10);
    ms -= (h - get('hour')) * 3_600_000 + (m - get('minute')) * 60_000 + (0 - get('second')) * 1_000;
  }
  return new Date(ms);
}

function nextOccurrence(programme: Programme, fromDate = new Date()) {
  for (let offset = 0; offset < 8; offset++) {
    const probe = new Date(fromDate.getTime() + offset * 86_400_000);
    const { year, month, day } = getLocalParts(probe);
    const dow = new Date(
      `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T12:00:00Z`,
    ).getDay();

    if (!programme.days.includes(dow)) continue;

    const startUtc = toUtcDate(year, month, day, programme.start);
    if (startUtc.getTime() <= fromDate.getTime()) continue;

    return {
      programme,
      startUtc,
      endUtc: toUtcDate(year, month, day, programme.end),
      attemptTimes: RETRY_OFFSETS_MINUTES.map(
        (offsetMin) => new Date(startUtc.getTime() + offsetMin * 60_000),
      ),
    };
  }
  return null;
}

function findNextProgramme(fromDate = new Date()) {
  return (
    PROGRAMMES
      .map((p) => nextOccurrence(p, fromDate))
      .filter(Boolean)
      .sort((a, b) => a!.startUtc.getTime() - b!.startUtc.getTime())[0] ?? null
  );
}

/* ═══════════════════════════════════════════════════════════════
   YOUTUBE DATA API v3
═══════════════════════════════════════════════════════════════ */

interface LiveStream {
  streamId: string;
  channelId: string;
  channelTitle: string;
  streamTitle: string;
  thumbnail: string | null;
}

interface StreamResult {
  error?: 'QUOTA_EXCEEDED';
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchLiveStream(
  retries = MAX_NETWORK_RETRIES,
): Promise<LiveStream | StreamResult | null> {
  if (!API_KEY || !CHANNEL_ID) {
    console.warn('[LiveScheduler] YouTube API_KEY or CHANNEL_ID not configured.');
    return null;
  }

  const url = new URL('https://www.googleapis.com/youtube/v3/search');
  url.searchParams.set('part', 'snippet');
  url.searchParams.set('channelId', CHANNEL_ID);
  url.searchParams.set('type', 'video');
  url.searchParams.set('eventType', 'live');
  url.searchParams.set('maxResults', '1');
  url.searchParams.set('key', API_KEY);

  try {
    const response = await fetch(url.toString(), {
      headers: { Accept: 'application/json' },
    });

    if (response.status === 403) {
      const body = await response.json();
      const reason = body?.error?.errors?.[0]?.reason;
      if (reason === 'quotaExceeded') {
        console.warn('[LiveScheduler] YouTube quota exceeded.');
        return { error: 'QUOTA_EXCEEDED' };
      }
    }

    if (!response.ok) {
      throw new Error(`YouTube API responded with HTTP ${response.status}`);
    }

    const data = await response.json();
    const item = data.items?.[0];
    if (!item) return null;

    return {
      streamId: item.id.videoId,
      channelId: item.snippet.channelId,
      channelTitle: item.snippet.channelTitle,
      streamTitle: item.snippet.title,
      thumbnail:
        item.snippet.thumbnails?.high?.url ??
        item.snippet.thumbnails?.default?.url ??
        null,
    };
  } catch (error: any) {
    if (retries > 0) {
      console.warn(`[LiveScheduler] Network error, retrying… (${retries} left)`, error.message);
      await delay(5_000);
      return fetchLiveStream(retries - 1);
    }
    console.error('[LiveScheduler] fetchLiveStream failed permanently:', error.message);
    return null;
  }
}

/* ═══════════════════════════════════════════════════════════════
   PERSISTENT STATE
═══════════════════════════════════════════════════════════════ */

interface SchedulerState {
  phase: 'IDLE' | 'WAITING' | 'LIVE';
  programmeId: string | null;
  nextAttemptIndex: number;
  nextAttemptTime: number | null;
  windowEndTime: number | null;
  startTime?: number;
}

const DEFAULT_STATE: SchedulerState = {
  phase: 'IDLE',
  programmeId: null,
  nextAttemptIndex: 0,
  nextAttemptTime: null,
  windowEndTime: null,
};

async function loadState(): Promise<SchedulerState> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY_STATE);
    return raw ? { ...DEFAULT_STATE, ...JSON.parse(raw) } : DEFAULT_STATE;
  } catch {
    return DEFAULT_STATE;
  }
}

async function saveState(state: SchedulerState) {
  try {
    await AsyncStorage.setItem(STORAGE_KEY_STATE, JSON.stringify(state));
  } catch (e: any) {
    console.error('[LiveScheduler] Failed to persist state:', e.message);
  }
}

async function hasBeenNotified(streamId: string): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY_NOTIFIED);
    const ids: string[] = raw ? JSON.parse(raw) : [];
    return ids.includes(streamId);
  } catch {
    return false;
  }
}

async function markNotified(streamId: string) {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY_NOTIFIED);
    const ids: string[] = raw ? JSON.parse(raw) : [];
    const updated = [...new Set([...ids, streamId])].slice(-50);
    await AsyncStorage.setItem(STORAGE_KEY_NOTIFIED, JSON.stringify(updated));
  } catch (e: any) {
    console.error('[LiveScheduler] Failed to mark notified:', e.message);
  }
}

/* ═══════════════════════════════════════════════════════════════
   NOTIFICATIONS (expo-notifications)
═══════════════════════════════════════════════════════════════ */

export async function setupNotificationChannel() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('dominion_tv_live', {
      name: 'Dominion TV Live',
      description: 'Alerts when a programme goes live on Dominion TV',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 300, 200, 300],
      sound: 'default',
      enableLights: true,
    });
  }
}

async function sendLiveNotification(programme: Programme, stream: LiveStream | null) {
  const title = `${programme.name} is Live Now`;
  const body = stream?.streamTitle
    ? stream.streamTitle
    : 'Tune in to Dominion TV';

  const watchUrl = stream?.streamId
    ? `https://www.youtube.com/watch?v=${stream.streamId}`
    : `https://www.youtube.com/channel/${CHANNEL_ID}/live`;

  await Notifications.scheduleNotificationAsync({
    identifier: `live_${programme.id}`,
    content: {
      title,
      body,
      sound: 'default',
      data: {
        programmeId: programme.id,
        programmeName: programme.name,
        category: programme.category,
        streamId: stream?.streamId ?? '',
        channelId: CHANNEL_ID,
        streamTitle: stream?.streamTitle ?? '',
        watchUrl,
        thumbnail: stream?.thumbnail ?? '',
      },
    },
    trigger: null,
  });
}

export function registerNotificationHandlers(onWatchPress: (url: string) => void) {
  const subscription = Notifications.addNotificationResponseReceivedListener(
    (response) => {
      const url = response.notification.request.content.data?.watchUrl as string | undefined;
      if (url) onWatchPress(url);
    },
  );
  return () => subscription.remove();
}

/* ═══════════════════════════════════════════════════════════════
   CORE TICK — called by background fetch and on foreground
═══════════════════════════════════════════════════════════════ */

export async function tick() {
  const now = Date.now();
  let state = await loadState();

  // ── Phase: LIVE ───────────────────────────────────────────────
  if (state.phase === 'LIVE') {
    if (state.windowEndTime && now >= state.windowEndTime) {
      console.log('[LiveScheduler] Window ended — resetting to IDLE');
      await saveState(DEFAULT_STATE);
    }
    return;
  }

  // ── Phase: WAITING ────────────────────────────────────────────
  if (state.phase === 'WAITING') {
    if (state.windowEndTime && now >= state.windowEndTime) {
      console.log(`[LiveScheduler] Window for "${state.programmeId}" ended without going live — resetting`);
      await saveState(DEFAULT_STATE);
      return;
    }

    if (state.nextAttemptTime && now < state.nextAttemptTime) {
      const secs = Math.round((state.nextAttemptTime - now) / 1000);
      console.log(`[LiveScheduler] Next attempt in ${secs}s — skipping tick`);
      return;
    }

    const attemptNumber = (state.nextAttemptIndex ?? 0) + 1;
    const programme = PROGRAMMES.find((p) => p.id === state.programmeId);
    if (!programme) {
      console.warn('[LiveScheduler] Unknown programmeId in state — resetting');
      await saveState(DEFAULT_STATE);
      return;
    }

    console.log(
      `[LiveScheduler] Attempt ${attemptNumber}/${RETRY_OFFSETS_MINUTES.length}`
      + ` for "${programme.name}"`,
    );

    const stream = await fetchLiveStream();

    if (stream && 'error' in stream && stream.error === 'QUOTA_EXCEEDED') {
      return;
    }

    if (stream && 'streamId' in stream) {
      const alreadyNotified = await hasBeenNotified(stream.streamId);
      if (!alreadyNotified) {
        await sendLiveNotification(programme, stream);
        await markNotified(stream.streamId);
        console.log(`[LiveScheduler] Notified: "${programme.name}" — "${stream.streamTitle}"`);
      }
      await saveState({ ...state, phase: 'LIVE' });
      return;
    }

    // Not live — advance to next attempt or give up
    const nextIndex = (state.nextAttemptIndex ?? 0) + 1;
    if (nextIndex >= RETRY_OFFSETS_MINUTES.length) {
      console.log(`[LiveScheduler] All attempts exhausted for "${programme.name}" — giving up`);
      await saveState(DEFAULT_STATE);
      return;
    }

    const nextAttemptMs = (state.startTime ?? now) + RETRY_OFFSETS_MINUTES[nextIndex] * 60_000;
    console.log(
      `[LiveScheduler] Not live — attempt ${nextIndex + 1} scheduled in`
      + ` ${Math.round((nextAttemptMs - now) / 60_000)} min`,
    );
    await saveState({ ...state, nextAttemptIndex: nextIndex, nextAttemptTime: nextAttemptMs });
    return;
  }

  // ── Phase: IDLE — find next programme and arm WAITING ─────────
  const next = findNextProgramme(new Date(now));
  if (!next) {
    console.log('[LiveScheduler] No programmes in next 8 days');
    return;
  }

  console.log(
    `[LiveScheduler] Next programme: "${next.programme.name}"`
    + ` at ${next.startUtc.toISOString()}`
    + ` — first attempt at +${RETRY_OFFSETS_MINUTES[0]} min`,
  );

  await saveState({
    phase: 'WAITING',
    programmeId: next.programme.id,
    nextAttemptIndex: 0,
    startTime: next.startUtc.getTime(),
    nextAttemptTime: next.attemptTimes[0].getTime(),
    windowEndTime: next.endUtc.getTime(),
  });
}

/* ═══════════════════════════════════════════════════════════════
   BACKGROUND FETCH (expo-background-fetch + expo-task-manager)
   IMPORTANT: TaskManager.defineTask must be called at module
   evaluation time — before registerRootComponent.
═══════════════════════════════════════════════════════════════ */

TaskManager.defineTask(BACKGROUND_TASK_NAME, async () => {
  console.log('[LiveScheduler] Background task fired');
  try {
    await tick();
    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error: any) {
    console.error('[LiveScheduler] Background task error:', error.message);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

export async function startScheduler() {
  await setupNotificationChannel();

  // Run immediately on startup to catch missed windows
  await tick();

  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_TASK_NAME);
    if (!isRegistered) {
      await BackgroundFetch.registerTaskAsync(BACKGROUND_TASK_NAME, {
        minimumInterval: 15 * 60,
        stopOnTerminate: false,
        startOnBoot: true,
      });
    }
    const status = await BackgroundFetch.getStatusAsync();
    console.log('[LiveScheduler] BackgroundFetch status:', status);
  } catch (e: any) {
    console.warn('[LiveScheduler] BackgroundFetch registration failed (may not be supported in Expo Go):', e.message);
  }
}

export async function onAppForegrounded() {
  try {
    await tick();
  } catch (e: any) {
    console.error('[LiveScheduler] onAppForegrounded tick error:', e.message);
  }
}

export async function debugState() {
  const state = await loadState();
  const next = findNextProgramme();
  console.log('[LiveScheduler] Current state:', JSON.stringify(state, null, 2));
  console.log('[LiveScheduler] Next programme:', next?.programme?.name ?? 'none');
  if (next) {
    RETRY_OFFSETS_MINUTES.forEach((offset, i) => {
      console.log(
        `  Attempt ${i + 1}: ${new Date(next.attemptTimes[i]).toLocaleTimeString('en-NG', {
          timeZone: TIMEZONE,
          hour12: true,
        })}  (+${offset} min from start)`,
      );
    });
  }
}

export async function resetScheduler() {
  await AsyncStorage.multiRemove([STORAGE_KEY_STATE, STORAGE_KEY_NOTIFIED]);
  console.log('[LiveScheduler] State reset.');
}
