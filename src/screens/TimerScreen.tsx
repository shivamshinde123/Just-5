import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, BackHandler, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { recordSession } from '../db';
import { RootStackParamList } from '../navigation/types';
import { colors, radii, spacing } from '../theme';
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
        navigation.replace('SessionEnd', { startedAt, reachedFiveAt });
      }
    };
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
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
            const endedAt = Date.now();
            const dur = Math.floor((endedAt - startedAt) / 1000);
            if (dur >= 60) {
              await recordSession({
                startedAt,
                endedAt,
                durationSeconds: dur,
                converted: false,
              });
            }
            navigation.popToTop();
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
      <View style={styles.container}>
        <Text style={styles.label}>Focus</Text>
        <Text style={styles.timer}>{formatDuration(elapsedSec)}</Text>
        <Text style={styles.hint}>
          {remaining > 0 ? `${formatDuration(remaining)} until you decide` : 'Almost there...'}
        </Text>

        <Pressable
          accessibilityRole="button"
          onPress={promptCancel}
          style={({ pressed }) => [styles.cancel, pressed && { opacity: 0.6 }]}
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  label: {
    color: colors.textMuted,
    fontSize: 14,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: spacing.md,
  },
  timer: {
    color: colors.text,
    fontSize: 96,
    fontWeight: '300',
    fontVariant: ['tabular-nums'],
    letterSpacing: 2,
  },
  hint: { color: colors.textMuted, fontSize: 14, marginTop: spacing.md },
  cancel: {
    position: 'absolute',
    bottom: spacing.xl,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelText: { color: colors.textMuted, fontSize: 14, letterSpacing: 1 },
});
