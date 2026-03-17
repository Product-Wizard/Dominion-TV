/**
 * LiveSchedulerService.js
 * ─────────────────────────────────────────────────────────────────
 * Dominion TV — Production Live Notifier (React Native)
 *
 * Dependencies (install before use):
 *   yarn add @notifee/react-native
 *   yarn add @react-native-async-storage/async-storage
 *   yarn add react-native-background-fetch
 *
 * Android: add FOREGROUND_SERVICE + RECEIVE_BOOT_COMPLETED permissions
 *          in AndroidManifest.xml (see README below)
 * iOS:     enable Background Modes → Background fetch in Xcode
 *
 * Retry schedule per programme (from scheduled start time):
 *   Attempt 1 → +1 min
 *   Attempt 2 → +2 min  (1 min after attempt 1)
 *   Attempt 3 → +5 min  (3 mins after attempt 2)
 *   → Give up after attempt 3; sleep until programme window ends
 * ─────────────────────────────────────────────────────────────────
 */

import notifee, {
  AndroidImportance,
  AndroidVisibility,
  EventType,
} from '@notifee/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BackgroundFetch from 'react-native-background-fetch';

import {
  API_KEY,
  CHANNEL_ID,
  PROGRAMMES,
  RETRY_OFFSETS_MINUTES,
  TIMEZONE,
} from '../config/schedule';

// ─── Storage keys ────────────────────────────────────────────────
const STORAGE_KEY_STATE  = '@dominion_tv/scheduler_state';
const STORAGE_KEY_NOTIFIED = '@dominion_tv/notified_streams';

// ─── Notification channel ID (Android) ───────────────────────────
const NOTIF_CHANNEL_ID = 'dominion_tv_live';

// ─── Max network retries per single API call ──────────────────────
const MAX_NETWORK_RETRIES = 3;

/* ═══════════════════════════════════════════════════════════════
   TIME UTILITIES
═══════════════════════════════════════════════════════════════ */

/**
 * Returns local date parts in the channel's timezone using Intl.
 * Works on both iOS and Android without a native library.
 */
function getLocalParts(date = new Date()) {
  const fmt = new Intl.DateTimeFormat('en-GB', {
    timeZone: TIMEZONE,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  });
  const parts = fmt.formatToParts(date);
  const get   = (type) => parseInt(parts.find((p) => p.type === type).value, 10);
  const y = get('year'), mo = get('month'), d = get('day');
  // Derive day-of-week from a noon UTC timestamp on that date (avoids DST edge)
  const dow = new Date(
    `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}T12:00:00Z`,
  ).getDay();
  return { year: y, month: mo, day: d, hour: get('hour'), minute: get('minute'), dow };
}

/**
 * Converts a local HH:MM on a given calendar date (in TIMEZONE) to a UTC Date.
 * Uses a two-pass correction to handle any fixed UTC offset accurately.
 */
function toUtcDate(year, month, day, timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  const pad     = (n) => String(n).padStart(2, '0');
  const fmt     = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  });

  // Seed with naive UTC then correct for the local offset
  let ms = new Date(`${year}-${pad(month)}-${pad(day)}T${pad(h)}:${pad(m)}:00Z`).getTime();
  for (let pass = 0; pass < 2; pass++) {
    const p   = fmt.formatToParts(new Date(ms));
    const get = (t) => parseInt(p.find((x) => x.type === t).value, 10);
    ms -= (h - get('hour')) * 3_600_000 + (m - get('minute')) * 60_000 + (0 - get('second')) * 1_000;
  }
  return new Date(ms);
}

/**
 * Finds the next calendar occurrence of a programme starting strictly
 * after `fromDate`. Looks up to 8 days ahead.
 */
function nextOccurrence(programme, fromDate = new Date()) {
  for (let offset = 0; offset < 8; offset++) {
    const probe = new Date(fromDate.getTime() + offset * 86_400_000);
    const { year, month, day } = getLocalParts(probe);
    const dow = new Date(
      `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T12:00:00Z`,
    ).getDay();

    if (!programme.days.includes(dow)) continue;

    const startUtc = toUtcDate(year, month, day, programme.start);
    if (startUtc.getTime() <= fromDate.getTime()) continue; // already passed today

    return {
      programme,
      startUtc,
      endUtc:      toUtcDate(year, month, day, programme.end),
      // Absolute UTC timestamps for each retry attempt
      attemptTimes: RETRY_OFFSETS_MINUTES.map(
        (offsetMin) => new Date(startUtc.getTime() + offsetMin * 60_000),
      ),
    };
  }
  return null;
}

