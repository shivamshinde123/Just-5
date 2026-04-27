import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  loadUserProfile,
  resetAllData,
  setHapticsEnabled,
  setSoundEnabled,
  updateDisplayName,
  type UserProfile,
} from '../db';
import { invalidateEffectsCache } from '../effects';
import { RootStackParamList } from '../navigation/types';
import { colors, fonts, radii, shadows, spacing, text } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

export default function SettingsScreen({ navigation }: Props) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [nameDraft, setNameDraft] = useState('');
  const [savingName, setSavingName] = useState(false);

  useEffect(() => {
    loadUserProfile().then((p) => {
      setProfile(p);
      setNameDraft(p.displayName);
    });
  }, []);

  const onSaveName = async () => {
    if (!profile) return;
    setSavingName(true);
    await updateDisplayName(nameDraft);
    const fresh = await loadUserProfile();
    setProfile(fresh);
    setNameDraft(fresh.displayName);
    setSavingName(false);
  };

  const onToggleSound = async (value: boolean) => {
    if (!profile) return;
    setProfile({ ...profile, soundEnabled: value });
    await setSoundEnabled(value);
    invalidateEffectsCache();
  };

  const onToggleHaptics = async (value: boolean) => {
    if (!profile) return;
    setProfile({ ...profile, hapticsEnabled: value });
    await setHapticsEnabled(value);
    invalidateEffectsCache();
  };

  const onReset = () => {
    Alert.alert(
      'Reset all data?',
      'This will permanently delete every session, streak, and milestone. Your profile name and settings will be kept. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset everything',
          style: 'destructive',
          onPress: async () => {
            await resetAllData();
            navigation.goBack();
          },
        },
      ],
    );
  };

  const nameDirty = profile != null && nameDraft.trim() !== profile.displayName;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close settings"
          onPress={() => navigation.goBack()}
          hitSlop={12}
        >
          <Text style={styles.close}>‹ Close</Text>
        </Pressable>
        <Text style={styles.title}>Settings</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>PROFILE</Text>
          <View style={styles.card}>
            <Text style={styles.fieldLabel}>Display name</Text>
            <TextInput
              style={styles.input}
              value={nameDraft}
              onChangeText={setNameDraft}
              placeholder="Your name"
              placeholderTextColor={colors.textMuted}
              maxLength={40}
              autoCorrect={false}
            />
            {nameDirty && (
              <Pressable
                accessibilityRole="button"
                onPress={onSaveName}
                disabled={savingName}
                style={({ pressed }) => [styles.saveBtn, pressed && { opacity: 0.7 }]}
              >
                <Text style={styles.saveBtnText}>{savingName ? 'Saving…' : 'Save'}</Text>
              </Pressable>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>PREFERENCES</Text>
          <View style={styles.card}>
            <ToggleRow
              label="Sound"
              hint="Play a chime when 5 minutes are up"
              value={profile?.soundEnabled ?? true}
              onChange={onToggleSound}
            />
            <View style={styles.divider} />
            <ToggleRow
              label="Haptics"
              hint="Buzz on session start and end"
              value={profile?.hapticsEnabled ?? true}
              onChange={onToggleHaptics}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>DANGER ZONE</Text>
          <View style={styles.card}>
            <Pressable
              accessibilityRole="button"
              onPress={onReset}
              style={({ pressed }) => [styles.dangerRow, pressed && { opacity: 0.7 }]}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.dangerLabel}>Reset all data</Text>
                <Text style={styles.fieldHint}>
                  Delete every session, streak, and milestone.
                </Text>
              </View>
              <Text style={styles.dangerArrow}>›</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>ABOUT</Text>
          <View style={styles.card}>
            <View style={styles.aboutRow}>
              <Text style={styles.fieldLabel}>Just 5</Text>
              <Text style={styles.aboutValue}>The commitment trick.</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.aboutRow}>
              <Text style={styles.fieldLabel}>Storage</Text>
              <Text style={styles.aboutValue}>Local, on this device only.</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function ToggleRow({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <View style={styles.toggleRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.fieldLabel}>{label}</Text>
        {hint && <Text style={styles.fieldHint}>{hint}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: colors.border, true: colors.mint }}
        thumbColor={value ? colors.primary : '#FFFFFF'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  close: {
    fontFamily: fonts.semibold,
    fontSize: 16,
    color: colors.primary,
    width: 60,
  },
  title: { ...text.h2, color: colors.text },
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxl * 2 },

  section: { gap: spacing.sm },
  sectionLabel: {
    ...text.eyebrow,
    color: colors.textMuted,
    paddingLeft: spacing.xs,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    ...shadows.card,
    gap: spacing.sm,
  },
  fieldLabel: { ...text.body, color: colors.text, fontFamily: fonts.semibold },
  fieldHint: { ...text.bodyTight, color: colors.textMuted, marginTop: 2 },
  input: {
    fontFamily: fonts.regular,
    fontSize: 16,
    color: colors.text,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  saveBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
  },
  saveBtnText: { ...text.bodyTight, color: colors.textOnDark, fontFamily: fonts.semibold },

  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: 4 },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.xs },

  dangerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: 4 },
  dangerLabel: { ...text.body, color: '#B45253', fontFamily: fonts.semibold },
  dangerArrow: { fontSize: 22, color: colors.textMuted },

  aboutRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  aboutValue: { ...text.body, color: colors.textBody },
});
