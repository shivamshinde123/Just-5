import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/manrope';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import HomeScreen from './src/screens/HomeScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import SessionEndScreen from './src/screens/SessionEndScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import StatsScreen from './src/screens/StatsScreen';
import TimerScreen from './src/screens/TimerScreen';
import { MainTabParamList, RootStackParamList } from './src/navigation/types';
import { colors, fonts, radii } from './src/theme';

const RootStack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.bg,
    card: colors.bg,
    text: colors.text,
    border: colors.border,
    primary: colors.primary,
  },
};

function TabIcon({
  glyph,
  active,
}: {
  glyph: 'home' | 'insights' | 'profile';
  active: boolean;
}) {
  const tint = active ? colors.primaryDeep : colors.navInactive;
  if (glyph === 'home') {
    return (
      <View style={tabIconStyles.icon}>
        <View style={[tabIconStyles.homeBase, { borderColor: tint }]} />
        <View style={[tabIconStyles.homeRoof, { borderBottomColor: tint }]} />
      </View>
    );
  }
  if (glyph === 'insights') {
    return (
      <View style={tabIconStyles.iconRow}>
        <View style={[tabIconStyles.bar, { height: 6, backgroundColor: tint }]} />
        <View style={[tabIconStyles.bar, { height: 12, backgroundColor: tint }]} />
        <View style={[tabIconStyles.bar, { height: 9, backgroundColor: tint }]} />
      </View>
    );
  }
  return (
    <View style={tabIconStyles.icon}>
      <View style={[tabIconStyles.profileHead, { borderColor: tint }]} />
      <View style={[tabIconStyles.profileBody, { borderColor: tint }]} />
    </View>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarStyle: {
          backgroundColor: colors.navBar,
          borderTopColor: colors.navBorder,
          borderTopWidth: 1,
          height: 84,
          paddingTop: 12,
          paddingBottom: 24,
          borderTopLeftRadius: radii.xxl,
          borderTopRightRadius: radii.xxl,
          position: 'absolute',
          elevation: 0,
        },
        tabBarLabelStyle: {
          fontFamily: fonts.medium,
          fontSize: 11,
          letterSpacing: 0.275,
          textTransform: 'uppercase',
          marginTop: 4,
        },
        tabBarActiveTintColor: colors.primaryDeep,
        tabBarInactiveTintColor: colors.navInactive,
        sceneStyle: { backgroundColor: colors.bg },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ focused }) => <TabIcon glyph="home" active={focused} />,
        }}
      />
      <Tab.Screen
        name="Stats"
        component={StatsScreen}
        options={{
          tabBarLabel: 'Insights',
          tabBarIcon: ({ focused }) => <TabIcon glyph="insights" active={focused} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ focused }) => <TabIcon glyph="profile" active={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  const [loaded] = useFonts({
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
  });

  if (!loaded) {
    return <View style={styles.loading} />;
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer theme={navTheme}>
        <RootStack.Navigator
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.bg },
            animation: 'fade',
          }}
        >
          <RootStack.Screen name="Tabs" component={MainTabs} />
          <RootStack.Screen
            name="Timer"
            component={TimerScreen}
            options={{ gestureEnabled: false, animation: 'fade' }}
          />
          <RootStack.Screen
            name="SessionEnd"
            component={SessionEndScreen}
            options={{ gestureEnabled: false, animation: 'fade' }}
          />
          <RootStack.Screen
            name="Settings"
            component={SettingsScreen}
            options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
          />
        </RootStack.Navigator>
        <StatusBar style="dark" />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, backgroundColor: colors.bg },
});

const tabIconStyles = StyleSheet.create({
  icon: { width: 22, height: 22, alignItems: 'center', justifyContent: 'flex-end' },
  iconRow: {
    width: 22,
    height: 22,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 2,
  },
  bar: { width: 4, borderRadius: 1.5 },
  homeBase: {
    width: 16,
    height: 12,
    borderWidth: 1.6,
    borderRadius: 2,
  },
  homeRoof: {
    position: 'absolute',
    top: 0,
    width: 0,
    height: 0,
    borderLeftWidth: 11,
    borderRightWidth: 11,
    borderBottomWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  profileHead: {
    width: 9,
    height: 9,
    borderRadius: 9,
    borderWidth: 1.6,
    marginBottom: 2,
  },
  profileBody: {
    width: 16,
    height: 9,
    borderTopLeftRadius: 9,
    borderTopRightRadius: 9,
    borderWidth: 1.6,
    borderBottomWidth: 0,
  },
});