/** Returns the soonest upcoming programme across all shows. */
function findNextProgramme(fromDate = new Date()) {
  return PROGRAMMES
    .map((p) => nextOccurrence(p, fromDate))
    .filter(Boolean)
    .sort((a, b) => a.startUtc - b.startUtc)[0] ?? null;
}

/** Returns the programme window that contains `now`, if any. */
function getCurrentWindow(now = new Date()) {
  const { year, month, day } = getLocalParts(now);
  const pad  = (n) => String(n).padStart(2, '0');
  const dow  = new Date(`${year}-${pad(month)}-${pad(day)}T12:00:00Z`).getDay();

  for (const p of PROGRAMMES) {
    if (!p.days.includes(dow)) continue;
    const start = toUtcDate(year, month, day, p.start);
    const end   = toUtcDate(year, month, day, p.end);
    if (now >= start && now < end) return { programme: p, startUtc: start, endUtc: end };
  }
  return null;
}

/* ═══════════════════════════════════════════════════════════════
   YOUTUBE DATA API v3
═══════════════════════════════════════════════════════════════ */

/**
 * Calls the YouTube search endpoint once.
 * Returns a stream object if the channel is live, otherwise null.
 * Retries up to MAX_NETWORK_RETRIES times on network errors only.
 */
async function fetchLiveStream(retries = MAX_NETWORK_RETRIES) {
  const url = new URL('https://www.googleapis.com/youtube/v3/search');
  url.searchParams.set('part',      'snippet');
  url.searchParams.set('channelId', CHANNEL_ID);
  url.searchParams.set('type',      'video');
  url.searchParams.set('eventType', 'live');
  url.searchParams.set('maxResults','1');
  url.searchParams.set('key',       API_KEY);

  try {
    const response = await fetch(url.toString(), {
      headers: { Accept: 'application/json' },
    });

    // Quota exceeded — surface clearly rather than silently retrying
    if (response.status === 403) {
      const body   = await response.json();
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
    if (!item) return null; // not live

    return {
      streamId:     item.id.videoId,
      channelId:    item.snippet.channelId,
      channelTitle: item.snippet.channelTitle,
      streamTitle:  item.snippet.title,
      thumbnail:    item.snippet.thumbnails?.high?.url
                      ?? item.snippet.thumbnails?.default?.url ?? null,
    };
  } catch (error) {
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
   Survives app restarts and background kills.
═══════════════════════════════════════════════════════════════ */

/**
 * Scheduler state shape:
 * {
 *   phase: 'IDLE' | 'WAITING' | 'LIVE',
 *   programmeId: string | null,
 *   nextAttemptIndex: number,       // 0 = attempt 1, 1 = attempt 2, 2 = attempt 3
 *   nextAttemptTime: number | null, // UTC ms
 *   windowEndTime:   number | null, // UTC ms
 * }
 */
const DEFAULT_STATE = {
  phase:            'IDLE',
  programmeId:      null,
  nextAttemptIndex: 0,
  nextAttemptTime:  null,
  windowEndTime:    null,
};

async function loadState() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY_STATE);
    return raw ? { ...DEFAULT_STATE, ...JSON.parse(raw) } : DEFAULT_STATE;
  } catch {
    return DEFAULT_STATE;
  }
}

async function saveState(state) {
  try {
    await AsyncStorage.setItem(STORAGE_KEY_STATE, JSON.stringify(state));
  } catch (e) {
    console.error('[LiveScheduler] Failed to persist state:', e.message);
  }
}

/** Track stream IDs we have already notified so we never double-fire. */
async function hasBeenNotified(streamId) {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY_NOTIFIED);
    const ids  = raw ? JSON.parse(raw) : [];
    return ids.includes(streamId);
  } catch {
    return false;
  }
}

async function markNotified(streamId) {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY_NOTIFIED);
    const ids  = raw ? JSON.parse(raw) : [];
    // Keep only the last 50 stream IDs — prevents unbounded growth
    const updated = [...new Set([...ids, streamId])].slice(-50);
    await AsyncStorage.setItem(STORAGE_KEY_NOTIFIED, JSON.stringify(updated));
  } catch (e) {
    console.error('[LiveScheduler] Failed to mark notified:', e.message);
  }
}

