import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { loadUserProfile } from './db';

let cachedPrefs: { sound: boolean; haptics: boolean } | null = null;

export function invalidateEffectsCache(): void {
  cachedPrefs = null;
}

async function getPrefs(): Promise<{ sound: boolean; haptics: boolean }> {
  if (cachedPrefs) return cachedPrefs;
  const p = await loadUserProfile();
  cachedPrefs = { sound: p.soundEnabled, haptics: p.hapticsEnabled };
  return cachedPrefs;
}

let chimePlayer: AudioPlayer | null = null;
let audioModeReady = false;

async function ensureAudioMode(): Promise<void> {
  if (audioModeReady) return;
  try {
    await setAudioModeAsync({
      playsInSilentMode: false,
      shouldPlayInBackground: false,
    });
    audioModeReady = true;
  } catch {
    audioModeReady = true;
  }
}

function getChimePlayer(): AudioPlayer | null {
  if (!chimePlayer) {
    try {
      chimePlayer = createAudioPlayer(require('../assets/sounds/chime.wav'));
    } catch {
      chimePlayer = null;
    }
  }
  return chimePlayer;
}

export async function playChime(): Promise<void> {
  const prefs = await getPrefs();
  if (!prefs.sound) return;
  await ensureAudioMode();
  const player = getChimePlayer();
  if (!player) return;
  try {
    player.seekTo(0);
    player.play();
  } catch {
    // ignore audio playback errors silently
  }
}

export async function hapticTap(): Promise<void> {
  const prefs = await getPrefs();
  if (!prefs.haptics) return;
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch {
    // ignore haptics failures (simulator, web)
  }
}

export async function hapticSuccess(): Promise<void> {
  const prefs = await getPrefs();
  if (!prefs.haptics) return;
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch {
    // ignore
  }
}

export async function hapticWarning(): Promise<void> {
  const prefs = await getPrefs();
  if (!prefs.haptics) return;
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  } catch {
    // ignore
  }
}
