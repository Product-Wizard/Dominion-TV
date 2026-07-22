import React, {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AppState } from "react-native";
import {
  createAudioPlayer,
  setAudioModeAsync,
  useAudioPlayerStatus,
} from "expo-audio";

const STREAM_URL = "https://stream.zeno.fm/pqpqbcgxpfhvv";
const MAX_RETRIES = 8;

const RADIO_METADATA = {
  title: "Dominion Radio",
  artist: "Dominion TV",
  albumTitle: "Your Channel of Choice",
};

function clearLockScreenControls(player: {
  clearLockScreenControls?: () => void;
}) {
  if (typeof player.clearLockScreenControls === "function") {
    player.clearLockScreenControls();
  }
}

export type RadioState =
  | "idle"
  | "loading"
  | "buffering"
  | "playing"
  | "paused"
  | "reconnecting"
  | "error";

type RadioPlayerContextValue = {
  radioState: RadioState;
  retryAttempt: number;
  playPause: () => void;
  retry: () => void;
};

const RadioPlayerContext = createContext<RadioPlayerContextValue | null>(null);

export function RadioPlayerProvider({ children }: PropsWithChildren) {
  const [player] = useState(() => createAudioPlayer(null));
  const status = useAudioPlayerStatus(player);

  const [radioState, setRadioState] = useState<RadioState>("idle");
  const [retryAttempt, setRetryAttempt] = useState(0);

  const shouldPlayRef = useRef(false);
  const retryCountRef = useRef(0);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearRetryTimer = useCallback(() => {
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
  }, []);

  const queueRetry = useCallback(() => {
    if (!shouldPlayRef.current) {
      return;
    }

    clearRetryTimer();

    if (retryCountRef.current >= MAX_RETRIES) {
      setRadioState("error");
      clearLockScreenControls(player);
      return;
    }

    retryCountRef.current += 1;
    setRetryAttempt(retryCountRef.current);
    setRadioState("reconnecting");

    const delay = Math.min(
      1000 * Math.pow(2, retryCountRef.current - 1),
      30000,
    );

    retryTimerRef.current = setTimeout(() => {
      if (!shouldPlayRef.current) {
        return;
      }

      setRadioState("loading");
      try {
        player.setActiveForLockScreen(true, RADIO_METADATA);
        player.replace({ uri: STREAM_URL });
        player.play();
      } catch {
        queueRetry();
      }
    }, delay);
  }, [clearRetryTimer, player]);

  const startPlayback = useCallback(() => {
    shouldPlayRef.current = true;
    retryCountRef.current = 0;
    setRetryAttempt(0);
    clearRetryTimer();
    setRadioState("loading");

    try {
      player.setActiveForLockScreen(true, RADIO_METADATA);
      player.replace({ uri: STREAM_URL });
      player.play();
    } catch {
      queueRetry();
    }
  }, [clearRetryTimer, player, queueRetry]);

  const pausePlayback = useCallback(() => {
    shouldPlayRef.current = false;
    retryCountRef.current = 0;
    setRetryAttempt(0);
    clearRetryTimer();

    try {
      player.pause();
    } catch {}

    clearLockScreenControls(player);
    setRadioState("paused");
  }, [clearRetryTimer, player]);

  useEffect(() => {
    setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: "doNotMix",
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (status.playing) {
      retryCountRef.current = 0;
      setRetryAttempt(0);
      setRadioState("playing");
      player.setActiveForLockScreen(true, RADIO_METADATA);
      return;
    }

    if (status.timeControlStatus === "paused") {
      shouldPlayRef.current = false;
      retryCountRef.current = 0;
      setRetryAttempt(0);
      clearRetryTimer();
      clearLockScreenControls(player);
      setRadioState("paused");
      return;
    }

    if (!shouldPlayRef.current) {
      return;
    }

    if (status.isBuffering) {
      setRadioState((prev) => (prev === "loading" ? "loading" : "buffering"));
      return;
    }

    if (status.isLoaded && !status.playing && !status.isBuffering) {
      setRadioState((prev) => {
        if (
          prev === "playing" ||
          prev === "buffering" ||
          prev === "loading" ||
          prev === "reconnecting"
        ) {
          queueRetry();
        }
        return prev;
      });
    }
  }, [
    clearRetryTimer,
    player,
    queueRetry,
    status.isBuffering,
    status.isLoaded,
    status.playing,
    status.timeControlStatus,
  ]);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (
        state === "active" &&
        shouldPlayRef.current &&
        (radioState === "loading" ||
          radioState === "buffering" ||
          radioState === "reconnecting")
      ) {
        startPlayback();
      }
    });

    return () => sub.remove();
  }, [radioState, startPlayback]);

  useEffect(() => {
    return () => {
      clearRetryTimer();
      clearLockScreenControls(player);
      player.remove();
    };
  }, [clearRetryTimer, player]);

  const value = useMemo<RadioPlayerContextValue>(
    () => ({
      radioState,
      retryAttempt,
      playPause:
        radioState === "playing" ||
        radioState === "buffering" ||
        radioState === "loading"
          ? pausePlayback
          : startPlayback,
      retry: startPlayback,
    }),
    [pausePlayback, radioState, retryAttempt, startPlayback],
  );

  return (
    <RadioPlayerContext.Provider value={value}>
      {children}
    </RadioPlayerContext.Provider>
  );
}

export function useRadioPlayer() {
  const context = useContext(RadioPlayerContext);

  if (!context) {
    throw new Error("useRadioPlayer must be used within a RadioPlayerProvider");
  }

  return context;
}