/* ═══════════════════════════════════════════════════════════════
   NOTIFICATIONS  (via @notifee/react-native)
═══════════════════════════════════════════════════════════════ */

/** Create the Android notification channel once at app boot. */
export async function setupNotificationChannel() {
  await notifee.createChannel({
    id:          NOTIF_CHANNEL_ID,
    name:        'Dominion TV Live',
    description: 'Alerts when a programme goes live',
    importance:  AndroidImportance.HIGH,
    visibility:  AndroidVisibility.PUBLIC,
    sound:       'default',
    vibration:   true,
  });
}

/**
 * Builds and fires the in-app push notification.
 * Returns the notifee notification ID.
 */
async function sendLiveNotification(programme, stream) {
  const title = `${programme.icon} ${programme.name} is Live Now`;
  const body  = stream?.streamTitle
    ? `▶ ${stream.streamTitle}`
    : 'Tune in to Dominion TV';

  const watchUrl = stream?.streamId
    ? `https://www.youtube.com/watch?v=${stream.streamId}`
    : `https://www.youtube.com/channel/${CHANNEL_ID}/live`;

  return notifee.displayNotification({
    id:    `live_${programme.id}`,   // Same ID per programme → replaces itself if shown again
    title,
    body,
    android: {
      channelId:    NOTIF_CHANNEL_ID,
      importance:   AndroidImportance.HIGH,
      visibility:   AndroidVisibility.PUBLIC,
      sound:        'default',
      vibrationPattern: [0, 300, 200, 300],
      smallIcon:    'ic_notification',  // Must exist in res/drawable
      largeIcon:    stream?.thumbnail ?? undefined,
      pressAction:  { id: 'open_stream', launchActivity: 'default' },
      actions: [
        {
          title:       '▶ Watch Now',
          pressAction: { id: 'watch', launchActivity: 'default' },
        },
      ],
    },
    ios: {
      sound:        'default',
      badgeCount:   1,
      categoryId:   'PROGRAMME_LIVE',
      attachments:  stream?.thumbnail ? [{ url: stream.thumbnail }] : [],
    },
    // Payload available in notification press handler
    data: {
      programmeId:  programme.id,
      programmeName:programme.name,
      category:     programme.category,
      streamId:     stream?.streamId  ?? '',
      channelId:    CHANNEL_ID,
      streamTitle:  stream?.streamTitle ?? '',
      watchUrl,
      thumbnail:    stream?.thumbnail ?? '',
    },
  });
}

/** Handle Watch Now / notification press actions. Register at app root. */
export function registerNotificationHandlers(onWatchPress) {
  return notifee.onForegroundEvent(({ type, detail }) => {
    if (
      type === EventType.ACTION_PRESS &&
      (detail.pressAction.id === 'watch' || detail.pressAction.id === 'open_stream')
    ) {
      const url = detail.notification?.data?.watchUrl;
      if (url && onWatchPress) onWatchPress(url);
    }
  });
}

