import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useRef, useState } from 'react';
import { BackHandler, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { loadHomeStats, recordSession } from '../db';
import { hapticSuccess, hapticTap } from '../effects';
import { RootStackParamList } from '../navigation/types';
import { colors, fonts, radii, shadows, spacing, text } from '../theme';
import { formatDuration, formatFocusTime } from '../utils/time';

type Props = NativeStackScreenProps<RootStackParamList, 'SessionEnd'>;

export default function SessionEndScreen({ navigation, route }: Props) {
  const { startedAt, reachedFiveAt } = route.params;
  const [extending, setExtending] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(
    Math.floor((reachedFiveAt - startedAt) / 1000),
  );
  const [streak, setStreak] = useState<number>(0);
  const savedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    loadHomeStats().then((s) => {
      if (!cancelled) setStreak(s.currentDailyStreak);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!extending) return;
    const tick = () => setElapsedSec(Math.floor((Date.now() - startedAt) / 1000));
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [extending, startedAt]);

  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
      return () => sub.remove();
    }, []),
  );

  const finish = async (converted: boolean) => {
    if (savedRef.current) return;
    savedRef.current = true;
    hapticSuccess();
    const endedAt = Date.now();
    const dur = Math.max(1, Math.floor((endedAt - startedAt) / 1000));
    const result = await recordSession({
      startedAt,
      endedAt,
      durationSeconds: dur,
      converted,
    });
    navigation.navigate('Tabs', {
      screen: 'Home',
      params: result.newlyUnlocked.length
        ? { unlockedMilestones: result.newlyUnlocked }
        : undefined,
    });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.glow} />

      <View style={styles.topBar}>
        <View style={styles.avatar}>
          <View style={styles.avatarDot} />
        </View>
        <Text style={styles.topBarTitle}>Focus</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={styles.headline}>
        <Text style={styles.title}>{extending ? 'Still going' : 'Well Done!'}</Text>
        <Text style={styles.subtitle}>
          {extending
            ? 'Stay with it. Stop whenever feels right.'
            : 'You completed your focus session.'}
        </Text>
      </View>

      <View style={styles.discWrap}>
        <View style={styles.disc}>
          <Text style={styles.discValue}>{formatDuration(elapsedSec)}</Text>
          <Text style={styles.discCaption}>{extending ? 'STILL GOING' : 'MINUTES'}</Text>
        </View>
      </View>

      {!extending && (
        <View style={styles.cardsRow}>
          <View style={styles.card}>
            <Text style={styles.cardEyebrow}>SESSION</Text>
            <Text style={styles.cardValue}>{formatFocusTime(elapsedSec)}</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardEyebrow}>STREAK</Text>
            <Text style={styles.cardValue}>
              {streak} {streak === 1 ? 'Day' : 'Days'}
            </Text>
          </View>
        </View>
      )}

      <View style={styles.actions}>
        {!extending ? (
          <>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                hapticTap();
                setExtending(true);
              }}
              style={({ pressed }) => [styles.primary, pressed && styles.primaryPressed]}
            >
              <Text style={styles.primaryText}>Keep Going</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => finish(false)}
              style={({ pressed }) => [styles.secondary, pressed && { opacity: 0.7 }]}
            >
              <Text style={styles.secondaryText}>I&apos;m Done</Text>
            </Pressable>
          </>
        ) : (
          <Pressable
            accessibilityRole="button"
            onPress={() => finish(true)}
            style={({ pressed }) => [styles.primary, pressed && styles.primaryPressed]}
          >
            <Text style={styles.primaryText}>Done</Text>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  glow: {
    position: 'absolute',
    top: -120,
    right: -120,
    width: 360,
    height: 360,
    borderRadius: 9999,
    backgroundColor: 'rgba(196, 234, 185, 0.18)',
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
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.borderRing,
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

  headline: {
    alignItems: 'center',
    marginTop: spacing.xl,
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 32,
    letterSpacing: -0.6,
    color: colors.primary,
    textAlign: 'center',
  },
  subtitle: {
    ...text.body,
    color: colors.textBody,
    textAlign: 'center',
    opacity: 0.8,
  },

  discWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  disc: {
    width: 220,
    height: 220,
    borderRadius: 9999,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    ...shadows.cardSoft,
  },
  discValue: {
    fontFamily: fonts.bold,
    fontSize: 48,
    letterSpacing: -1,
    color: colors.primary,
    fontVariant: ['tabular-nums'],
  },
  discCaption: {
    fontFamily: fonts.regular,
    fontSize: 12,
    letterSpacing: 1.2,
    color: colors.primary,
    opacity: 0.65,
  },

  cardsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: 'rgba(193, 201, 187, 0.2)',
  },
  cardEyebrow: {
    fontFamily: fonts.regular,
    fontSize: 12,
    letterSpacing: 0.6,
    color: colors.textBody,
  },
  cardValue: { ...text.h3, color: colors.primary, fontFamily: fonts.semibold },

  actions: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.sm,
  },
  primary: {
    paddingVertical: 20,
    borderRadius: radii.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.cta,
  },
  primaryPressed: { backgroundColor: colors.primaryDeep, transform: [{ scale: 0.99 }] },
  primaryText: { ...text.cta, color: colors.textOnDark },
  secondary: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryText: { ...text.body, color: colors.primary, fontFamily: fonts.semibold },
});
