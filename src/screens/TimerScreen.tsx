import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, AppState, BackHandler, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { recordSession } from '../db';
import { hapticSuccess, hapticWarning, playChime } from '../effects';
import type { MilestoneKey } from '../gamification';
import { RootStackParamList } from '../navigation/types';
import { colors, fonts, radii, shadows, spacing, text } from '../theme';
import { FIVE_MINUTES_SECONDS, formatDuration } from '../utils/time';

type Props = NativeStackScreenProps<RootStackParamList, 'Timer'>;

export default function TimerScreen({ navigation, route }: Props) {
  const { startedAt } = route.params;
  const [elapsedSec, setElapsedSec] = useState(0);
  const transitionedRef = useRef(false);
  const reachedFiveAt = startedAt + FIVE_MINUTES_SECONDS * 1000;

  useEffect(() => {
    const tick = () => {
      const now = Date.now();
      setElapsedSec(Math.floor((now - startedAt) / 1000));
      if (!transitionedRef.current && now >= reachedFiveAt) {
        transitionedRef.current = true;
        playChime();
        hapticSuccess();
        navigation.replace('SessionEnd', { startedAt, reachedFiveAt });
      }
    };
    tick();
    const id = setInterval(tick, 250);
    const appSub = AppState.addEventListener('change', (state) => {
      if (state === 'active') tick();
    });
    return () => {
      clearInterval(id);
      appSub.remove();
    };
  }, [startedAt, reachedFiveAt, navigation]);

  const promptCancel = useCallback(() => {
    Alert.alert(
      'Cancel session?',
      'Sessions under 1 minute are discarded; longer ones are saved as not-converted.',
      [
        { text: 'Keep going', style: 'cancel' },
        {
          text: 'Cancel session',
          style: 'destructive',
          onPress: async () => {
            hapticWarning();
            const endedAt = Date.now();
            const dur = Math.floor((endedAt - startedAt) / 1000);
            let unlocked: MilestoneKey[] = [];
            if (dur >= 60) {
              const result = await recordSession({
                startedAt,
                endedAt,
                durationSeconds: dur,
                converted: false,
              });
              unlocked = result.newlyUnlocked;
            }
            navigation.navigate('Tabs', {
              screen: 'Home',
              params: unlocked.length ? { unlockedMilestones: unlocked } : undefined,
            });
          },
        },
      ],
    );
  }, [startedAt, navigation]);

  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        promptCancel();
        return true;
      });
      return () => sub.remove();
    }, [promptCancel]),
  );

  const remaining = Math.max(0, FIVE_MINUTES_SECONDS - elapsedSec);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.glowLeft} />
      <View style={styles.glowRight} />

      <View style={styles.topBar}>
        <View style={styles.avatar}>
          <View style={styles.avatarDot} />
        </View>
        <Text style={styles.topBarTitle}>Focus</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={styles.statusPill}>
        <View style={styles.statusDot} />
        <Text style={styles.statusText}>TRACKING FOCUS</Text>
      </View>

      <View style={styles.center}>
        <View style={styles.ringOuter}>
          <View style={styles.ringInner}>
            <Text style={styles.eyebrow}>LIVE SESSION</Text>
            <Text style={styles.timer}>{formatDuration(elapsedSec)}</Text>
            <Text style={styles.caption}>
              {remaining > 0 ? `${formatDuration(remaining)} until you decide` : 'Almost there…'}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="End session"
          onPress={promptCancel}
          style={({ pressed }) => [styles.endButton, pressed && styles.endButtonPressed]}
        >
          <Text style={styles.endButtonText}>End Session</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={promptCancel}
          style={({ pressed }) => [styles.cancelLink, pressed && { opacity: 0.6 }]}
        >
          <Text style={styles.cancelLinkText}>Cancel</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  glowLeft: {
    position: 'absolute',
    top: '20%',
    left: -80,
    width: 320,
    height: 320,
    borderRadius: 9999,
    backgroundColor: 'rgba(69, 103, 64, 0.06)',
  },
  glowRight: {
    position: 'absolute',
    top: '40%',
    right: -100,
    width: 320,
    height: 320,
    borderRadius: 9999,
    backgroundColor: 'rgba(57, 105, 52, 0.05)',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: radii.pill,
    backgroundColor: colors.mint,
    borderWidth: 2,
    borderColor: colors.primaryMid,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarDot: {
    width: 12,
    height: 12,
    borderRadius: radii.pill,
    backgroundColor: colors.primary,
  },
  topBarTitle: { ...text.h3, color: colors.primaryDeep, letterSpacing: -0.4 },

  statusPill: {
    flexDirection: 'row',
    alignSelf: 'center',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    backgroundColor: colors.surface,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.cardBorderTan,
    marginTop: spacing.lg,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary },
  statusText: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    letterSpacing: 1.2,
    color: colors.primary,
  },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  ringOuter: {
    width: 320,
    height: 320,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.ringOuter,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringInner: {
    width: 280,
    height: 280,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.ringInner,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  eyebrow: {
    fontFamily: fonts.medium,
    fontSize: 12,
    letterSpacing: 2.4,
    color: colors.primaryEyebrow,
  },
  timer: {
    fontFamily: fonts.extrabold,
    fontSize: 76,
    letterSpacing: -3,
    color: colors.primary,
    fontVariant: ['tabular-nums'],
  },
  caption: { ...text.body, color: colors.textBody, textAlign: 'center' },

  actions: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
  endButton: {
    paddingVertical: 22,
    borderRadius: radii.xxl,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.ctaSoft,
  },
  endButtonPressed: { backgroundColor: colors.primaryDeep, transform: [{ scale: 0.99 }] },
  endButtonText: { ...text.cta, color: colors.textOnDark },
  cancelLink: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  cancelLinkText: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: colors.primary,
    letterSpacing: 0.14,
  },
});