/* ═══════════════════════════════════════════════════════════════
   CORE TICK — called by BackgroundFetch every ~15 min
   and also on-demand when the app is foregrounded.

   Decision tree per tick:
   ┌────────────────────────────────────────────────────────┐
   │ 1. Load persisted state                                │
   │ 2. LIVE phase   → already notified, sleep until end   │
   │ 3. WAITING phase→ is it time for the next attempt?    │
   │      Yes → query API → if live: notify, enter LIVE    │
   │              → if not live: advance to next attempt   │
   │              → if all attempts exhausted: enter IDLE  │
   │      No  → nothing to do yet                          │
   │ 4. IDLE phase   → find next programme, enter WAITING  │
   └────────────────────────────────────────────────────────┘
═══════════════════════════════════════════════════════════════ */
async function tick() {
  const now   = Date.now();
  let   state = await loadState();

  // ── Phase: LIVE ────────────────────────────────────────────────
  if (state.phase === 'LIVE') {
    if (state.windowEndTime && now >= state.windowEndTime) {
      console.log('[LiveScheduler] Window ended — resetting to IDLE');
      await saveState(DEFAULT_STATE);
    }
    // Either way, nothing to query while we know the channel is live
    return;
  }

  // ── Phase: WAITING ─────────────────────────────────────────────
  if (state.phase === 'WAITING') {
    // Guard: window has already passed — reset
    if (state.windowEndTime && now >= state.windowEndTime) {
      console.log(`[LiveScheduler] Window for "${state.programmeId}" ended without going live — resetting`);
      await saveState(DEFAULT_STATE);
      return;
    }

    // Not yet time for the next attempt
    if (state.nextAttemptTime && now < state.nextAttemptTime) {
      const secs = Math.round((state.nextAttemptTime - now) / 1000);
      console.log(`[LiveScheduler] Next attempt in ${secs}s — skipping tick`);
      return;
    }

    // Time to check
    const attemptNumber = (state.nextAttemptIndex ?? 0) + 1;
    const programme     = PROGRAMMES.find((p) => p.id === state.programmeId);
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

    if (stream?.error === 'QUOTA_EXCEEDED') {
      // Don't advance state — try again next background tick
      return;
    }

    if (stream) {
      // ✅ Channel is live
      const alreadyNotified = await hasBeenNotified(stream.streamId);
      if (!alreadyNotified) {
        await sendLiveNotification(programme, stream);
        await markNotified(stream.streamId);
        console.log(`[LiveScheduler] ✅ Notified: "${programme.name}" — "${stream.streamTitle}"`);
      }
      await saveState({ ...state, phase: 'LIVE' });
      return;
    }

    // ❌ Not live — advance to next attempt or give up
    const nextIndex = (state.nextAttemptIndex ?? 0) + 1;
    if (nextIndex >= RETRY_OFFSETS_MINUTES.length) {
      console.log(`[LiveScheduler] All ${RETRY_OFFSETS_MINUTES.length} attempts exhausted for "${programme.name}" — giving up`);
      await saveState(DEFAULT_STATE);
      return;
    }

    // Schedule next attempt
    const startMs     = state.windowEndTime
      ? state.windowEndTime - (PROGRAMMES.find((p) => p.id === state.programmeId) ? 0 : 0)
      : now; // fallback (shouldn't happen in normal flow)

    // nextAttemptTime is stored as an absolute ms timestamp when entering WAITING
    // RETRY_OFFSETS_MINUTES are from start, so we recalculate from the stored startTime
    const nextAttemptMs = state.startTime + RETRY_OFFSETS_MINUTES[nextIndex] * 60_000;

    console.log(
      `[LiveScheduler] Not live — attempt ${nextIndex + 1} scheduled in`
      + ` ${Math.round((nextAttemptMs - now) / 60_000)} min`,
    );
    await saveState({ ...state, nextAttemptIndex: nextIndex, nextAttemptTime: nextAttemptMs });
    return;
  }

  // ── Phase: IDLE — find the next programme and arm WAITING ──────
  const next = findNextProgramme(new Date(now));
  if (!next) {
    console.log('[LiveScheduler] No programmes in next 8 days');
    return;
  }

  console.log(
    `[LiveScheduler] Next programme: "${next.programme.name}"`
    + ` at ${new Date(next.startUtc).toISOString()}`
    + ` — first attempt at +${RETRY_OFFSETS_MINUTES[0]} min`,
  );

  await saveState({
    phase:            'WAITING',
    programmeId:      next.programme.id,
    nextAttemptIndex: 0,
    startTime:        next.startUtc.getTime(),
    nextAttemptTime:  next.attemptTimes[0].getTime(),
    windowEndTime:    next.endUtc.getTime(),
  });
}

/* ═══════════════════════════════════════════════════════════════
   BACKGROUND FETCH INTEGRATION (react-native-background-fetch)

   iOS:     System triggers every 15–30 min (OS decides frequency)
   Android: WorkManager fires reliably on a 15-min interval

   The tick() function is stateless enough to handle any wakeup
   interval — it reads persisted state and acts accordingly.
═══════════════════════════════════════════════════════════════ */

export async function startScheduler() {
  await setupNotificationChannel();

  // Run once immediately on startup to catch any missed windows
  await tick();

  const status = await BackgroundFetch.configure(
    {
      minimumFetchInterval: 15,            // minutes — OS minimum
      stopOnTerminate:      false,         // keep running after app close (Android)
      startOnBoot:          true,          // resume after device restart (Android)
      enableHeadless:       true,          // Android headless task support
      requiredNetworkType:  BackgroundFetch.NETWORK_TYPE_ANY,
    },
    async (taskId) => {
      console.log('[LiveScheduler] Background fetch fired:', taskId);
      try {
        await tick();
      } catch (error) {
        console.error('[LiveScheduler] tick() error:', error.message);
      } finally {
        BackgroundFetch.finish(taskId); // MUST call to avoid OS kill
      }
    },
    async (taskId) => {
      // Timeout handler — OS is about to kill the task
      console.warn('[LiveScheduler] Background fetch timeout:', taskId);
      BackgroundFetch.finish(taskId);
    },
  );

  console.log('[LiveScheduler] BackgroundFetch status:', status);
  return status;
}

