import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useRef, useState } from 'react';
import { BackHandler, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { recordSession } from '../db';
import { RootStackParamList } from '../navigation/types';
import { colors, radii, spacing } from '../theme';
import { formatDuration } from '../utils/time';

type Props = NativeStackScreenProps<RootStackParamList, 'SessionEnd'>;

export default function SessionEndScreen({ navigation, route }: Props) {
  const { startedAt, reachedFiveAt } = route.params;
  const [extending, setExtending] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(
    Math.floor((reachedFiveAt - startedAt) / 1000),
  );
  const savedRef = useRef(false);

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
    const endedAt = Date.now();
    const dur = Math.max(1, Math.floor((endedAt - startedAt) / 1000));
    const result = await recordSession({
      startedAt,
      endedAt,
      durationSeconds: dur,
      converted,
    });
    navigation.navigate(
      'Home',
      result.newlyUnlocked.length ? { unlockedMilestones: result.newlyUnlocked } : undefined,
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.container}>
        <View style={styles.top}>
          <Text style={styles.label}>{extending ? 'Still going' : 'Five minutes done'}</Text>
          <Text style={styles.timer}>{formatDuration(elapsedSec)}</Text>
          {!extending && (
            <Text style={styles.hint}>You started. That was the hard part.</Text>
          )}
        </View>

        <View style={styles.actions}>
          {!extending ? (
            <>
              <Pressable
                accessibilityRole="button"
                onPress={() => setExtending(true)}
                style={({ pressed }) => [styles.primary, pressed && styles.primaryPressed]}
              >
                <Text style={styles.primaryText}>Keep going</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={() => finish(false)}
                style={({ pressed }) => [styles.secondary, pressed && { opacity: 0.7 }]}
              >
                <Text style={styles.secondaryText}>I&apos;m done</Text>
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
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { flex: 1, padding: spacing.lg, justifyContent: 'space-between' },
  top: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  label: {
    color: colors.success,
    fontSize: 14,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: spacing.md,
  },
  timer: {
    color: colors.text,
    fontSize: 80,
    fontWeight: '300',
    fontVariant: ['tabular-nums'],
    letterSpacing: 2,
  },
  hint: { color: colors.textMuted, fontSize: 14, marginTop: spacing.md, textAlign: 'center' },
  actions: { gap: spacing.md },
  primary: {
    height: 64,
    borderRadius: radii.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryPressed: { backgroundColor: colors.primaryPressed, transform: [{ scale: 0.99 }] },
  primaryText: { color: colors.text, fontSize: 18, fontWeight: '600', letterSpacing: 0.5 },
  secondary: {
    height: 56,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryText: { color: colors.textMuted, fontSize: 16, letterSpacing: 0.5 },
});