/**
 * Call from your app's foreground lifecycle (AppState change to 'active')
 * to run a tick immediately when the user opens the app.
 */
export async function onAppForegrounded() {
  try {
    await tick();
  } catch (e) {
    console.error('[LiveScheduler] onAppForegrounded tick error:', e.message);
  }
}

/**
 * Headless background task for Android (when app is fully terminated).
 * Register this in your index.js:
 *   BackgroundFetch.registerHeadlessTask(headlessTask);
 */
export async function headlessTask(event) {
  const { taskId, timeout } = event;
  if (timeout) {
    BackgroundFetch.finish(taskId);
    return;
  }
  try {
    await tick();
  } catch (e) {
    console.error('[LiveScheduler] Headless task error:', e.message);
  }
  BackgroundFetch.finish(taskId);
}

/* ═══════════════════════════════════════════════════════════════
   UTILITIES
═══════════════════════════════════════════════════════════════ */
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Debug helper — dumps current scheduler state to console.
 * Call from a dev menu or __DEV__ screen.
 */
export async function debugState() {
  const state = await loadState();
  const next  = findNextProgramme();
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

/**
 * Wipe all persisted state — useful for testing or resetting on logout.
 */
export async function resetScheduler() {
  await AsyncStorage.multiRemove([STORAGE_KEY_STATE, STORAGE_KEY_NOTIFIED]);
  console.log('[LiveScheduler] State reset.');
}

/*
 * ─────────────────────────────────────────────────────────────────
 * README — Integration Guide
 * ─────────────────────────────────────────────────────────────────
 *
 * 1. INSTALL DEPENDENCIES
 *    yarn add @notifee/react-native \
 *             @react-native-async-storage/async-storage \
 *             react-native-background-fetch
 *    cd ios && pod install
 *
 * 2. index.js  (app entry point)
 *    ─────────────────────────────
 *    import BackgroundFetch from 'react-native-background-fetch';
 *    import { headlessTask } from './src/services/LiveSchedulerService';
 *    BackgroundFetch.registerHeadlessTask(headlessTask);
 *
 * 3. App.js  (root component)
 *    ─────────────────────────────
 *    import { useEffect } from 'react';
 *    import { AppState, Linking } from 'react-native';
 *    import {
 *      startScheduler,
 *      onAppForegrounded,
 *      registerNotificationHandlers,
 *    } from './src/services/LiveSchedulerService';
 *
 *    useEffect(() => {
 *      startScheduler();
 *
 *      // Run a tick whenever the user opens the app
 *      const sub = AppState.addEventListener('change', (state) => {
 *        if (state === 'active') onAppForegrounded();
 *      });
 *
 *      // Handle Watch Now button press
 *      const unsubNotif = registerNotificationHandlers((url) => {
 *        Linking.openURL(url);
 *      });
 *
 *      return () => { sub.remove(); unsubNotif(); };
 *    }, []);
 *
 * 4. ANDROID PERMISSIONS  (android/app/src/main/AndroidManifest.xml)
 *    ─────────────────────────────
 *    <uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED"/>
 *    <uses-permission android:name="android.permission.FOREGROUND_SERVICE"/>
 *    <uses-permission android:name="android.permission.POST_NOTIFICATIONS"/>
 *
 * 5. REQUEST NOTIFICATION PERMISSION (iOS 16+ / Android 13+)
 *    ─────────────────────────────
 *    import notifee from '@notifee/react-native';
 *    await notifee.requestPermission();   // call once after onboarding
 *
 * 6. QUOTA USAGE ESTIMATE (worst case — all 3 attempts used every day)
 *    Monday (heaviest day): 9 programmes × 3 attempts × 100 units = 2,700 units
 *    Typical day (on time): 9 programmes × 1 attempt  × 100 units =   900 units
 *    Daily free quota: 10,000 units — well within limits either way.
 * ─────────────────────────────────────────────────────────────────
 */
